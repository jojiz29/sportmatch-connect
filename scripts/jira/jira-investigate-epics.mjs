// scripts/jira-investigate-epics.mjs
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

// 1) Listar TODAS las épicas existentes
console.log("=== ÉPICAS EXISTENTES EN EL PROYECTO ===");
let nextPageToken = null;
const epics = [];
while (true) {
  let url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=` + encodeURIComponent("project = SCRUM AND issuetype = Epic ORDER BY key ASC");
  if (nextPageToken) url += `&nextPageToken=${nextPageToken}`;
  url += "&fields=summary,labels&maxResults=100";
  const data = await api(url.replace(`${env.JIRA_BASE_URL}`, ""));
  if (!data.issues || data.issues.length === 0) break;
  epics.push(...data.issues);
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
}
epics.forEach((e) => console.log(`  ${e.key}: ${e.fields.summary}`));

// 2) Obtener el customFieldId para Epic Link
console.log("\n=== CUSTOM FIELDS RELACIONADOS A ÉPICA ===");
const fields = await api("/rest/api/3/field?maxResults=200");
const epicFields = fields.filter((f) => /epic|parent/i.test(f.name) && f.schema?.type !== "array");
epicFields.forEach((f) => console.log(`  ${f.id}: ${f.name} (type: ${f.schema?.type})`));
