const email = "ejuniorfloress@gmail.com";
const apiToken = process.env.ATLASSIAN_TOKEN || "";
const baseUrl = "https://edwinfloress.atlassian.net";
const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");

async function main() {
  try {
    const url = `${baseUrl}/rest/api/3/issue/SCRUM-108?fields=assignee`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
      },
    });
    const issue = await res.json();
    console.log("Assignee object:", JSON.stringify(issue.fields.assignee, null, 2));
  } catch (err) {
    console.error("Error:", err);
  }
}

main();
