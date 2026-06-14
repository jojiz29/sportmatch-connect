// scripts/jira-count-issues.mjs
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

const url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=${encodeURIComponent("project = SCRUM")}&maxResults=1`;
const res = await fetch(url, { headers: { Authorization: auth, Accept: "application/json" } });
const data = await res.json();
console.log("Total issues SCRUM:", data.total);
