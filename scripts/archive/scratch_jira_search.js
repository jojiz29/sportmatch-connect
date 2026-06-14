import fs from "fs";
import path from "path";

// Parse .env.local
const envLocalPath = ".env.local";
const env = {};
if (fs.existsSync(envLocalPath)) {
  const fileContent = fs.readFileSync(envLocalPath, "utf-8");
  fileContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      const cleanVal = val.replace(/^['"]|['"]$/g, "");
      env[key] = cleanVal;
    }
  });
}

const baseUrl = env.JIRA_BASE_URL || "https://edwinfloress.atlassian.net";
const email = env.JIRA_USER_EMAIL || "ejuniorfloress@gmail.com";
const token = env.JIRA_API_TOKEN;
const auth = Buffer.from(`${email}:${token}`).toString("base64");

async function main() {
  try {
    console.log("Searching all JIRA issues in project SCRUM...");
    const jql = encodeURIComponent(`project = SCRUM`);
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${jql}&maxResults=100&fields=summary,status,assignee`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`);
    }

    const data = await res.json();
    console.log(`Found ${data.issues.length} issues in SCRUM:`);
    for (const issue of data.issues) {
      const summary = issue.fields.summary;
      const status = issue.fields.status.name;
      const assignee = issue.fields.assignee ? issue.fields.assignee.displayName : "Unassigned";
      console.log(`- ${issue.key}: ${summary} [Status: ${status}] [Assignee: ${assignee}]`);
    }
  } catch (err) {
    console.error("Error searching issues:", err);
  }
}

main();
