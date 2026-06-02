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
                text: "Automated Sprint 2 extension ticket created for task execution verification.",
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
  // Find a transition whose name matches "Finalizada", "Done", "Listo", "Completado", etc.
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

async function ensureToDoStatus(key) {
  const transitions = await getTransitions(key);
  // Find transition matching To Do / Tareas por hacer
  const targetTransition = transitions.find((t) => {
    const name = t.name.toLowerCase();
    return (
      name === "to do" ||
      name === "tareas por hacer" ||
      name === "por hacer" ||
      name === "backlog" ||
      name === "reabrir"
    );
  });

  if (targetTransition) {
    await transitionIssue(key, targetTransition.id);
  } else {
    console.log(`Issue ${key} is already in To Do status or no matching transition found.`);
  }
}

async function run() {
  console.log("Starting JIRA Sprint 2 Automation Sync...");

  // ----------------------------------------------------
  // GROUP A: UPDATE COMPLETED STORIES
  // ----------------------------------------------------
  const groupA = [
    { key: "SCRUM-74", summary: "Secure Authentication Engine & WebP Photo Compression." },
    { key: "SCRUM-75", summary: "PostGIS Geography Point Storage & Dynamic Booking Pipeline." },
    { key: "SCRUM-86", summary: "Self-Exclusion Algorithm for Matchmaking Cards." },
    { key: "SCRUM-87", summary: "Real-time NewsFeed with Supabase Channel Subscriptions." },
    { key: "SCRUM-97", summary: "Haversine Formula Client-side Distance Tracker." },
    { key: "SCRUM-54", summary: "Squad Creation Foundations & Active UI Registration." },
  ];

  console.log("\n--- Processing Group A (Completed Stories) ---");
  for (const item of groupA) {
    try {
      console.log(`Processing ${item.key}...`);
      // Update fields: summary and assignee
      await updateIssue(item.key, {
        summary: item.summary,
        assignee: { accountId: assigneeId },
      });
      // Move to sprint 41
      await associateToSprint(sprintId, [item.key]);
      // Transition to Done/Finalizada
      await ensureDoneStatus(item.key);
    } catch (e) {
      console.error(`Failed to process completed issue ${item.key}:`, e.message);
    }
  }

  // ----------------------------------------------------
  // GROUP B: INJECT NEW EXTENSIONS
  // ----------------------------------------------------
  const groupB = [
    "Relational Squad Member Junction Table & User Invitation Workflow.",
    "Asynchronous Group Chat Integration for Squad Ecosystems.",
    "Geofenced Post-Match Rating Gate & Attended-Only Verification.",
    "Rich Media Attachments and Structural Card Actions in Chat Windows.",
  ];

  console.log("\n--- Processing Group B (Create New Extensions) ---");
  // First search if any of these already exist by searching JIRA to avoid duplicates
  const existingIssues = await searchIssues(`project = SCRUM AND sprint = ${sprintId}`);
  for (const summary of groupB) {
    try {
      const match = existingIssues.find((issue) => issue.fields.summary.includes(summary));
      let key;
      if (match) {
        key = match.key;
        console.log(`Story already exists: ${key} for "${summary}"`);
      } else {
        key = await createIssue(`STORY: ${summary}`);
        await associateToSprint(sprintId, [key]);
      }
      // Ensure it is assigned to Edwin
      await updateIssue(key, { assignee: { accountId: assigneeId } });
      // Ensure status is Done/Finalizada
      await ensureDoneStatus(key);
    } catch (e) {
      console.error(`Failed to process group B story "${summary}":`, e.message);
    }
  }

  // ----------------------------------------------------
  // GROUP C: RESTRUCTURE SPRINT 2 BACKLOG
  // ----------------------------------------------------
  const groupC = [
    { key: "SCRUM-102", summary: "Server-side PostgreSQL Wallet Balance Check Triggers." },
    {
      key: "SCRUM-104",
      summary: "Automated Tournament Bracket Generator for Competitive Leagues.",
    },
    { key: "SCRUM-107", summary: "Premium Subscription Tiers and Early Booking Slot Access." },
  ];

  console.log("\n--- Processing Group C (Restructuring Backlog) ---");
  for (const item of groupC) {
    try {
      console.log(`Processing backlog item ${item.key}...`);
      await updateIssue(item.key, {
        summary: item.summary,
      });
      // Move to sprint 41 if not already there
      await associateToSprint(sprintId, [item.key]);
      // Ensure status is 'To Do' (Tareas por hacer)
      await ensureToDoStatus(item.key);
    } catch (e) {
      console.error(`Failed to process backlog issue ${item.key}:`, e.message);
    }
  }

  console.log("\n====================================================");
  console.log("JIRA SPRINT 2 SYNCHRONIZATION WORKFLOW FINISHED!");
  console.log("====================================================");
}

run();
