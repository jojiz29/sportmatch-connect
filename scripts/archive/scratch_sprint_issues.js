import fs from "fs";

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
  console.log("Fetching issues for SCRUM Sprint 2 (ID: 41)...");
  const url = `${baseUrl}/rest/agile/1.0/sprint/41/issue?maxResults=100`;
  const res = await fetch(url, {
    headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
  });
  if (res.ok) {
    const data = await res.json();
    console.log(`Found ${data.issues.length} issues in SCRUM Sprint 2:`);
    for (const iss of data.issues) {
      console.log(`  - ${iss.key}: ${iss.fields.summary} [${iss.fields.status.name}]`);
    }
  } else {
    console.log("Failed to fetch sprint issues:", res.statusText);
  }
}
main();
