// scripts/jira-page.mjs
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

// nextPageToken-based pagination
let nextPageToken = null;
let pageCount = 0;
let totalIssues = 0;
const allIssues = [];

while (true) {
  let url =
    env.JIRA_BASE_URL +
    "/rest/api/3/search/jql?jql=" +
    encodeURIComponent("project = SCRUM") +
    "&maxResults=100&fields=summary,status,labels,issuetype,sprint";
  if (nextPageToken) {
    url += "&nextPageToken=" + nextPageToken;
  }
  const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const data = await res.json();
  if (!data.issues) {
    console.log("No issues in page. Stopping.");
    break;
  }
  totalIssues += data.issues.length;
  pageCount++;
  allIssues.push(...data.issues);
  if (data.isLast || !data.nextPageToken) {
    console.log("Reached last page.");
    break;
  }
  nextPageToken = data.nextPageToken;
  if (pageCount > 30) {
    console.log("Safety break: 30 pages.");
    break;
  }
}

console.log(`Total pages: ${pageCount}, issues: ${totalIssues}`);

// Agrupar por sprint
const sprintMap = new Map();
allIssues.forEach((i) => {
  if (i.fields.sprint && Array.isArray(i.fields.sprint)) {
    i.fields.sprint.forEach((s) => {
      sprintMap.set(s.id, { name: s.name, state: s.state, startDate: s.startDate, endDate: s.endDate, count: (sprintMap.get(s.id)?.count || 0) + 1 });
    });
  } else if (i.fields.sprint && typeof i.fields.sprint === "object") {
    sprintMap.set(i.fields.sprint.id, { ...i.fields.sprint, count: (sprintMap.get(i.fields.sprint.id)?.count || 0) + 1 });
  }
});

console.log("\n=== SPRINTS ===");
Array.from(sprintMap.entries())
  .sort((a, b) => (a[1].startDate || "").localeCompare(b[1].startDate || ""))
  .forEach(([id, s]) => {
    console.log(`  Sprint ${id} [${s.state}]: ${s.name} (${s.startDate ? s.startDate.slice(0, 10) : "-"} → ${s.endDate ? s.endDate.slice(0, 10) : "-"}) — ${s.count} issues`);
  });
