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
  // Query Jira issues to see if any match the requested titles
  const queries = [
    "Secure Authentication Engine & WebP Photo Compression",
    "PostGIS Geography Point Storage & Dynamic Booking Pipeline",
    "Self-Exclusion Algorithm for Matchmaking Cards",
    "Real-time NewsFeed with Supabase Channel Subscriptions",
    "Haversine Formula Client-side Distance Tracker",
    "Squad Creation Foundations & Active UI Registration",
  ];

  for (const q of queries) {
    const jql = encodeURIComponent(`project = SCRUM and summary ~ "${q}"`);
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${jql}&fields=summary,status,assignee`;
    const res = await fetch(url, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    if (res.ok) {
      const data = await res.json();
      console.log(`Query: "${q}" -> Found ${data.issues.length} issues`);
      for (const iss of data.issues) {
        console.log(`  - ${iss.key}: ${iss.fields.summary} [${iss.fields.status.name}]`);
      }
    } else {
      console.log(`Query: "${q}" failed:`, res.statusText);
    }
  }
}
main();
