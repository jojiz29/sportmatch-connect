// scripts/jira-final-epic-summary.mjs
import fs from "fs";
import path from "path";
const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p
        .slice(1)
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }
  });
const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint) {
  const r = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  return r.json();
}

const EDWIN_ID = "615b12b4289a54006a07b729";
const epics = [
  "SCRUM-388",
  "SCRUM-389",
  "SCRUM-390",
  "SCRUM-391",
  "SCRUM-392",
  "SCRUM-393",
  "SCRUM-394",
  "SCRUM-395",
  "SCRUM-396",
  "SCRUM-397",
  "SCRUM-291",
  "SCRUM-27",
  "SCRUM-329",
  "SCRUM-331",
  "SCRUM-11",
  "SCRUM-49",
];

console.log("=== DISTRIBUCIÓN DE LOS 40 TICKETS DE EDWIN EN ÉPICAS ===\n");
for (const epicKey of epics) {
  const data = await api(`/rest/api/3/issue/${epicKey}?fields=summary`);
  const epicName = data.fields.summary;
  // Buscar hijos asignados a Edwin
  const children = await api(
    `/rest/api/3/search/jql?jql=` +
      encodeURIComponent(`parent = ${epicKey} AND assignee = ${EDWIN_ID}`) +
      `&fields=summary,status&maxResults=50`,
  );
  const childCount = children.issues?.length || 0;
  if (childCount > 0) {
    console.log(`\n📂 ${epicKey}: ${epicName}`);
    children.issues.forEach((c) => {
      const status = c.fields.status.name;
      const icon = status === "Finalizada" ? "✅" : "🟡";
      console.log(`   ${icon} ${c.key} [${status}]: ${c.fields.summary}`);
    });
  }
}
