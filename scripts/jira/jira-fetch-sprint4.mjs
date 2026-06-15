// scripts/jira-fetch-sprint4.mjs
// Script temporal para inspeccionar Sprint 4
import fs from "fs";
import path from "path";

const envLocalPath = path.resolve(process.cwd(), ".env.local");
const env = {};
if (fs.existsSync(envLocalPath)) {
  fs.readFileSync(envLocalPath, "utf-8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith("#")) {
        const parts = trimmed.split("=");
        const key = parts[0].trim();
        const val = parts
          .slice(1)
          .join("=")
          .trim()
          .replace(/^['"]|['"]$/g, "");
        env[key] = val;
      }
    });
}

const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

const jql = encodeURIComponent("sprint = 4");
const url = `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,assignee,issuetype,labels,description`;

const res = await fetch(url, {
  headers: { Authorization: auth, Accept: "application/json" },
});
const data = await res.json();
console.log("Total issues en Sprint 4:", data.issues ? data.issues.length : 0);
if (data.issues) {
  data.issues.forEach((i) => {
    console.log(
      `[${i.key}] ${i.fields.issuetype.name} | ${i.fields.status.name} | ${i.fields.summary} | Labels: ${(i.fields.labels || []).join(",")}`,
    );
  });
}
