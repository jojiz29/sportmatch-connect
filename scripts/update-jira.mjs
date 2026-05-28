import path from "path";
import fs from "fs";

// Custom vanilla .env parser to avoid external dependencies like 'dotenv'
const envLocalPath = path.resolve(process.cwd(), ".env.local");
if (fs.existsSync(envLocalPath)) {
  const fileContent = fs.readFileSync(envLocalPath, "utf-8");
  fileContent.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const parts = trimmed.split("=");
      const key = parts[0].trim();
      const val = parts.slice(1).join("=").trim();
      const cleanVal = val.replace(/^['"]|['"]$/g, "");
      process.env[key] = cleanVal;
    }
  });
}

const jiraBaseUrl = process.env.JIRA_BASE_URL || "https://edwinfloress.atlassian.net";
const email = process.env.JIRA_USER_EMAIL || "ejuniorfloress@gmail.com";
const token = process.env.JIRA_API_TOKEN;

if (!token) {
  console.error("CRITICAL ERROR: JIRA_API_TOKEN not found in environment variables.");
  process.exit(1);
}

const authHeader = "Basic " + Buffer.from(email + ":" + token).toString("base64");

async function getTransitions(issueKey) {
  const url = `${jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(
      `Failed to fetch transitions for ${issueKey}: ${res.statusText}. Details: ${text}`,
    );
  }
  const data = await res.json();
  return data.transitions;
}

async function transitionIssue(issueKey, transitionId) {
  const url = `${jiraBaseUrl}/rest/api/3/issue/${issueKey}/transitions`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      transition: { id: transitionId },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to transition ${issueKey}: ${res.statusText}. Details: ${text}`);
  }
  console.log(`Successfully transitioned ${issueKey} using transition ID ${transitionId}`);
}

async function getOrCreateTicket(issueKey) {
  const url = `${jiraBaseUrl}/rest/api/3/issue/${issueKey}`;
  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      Accept: "application/json",
    },
  });
  if (res.ok) {
    console.log(`Ticket ${issueKey} already exists.`);
    return issueKey;
  }

  console.log(`Ticket ${issueKey} not found. Creating it...`);
  const createUrl = `${jiraBaseUrl}/rest/api/3/issue`;
  const createRes = await fetch(createUrl, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      fields: {
        project: {
          key: "SCRUM",
        },
        summary: "Evolución B2B - Portal de Negocios, Marketplace y Monetización (Business Tier)",
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: "Implementación del soporte para empresas y patrocinadores de forma integral en SportMatch Connect (B2B Portal, Marketplace, Sponsors y Wallet Sync).",
                },
              ],
            },
          ],
        },
        issuetype: {
          name: "Task",
        },
      },
    }),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    console.warn(
      `Could not create ticket ${issueKey} automatically: ${createRes.statusText}. Details: ${text}`,
    );
    return issueKey;
  }

  const data = await createRes.json();
  console.log(`Successfully created ticket ${data.key}`);
  return data.key;
}

async function run() {
  console.log("=========================================");
  console.log("     Jira Ticket Status Synchronizer     ");
  console.log("=========================================");

  const ticketsToDone = ["SCRUM-45", "SCRUM-53", "SCRUM-54"];

  try {
    const scrum60Key = await getOrCreateTicket("SCRUM-60");
    if (!ticketsToDone.includes(scrum60Key)) {
      ticketsToDone.push(scrum60Key);
    }
  } catch (err) {
    console.warn("Failed to check or create SCRUM-60:", err.message);
  }

  for (const ticket of ticketsToDone) {
    try {
      console.log(`Fetching transitions for ${ticket}...`);
      const transitions = await getTransitions(ticket);
      console.log(
        `Available transitions for ${ticket}:`,
        transitions.map((t) => `${t.id}: ${t.name}`),
      );

      const doneTransition = transitions.find(
        (t) =>
          t.name.toLowerCase() === "done" ||
          t.name.toLowerCase() === "listo" ||
          t.name.toLowerCase() === "terminado" ||
          t.name.toLowerCase() === "finalizado" ||
          t.name.toLowerCase() === "completado" ||
          t.name.toLowerCase() === "concluido",
      );

      if (doneTransition) {
        console.log(`Found target transition: "${doneTransition.name}" (ID: ${doneTransition.id})`);
        await transitionIssue(ticket, doneTransition.id);
      } else {
        console.warn(`Could not find a transition matching 'Done' or similar for ${ticket}.`);
      }
    } catch (error) {
      console.error(`Failed to update ${ticket}:`, error.message);
    }
  }

  console.log("=========================================");
  console.log("JIRA SYNCHRONIZATION COMPLETED!");
  console.log("=========================================");
}

run();
