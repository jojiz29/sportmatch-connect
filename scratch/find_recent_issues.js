const email = "ejuniorfloress@gmail.com";
const apiToken = process.env.ATLASSIAN_TOKEN || "";
const baseUrl = "https://edwinfloress.atlassian.net";
const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

async function main() {
  try {
    const jql = `project = SCRUM ORDER BY created DESC`;
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=50&fields=summary,status,assignee`;

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
    console.log(`Found ${data.issues.length} recently created issues:`);
    for (const issue of data.issues) {
      const summary = issue.fields.summary;
      const status = issue.fields.status.name;
      const assignee = issue.fields.assignee ? issue.fields.assignee.displayName : "Unassigned";
      console.log(`- ${issue.key} | ${summary} | Status: ${status} | Assignee: ${assignee}`);
    }
  } catch (err) {
    console.error("Error checking issues:", err);
  }
}

main();
