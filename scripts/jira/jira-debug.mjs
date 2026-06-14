// scripts/jira-debug.mjs
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
const url = env.JIRA_BASE_URL + "/rest/api/3/search/jql?jql=" + encodeURIComponent("project = SCRUM") + "&maxResults=1";
const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
console.log("Status:", res.status);
console.log("Status text:", res.statusText);
const text = await res.text();
console.log("Body (first 500):", text.slice(0, 500));
