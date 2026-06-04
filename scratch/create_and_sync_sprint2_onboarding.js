const email = "ejuniorfloress@gmail.com";
const apiToken = process.env.ATLASSIAN_TOKEN || "";
const baseUrl = "https://edwinfloress.atlassian.net";
const auth = Buffer.from(`${email}:${apiToken}`).toString("base64");
const assigneeId = "615b12b4289a54006a07b729";
const sprintId = 41;

async function apiCall(path, options = {}) {
  const url = `${baseUrl}${path}`;
  const headers = {
    Authorization: `Basic ${auth}`,
    Accept: "application/json",
    ...options.headers,
  };
  if (options.body && !(options.body instanceof String)) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    throw new Error(`API Call ${path} failed with HTTP ${res.status}: ${await res.text()}`);
  }
  if (res.status === 204) return null;
  return await res.json();
}

async function searchIssues(summary) {
  const jql = `project = SCRUM AND summary ~ "\\"${summary}\\""`;
  const url = `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}`;
  const data = await apiCall(url, { method: "GET" });
  return data.issues || [];
}

async function createIssue(summary, description) {
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
            content: [{ type: "text", text: description }],
          },
        ],
      },
      issuetype: { name: "Story" },
      assignee: { id: assigneeId },
    },
  };
  const data = await apiCall("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify(body),
  });
  return data.key;
}

async function addIssuesToSprint(issueKeys) {
  await apiCall(`/rest/agile/1.0/sprint/${sprintId}/issue`, {
    method: "POST",
    body: JSON.stringify({ issues: issueKeys }),
  });
}

async function transitionIssue(key, transitionId) {
  await apiCall(`/rest/api/3/issue/${key}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

async function addComment(key, commentText) {
  const body = {
    body: {
      type: "doc",
      version: 1,
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: commentText }],
        },
      ],
    },
  };
  await apiCall(`/rest/api/3/issue/${key}/comment`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

async function main() {
  const tasks = [
    {
      summary: "Immersive Onboarding Wizard",
      description:
        "Implement step-by-step onboarding wizard for PLAYER users, enabling selecting sports in a glassmorphic grid, selecting skill level with popovers/matchmaking weight explanations, and setting game intents.",
      comment:
        "Gamified onboarding wizard UI refactor successfully completed, localized (ES/EN) and E2E verified.",
    },
    {
      summary: "Weekly Streak Scoring Engine",
      description:
        "Implement PostgreSQL database triggers on match_participants to calculate rolling 7-day calendar week attendance streaks and display them in a SVG contribution graph.",
      comment: "Database triggers, RLS, and SVG contribution graph widget integrated and verified.",
    },
  ];

  for (const t of tasks) {
    try {
      console.log(`Checking if issue exists: "${t.summary}"...`);
      const existing = await searchIssues(t.summary);
      let key;
      if (existing.length > 0) {
        key = existing[0].key;
        console.log(`Found existing issue ${key}.`);
      } else {
        console.log(`Creating new issue...`);
        key = await createIssue(t.summary, t.description);
        console.log(`Created issue ${key}.`);
      }

      console.log(`Adding ${key} to Sprint ${sprintId}...`);
      await addIssuesToSprint([key]);

      console.log(`Adding verification comment to ${key}...`);
      await addComment(key, t.comment);

      console.log(`Transitioning ${key} to DONE...`);
      await transitionIssue(key, "41");

      console.log(`Issue ${key} successfully synced and marked as Done!\n`);
    } catch (err) {
      console.error(`Error processing "${t.summary}":`, err);
    }
  }
}

main();
