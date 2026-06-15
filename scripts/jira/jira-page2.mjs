// scripts/jira-page2.mjs
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

let nextPageToken = null;
let pageCount = 0;
let totalIssues = 0;

while (true) {
  let url =
    env.JIRA_BASE_URL +
    "/rest/api/3/search/jql?jql=" +
    encodeURIComponent("project = SCRUM") +
    "&maxResults=100&fields=*all";
  if (nextPageToken) {
    url += "&nextPageToken=" + nextPageToken;
  }
  const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
  const data = await res.json();
  if (!data.issues) break;
  // Print one sample with all keys
  if (pageCount === 0) {
    console.log(
      "Sample issue keys:",
      Object.keys(data.issues[0].fields).filter(
        (k) => k.toLowerCase().includes("sprint") || k.toLowerCase().includes("custom"),
      ),
    );
    console.log(
      "Sprint field sample:",
      JSON.stringify(
        data.issues[0].fields.customfield_10020 || data.issues[0].fields.sprint || "none",
        null,
        2,
      ),
    );
  }
  totalIssues += data.issues.length;
  pageCount++;
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
  if (pageCount > 30) break;
}
console.log(`Total: ${totalIssues}, pages: ${pageCount}`);
