// scripts/jira-verify-final.mjs
import fs from "fs";
import path from "path";
const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
const auth = "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  return res.json();
}

// 1. Verificar que SCRUM-218, 219, 220 NO existen
console.log("=== TICKETS BORRADOS (SCRUM-218, 219, 220) ===");
for (const key of ["SCRUM-218", "SCRUM-219", "SCRUM-220"]) {
  const r = await api(`/rest/api/3/issue/${key}`);
  console.log(`  ${key}: ${r.errorMessages ? "✓ Borrado (no existe)" : "✗ AÚN EXISTE"}`);
}

// 2. Verificar los 8 tickets nuevos de Edwin en Sprint 4
console.log("\n=== 8 TICKETS NUEVOS DE EDWIN (SCRUM-338 a SCRUM-345) ===");
const newTickets = await api(
  `/rest/api/3/search/jql?jql=${encodeURIComponent("key in (SCRUM-338, SCRUM-339, SCRUM-340, SCRUM-341, SCRUM-342, SCRUM-343, SCRUM-344, SCRUM-345)")}&fields=summary,status,assignee,customfield_10020,labels`
);
newTickets.issues.forEach((i) => {
  const sprints = (i.fields.customfield_10020 || []).map((s) => s.name).join(",");
  const labels = (i.fields.labels || []).join(",");
  console.log(`  ${i.key} [${sprints}] [${i.fields.status.name}] [${i.fields.assignee?.displayName || "none"}]`);
  console.log(`    ${i.fields.summary}`);
  console.log(`    Labels: ${labels}`);
});

// 3. Verificar los 21 tickets históricos finalizados
console.log("\n=== 21 TICKETS HISTÓRICOS (SCRUM-367 a SCRUM-387) ===");
const histTickets = await api(
  `/rest/api/3/search/jql?jql=${encodeURIComponent("key in (SCRUM-367, SCRUM-368, SCRUM-369, SCRUM-370, SCRUM-371, SCRUM-372, SCRUM-373, SCRUM-374, SCRUM-375, SCRUM-376, SCRUM-377, SCRUM-378, SCRUM-379, SCRUM-380, SCRUM-381, SCRUM-382, SCRUM-383, SCRUM-384, SCRUM-385, SCRUM-386, SCRUM-387)")}&fields=summary,status,assignee,labels&maxResults=50`
);
histTickets.issues.forEach((i) => {
  console.log(`  ${i.key} [${i.fields.status.name}] [${i.fields.assignee?.displayName || "none"}] ${i.fields.summary}`);
});

// 4. Verificar que los tickets de otros miembros siguen intactos
console.log("\n=== TICKETS DE OTROS MIEMBROS (NO TOCADOS) ===");
const others = await api(
  `/rest/api/3/search/jql=${encodeURIComponent("project = SCRUM AND (assignee in (712020:539a840e-f7b9-4d1f-9be3-7f874c7d3332, 712020:eab89b92-8673-4150-b3ae-864ee56918a2, 712020:b2f8a433-6b01-4755-a3cb-b1ebb4a1d865, 712020:8438e249-2ea0-49f1-9fd8-463ec6c8c9dc) AND status != Finalizada")}&maxResults=20&fields=summary,status,assignee,customfield_10020`
);
console.log(`Total abiertos de otros: ${others.issues ? others.issues.length : 0}`);
if (others.issues) {
  others.issues.slice(0, 10).forEach((i) => {
    const sprints = (i.fields.customfield_10020 || []).map((s) => s.name).join(",");
    console.log(`  ${i.key} [${sprints}] [${i.fields.assignee?.displayName}] ${i.fields.summary.slice(0, 60)}`);
  });
}
