const email = "ejuniorfloress@gmail.com";
const apiToken = process.env.ATLASSIAN_TOKEN || "";
const baseUrl = "https://edwinfloress.atlassian.net";
const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

async function checkIssue(key) {
  try {
    const url = `${baseUrl}/rest/api/3/issue/${key}?fields=summary,status,assignee,sprint,customfield_10020`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });
    if (!res.ok) {
      console.log(`Failed to fetch ${key}: ${res.status}`);
      return;
    }
    const issue = await res.json();
    console.log(`${key} Details:`);
    console.log(`- Summary: ${issue.fields.summary}`);
    console.log(`- Status: ${issue.fields.status.name}`);
    console.log(
      `- Assignee: ${issue.fields.assignee ? issue.fields.assignee.displayName : "Unassigned"}`,
    );

    // Check sprint field
    const sprints = issue.fields.customfield_10020;
    if (sprints && sprints.length > 0) {
      console.log(`- Sprints: ${sprints.map((s) => s.name).join(", ")}`);
    } else {
      console.log(`- Sprints: None`);
    }
  } catch (err) {
    console.error(`Error checking ${key}:`, err);
  }
}

async function main() {
  await checkIssue("SCRUM-126");
  await checkIssue("SCRUM-127");
}

main();
