// scripts/jira-page3.mjs
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

let nextPageToken = null;
let pageCount = 0;
const allIssues = [];

while (true) {
  let url =
    env.JIRA_BASE_URL +
    "/rest/api/3/search/jql?jql=" +
    encodeURIComponent("project = SCRUM") +
    "&maxResults=100&fields=summary,status,labels,issuetype,customfield_10020,created";
  if (nextPageToken) url += "&nextPageToken=" + nextPageToken;
  const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const data = await res.json();
  if (!data.issues) break;
  allIssues.push(...data.issues);
  pageCount++;
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
  if (pageCount > 30) break;
}

const sprintMap = new Map();
const sprintIssues = new Map();
allIssues.forEach((i) => {
  const sprints = i.fields.customfield_10020 || [];
  sprints.forEach((s) => {
    if (!sprintMap.has(s.id)) {
      sprintMap.set(s.id, s);
      sprintIssues.set(s.id, []);
    }
    sprintIssues.get(s.id).push(i);
  });
});

console.log("=== SPRINTS EN USO ===");
Array.from(sprintMap.entries())
  .sort((a, b) => (a[1].startDate || "").localeCompare(b[1].startDate || ""))
  .forEach(([id, s]) => {
    const issues = sprintIssues.get(id) || [];
    const open = issues.filter((i) => i.fields.status.name !== "Finalizada").length;
    console.log(
      `  Sprint ${id} [${s.state}]: ${s.name} — ${issues.length} issues (${open} abiertas)`
    );
  });

console.log("\n=== ISSUES EN SPRINT 4 (id=42) ===");
const sprint4Issues = sprintIssues.get(42) || [];
console.log(`Total: ${sprint4Issues.length}`);
sprint4Issues.forEach((i) => {
  console.log(
    `  [${i.key}] ${i.fields.issuetype.name} | ${i.fields.status.name} | ${i.fields.summary} | Labels: ${(i.fields.labels || []).join(",")}`
  );
});

console.log("\n=== ISSUES ABIERTAS EN EL PROYECTO (no finalizadas) ===");
const openIssues = allIssues.filter((i) => i.fields.status.name !== "Finalizada");
console.log(`Total: ${openIssues.length}`);
openIssues.forEach((i) => {
  const sprints = (i.fields.customfield_10020 || []).map((s) => s.id).join(",");
  console.log(
    `  [${i.key}] ${i.fields.issuetype.name} | ${i.fields.status.name} | Sprint: ${sprints || "none"} | ${i.fields.summary}`
  );
});
