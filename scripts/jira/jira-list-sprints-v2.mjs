// scripts/jira-list-sprints-v2.mjs
import fs from "fs";
import path from "path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const env = {};
fs.readFileSync(envLocalPath, "utf-8")
  .split(/\r?\n/)
  .forEach((line) => {
    const t = line.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });

const auth =
  "Basic " +
  Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

const jql = encodeURIComponent("project = SCRUM ORDER BY created DESC");
let startAt = 0;
const sprintMap = new Map();
let totalIssues = 0;

while (true) {
  const url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=${jql}&maxResults=100&startAt=${startAt}&fields=summary,status,sprint`;
  const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const data = await res.json();
  if (!data.issues) break;
  totalIssues += data.issues.length;
  data.issues.forEach((i) => {
    if (i.fields.sprint && Array.isArray(i.fields.sprint)) {
      i.fields.sprint.forEach((s) => {
        sprintMap.set(s.id, { name: s.name, state: s.state, startDate: s.startDate, endDate: s.endDate });
      });
    }
  });
  if (data.issues.length < 100) break;
  startAt += 100;
}

console.log("=== SPRINTS EN USO ===");
Array.from(sprintMap.entries())
  .sort((a, b) => (a[1].startDate || "").localeCompare(b[1].startDate || ""))
  .forEach(([id, s]) => {
    console.log(
      `  Sprint ${id} [${s.state}]: ${s.name} (${s.startDate ? s.startDate.slice(0, 10) : "-"} → ${s.endDate ? s.endDate.slice(0, 10) : "-"})`
    );
  });
console.log(`\nTotal issues escaneadas: ${totalIssues}`);
