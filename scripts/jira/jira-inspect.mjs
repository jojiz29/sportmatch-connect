// scripts/jira-inspect.mjs
// Inspeccionar todos los sprints y buscar recomendaciones
import fs from "fs";
import path from "path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const env = {};
if (fs.existsSync(envLocalPath)) {
  fs.readFileSync(envLocalPath, "utf-8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const parts = trimmed.split("=");
        const key = parts[0].trim();
        const val = parts.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
        env[key] = val;
      }
    });
}

const auth =
  "Basic " +
  Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`${res.status}: ${await res.text()}`);
  return res.json();
}

// Obtener todos los boards
console.log("=== BOARDS ===");
const boards = await api("/rest/agile/1.0/board?maxResults=50");
boards.values.forEach((b) =>
  console.log(`Board ${b.id}: ${b.name}`)
);

// Obtener sprints del primer board
if (boards.values.length > 0) {
  const boardId = boards.values[0].id;
  console.log(`\n=== SPRINTS del board ${boardId} ===`);
  const sprints = await api(
    `/rest/agile/1.0/board/${boardId}/sprint?maxResults=50&state=active,future,closed`
  );
  sprints.values.forEach((s) =>
    console.log(
      `Sprint ${s.id} [${s.state}]: ${s.name} (start=${s.startDate || "-"}, end=${s.endDate || "-"})`
    )
  );
}

// Buscar issues con label "recommendation" o "recomendacion"
console.log("\n=== ISSUES con label 'recommendation' ===");
const jql = encodeURIComponent(`labels = recommendation OR labels = recomendaciones`);
try {
  const recs = await api(
    `/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,labels,sprint`
  );
  console.log(`Total: ${recs.issues ? recs.issues.length : 0}`);
  if (recs.issues) {
    recs.issues.forEach((i) =>
      console.log(
        `[${i.key}] ${i.fields.status.name} | ${i.fields.summary} | Labels: ${(i.fields.labels || []).join(",")}`
      )
    );
  }
} catch (e) {
  console.log("Error buscando recommendations:", e.message);
}

// Buscar TODAS las issues recientes del proyecto SCRUM
console.log("\n=== ÚLTIMAS 50 ISSUES del proyecto SCRUM ===");
const all = await api(
  `/rest/api/3/search/jql?jql=project%20%3D%20SCRUM%20ORDER%20BY%20created%20DESC&maxResults=50&fields=summary,status,labels,issuetype`
);
console.log(`Total: ${all.issues ? all.issues.length : 0}`);
if (all.issues) {
  all.issues.forEach((i) =>
    console.log(
      `[${i.key}] ${i.fields.issuetype.name} | ${i.fields.status.name} | ${i.fields.summary}`
    )
  );
}
