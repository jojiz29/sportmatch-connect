const email = "ejuniorfloress@gmail.com";
const apiToken = process.env.ATLASSIAN_TOKEN || "";
const baseUrl = "https://edwinfloress.atlassian.net";
const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

async function main() {
  try {
    const jql = `assignee = currentUser() AND status != "Done" AND status != "Finalizada"`;
    const url = `${baseUrl}/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,assignee,sprint`;

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
    console.log(`Found ${data.issues.length} active issues for currentUser:`);
    for (const issue of data.issues) {
      const summary = issue.fields.summary;
      const status = issue.fields.status.name;
      const sprint = issue.fields.sprint ? issue.fields.sprint.name : "No Sprint";
      console.log(`- ${issue.key} | ${summary} | Status: ${status} | Sprint: ${sprint}`);
    }
  } catch (err) {
    console.error("Error checking issues:", err);
  }
}

main();
