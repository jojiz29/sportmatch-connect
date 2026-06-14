// scripts/jira-status-summary.mjs
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

const EDWIN_ID = "615b12b4289a54006a07b729";
let nextPageToken = null;
const all = [];
while (true) {
  let url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=` + encodeURIComponent(`sprint = 42 AND assignee = ${EDWIN_ID}`);
  if (nextPageToken) url += `&nextPageToken=${nextPageToken}`;
  url += "&fields=summary,status,labels&maxResults=100";
  const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const data = await res.json();
  if (!data.issues || data.issues.length === 0) break;
  all.push(...data.issues);
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
}

const byStatus = {};
const byAction = { implemented: [], partial: [], backlog: [] };
all.forEach((i) => {
  const status = i.fields.status.name;
  byStatus[status] = (byStatus[status] || 0) + 1;
  const labels = i.fields.labels || [];
  if (labels.includes("implemented")) byAction.implemented.push(i.key);
  else if (labels.includes("partial-implementation")) byAction.partial.push(i.key);
  else if (labels.includes("backlog")) byAction.backlog.push(i.key);
});

console.log("=== RESUMEN FINAL - 40 TICKETS DE EDWIN EN SPRINT 4 ===\n");
console.log("POR STATUS:");
Object.entries(byStatus).forEach(([s, c]) => console.log(`  ${s}: ${c}`));
console.log("\nPOR ACCIÓN DE IMPLEMENTACIÓN:");
console.log(`  ✓ IMPLEMENTED (${byAction.implemented.length}): ${byAction.implemented.join(", ")}`);
console.log(`  ◐ PARTIAL (${byAction.partial.length}): ${byAction.partial.join(", ")}`);
console.log(`  ○ BACKLOG (${byAction.backlog.length}): ${byAction.backlog.join(", ")}`);
