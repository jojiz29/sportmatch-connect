// scripts/jira-list-sprints.mjs
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
const url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=${jql}&maxResults=200&fields=summary,status,labels,issuetype,sprint`;

const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
const data = await res.json();

const sprintMap = new Map();
data.issues.forEach((i) => {
  if (i.fields.sprint) {
    i.fields.sprint.forEach((s) => {
      sprintMap.set(s.id, s.name + " (state=" + s.state + ")");
    });
  }
});

console.log("=== SPRINTS EN USO ===");
sprintMap.forEach((v, k) => console.log(`  Sprint ${k}: ${v}`));
console.log("\nTotal issues:", data.issues.length);
