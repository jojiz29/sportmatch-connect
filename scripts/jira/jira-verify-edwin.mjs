// scripts/jira-verify-edwin.mjs
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
const url =
  env.JIRA_BASE_URL +
  "/rest/api/3/search/jql?jql=" +
  encodeURIComponent(
    "key in (SCRUM-338, SCRUM-339, SCRUM-340, SCRUM-341, SCRUM-342, SCRUM-343, SCRUM-344, SCRUM-345)",
  ) +
  "&fields=summary,status,assignee,customfield_10020,labels";
const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
const d = await res.json();
if (!d.issues) {
  console.log("No issues");
} else {
  d.issues.forEach((i) => {
    const sprints = (i.fields.customfield_10020 || []).map((s) => s.name).join(", ");
    console.log(
      "[" +
        i.key +
        "] Sprint: " +
        sprints +
        " | Status: " +
        i.fields.status.name +
        " | Assignee: " +
        (i.fields.assignee?.displayName || "none") +
        " | " +
        i.fields.summary,
    );
  });
}
