// scripts/jira-meta.mjs
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

// Get issue types for SCRUM project
const meta = await fetch(env.JIRA_BASE_URL + "/rest/api/3/issue/createmeta?projectKeys=SCRUM&maxResults=50", {
  headers: { Authorization: auth, Accept: "application/json" },
});
const data = await meta.json();
console.log("Issue types for SCRUM:");
data.projects[0].issuetypes.forEach((t) =>
  console.log(`  ${t.id} - ${t.name} (subtask: ${t.subtask})`)
);

// Get Edwin's accountId
console.log("\n=== USERS ===");
const users = await fetch(env.JIRA_BASE_URL + "/rest/api/3/users/search?query=edwin", {
  headers: { Authorization: auth, Accept: "application/json" },
});
const ulist = await users.json();
ulist.forEach((u) => console.log(`  ${u.accountId} - ${u.displayName} (${u.emailAddress})`));
