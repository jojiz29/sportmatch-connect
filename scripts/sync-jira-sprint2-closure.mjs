import path from "path";
import fs from "fs";

// Custom .env.local parser
const envLocalPath = path.resolve(process.cwd(), ".env.local");
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

const jiraBaseUrl = env.JIRA_BASE_URL || "https://edwinfloress.atlassian.net";
const email = env.JIRA_USER_EMAIL || "ejuniorfloress@gmail.com";
const token = env.JIRA_API_TOKEN;
const assigneeId = "615b12b4289a54006a07b729"; // Edwin Junior Flores Sanchez accountId
const sprintId = 41; // Sprint 2 ID

if (!token) {
  console.error("CRITICAL ERROR: JIRA_API_TOKEN not found in .env.local");
  process.exit(1);
}

const authHeader = "Basic " + Buffer.from(email + ":" + token).toString("base64");

async function apiRequest(endpoint, options = {}) {
  const url = `${jiraBaseUrl}${endpoint}`;
  const headers = {
    Authorization: authHeader,
    Accept: "application/json",
    "Content-Type": "application/json",
    ...options.headers,
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`HTTP Error ${res.status}: ${res.statusText}. Response: ${text}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

async function searchIssues(jql) {
  const data = await apiRequest(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=100&fields=summary,status,assignee`,
  );
  return data.issues || [];
}

async function getTransitions(issueKey) {
  const data = await apiRequest(`/rest/api/3/issue/${issueKey}/transitions`);
  return data.transitions || [];
}

async function transitionIssue(issueKey, transitionId) {
  await apiRequest(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({
      transition: { id: transitionId },
    }),
  });
  console.log(`Transitioned ${issueKey} using transition ID ${transitionId}`);
}

async function updateIssue(issueKey, fields) {
  await apiRequest(`/rest/api/3/issue/${issueKey}`, {
    method: "PUT",
    body: JSON.stringify({ fields }),
  });
  console.log(`Updated issue ${issueKey} fields.`);
}

async function createIssue(summary) {
  const body = {
    fields: {
      project: { key: "SCRUM" },
      summary: summary,
      description: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Automated Sprint 2 closure story created by PM Automation Engine.",
              },
            ],
          },
        ],
      },
      issuetype: { name: "Story" },
      assignee: { accountId: assigneeId },
    },
  };
  const data = await apiRequest(`/rest/api/3/issue`, {
    method: "POST",
    body: JSON.stringify(body),
  });
  console.log(`Created new issue ${data.key} with summary: "${summary}"`);
  return data.key;
}

async function associateToSprint(sprintId, issueKeys) {
  await apiRequest(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: "POST",
    body: JSON.stringify({ issues: issueKeys }),
  });
  console.log(`Associated issues ${issueKeys.join(", ")} to Sprint ${sprintId}`);
}

async function ensureDoneStatus(key) {
  const transitions = await getTransitions(key);
  const targetTransition = transitions.find((t) => {
    const name = t.name.toLowerCase();
    return (
      name === "done" ||
      name === "listo" ||
      name === "finalizada" ||
      name === "finalizado" ||
      name === "terminado" ||
      name === "completado" ||
      name === "concluido"
    );
  });

  if (targetTransition) {
    await transitionIssue(key, targetTransition.id);
  } else {
    console.log(
      `Issue ${key} is already in Done/Finalizada status or no matching transition found.`,
    );
  }
}

async function run() {
  console.log("Starting JIRA Sprint 2 Completion Sync...");

  const tasks = [
    "Restructuring of Navigation Sidebar & Unified Inbox.",
    "Tinder-style Matchmaking UI implementation.",
    "Telemetry to FitCoins rewarding logic.",
    "SQL Cast Fix (UUID to Text) for Squad Policies.",
    "i18n Global Dictionary Audit.",
  ];

  // Fetch all issues in the project first to search locally
  const existingIssues = await searchIssues(`project = SCRUM`);
  console.log(`Found ${existingIssues.length} existing issues in SCRUM project.`);

  for (const taskSummary of tasks) {
    try {
      console.log(`\nProcessing task: "${taskSummary}"...`);

      // Try to find matching existing issue by exact or close summary match
      const match = existingIssues.find((issue) => {
        const summ = issue.fields.summary.toLowerCase();
        const target = taskSummary.toLowerCase();
        return summ === target || summ === `story: ${target}` || summ === `task: ${target}`;
      });

      let key;
      if (match) {
        key = match.key;
        console.log(`Found existing ticket: ${key} for "${taskSummary}"`);
      } else {
        // Create new story
        key = await createIssue(taskSummary);
      }

      // Assign to Edwin
      await updateIssue(key, {
        assignee: { accountId: assigneeId },
      });

      // Associate with Sprint 2
      await associateToSprint(sprintId, [key]);

      // Move to Done/Listo
      await ensureDoneStatus(key);

      console.log(`Task "${taskSummary}" successfully synchronized and set to DONE!`);
    } catch (e) {
      console.error(`Failed to process task "${taskSummary}":`, e.message);
    }
  }

  console.log("\n====================================================");
  console.log("JIRA SPRINT 2 COMPLETION SYNC COMPLETED SUCCESSFULLY!");
  console.log("====================================================");
}

run().catch((err) => {
  console.error("FATAL ERROR IN JIRA SYNC:", err);
  process.exit(1);
});
