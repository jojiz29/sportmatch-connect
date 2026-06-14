// scripts/jira-audit-all-edwin.mjs
// Lista TODOS los tickets de Edwin en Sprint 4 con sus descripciones
import fs from "fs";
import path from "path";
const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
const auth = "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

const EDWIN_ID = "615b12b4289a54006a07b729";
const SPRINT_4_ID = 42;

function extractText(node) {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.content) return node.content.map(extractText).join("");
  return "";
}

let nextPageToken = null;
const allIssues = [];

while (true) {
  let url =
    `${env.JIRA_BASE_URL}/rest/api/3/search/jql?jql=` +
    encodeURIComponent(`sprint = ${SPRINT_4_ID} AND assignee = ${EDWIN_ID}`);
  if (nextPageToken) url += `&nextPageToken=${nextPageToken}`;
  url += "&fields=summary,description,status,labels,customfield_10020&maxResults=100";

  const res = await fetch(url, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  const data = await res.json();
  if (!data.issues || data.issues.length === 0) break;
  allIssues.push(...data.issues);
  if (data.isLast || !data.nextPageToken) break;
  nextPageToken = data.nextPageToken;
}

console.log(`Total tickets de Edwin en Sprint 4: ${allIssues.length}\n`);
console.log("=".repeat(80));

for (const i of allIssues) {
  const desc = i.fields.description;
  let usText = "";
  if (desc && desc.content) usText = desc.content.map(extractText).join(" ");
  const hasUS = usText.includes("Como") && usText.includes("quiero") && usText.includes("para");
  const hasStructure = usText.includes("Contexto") && usText.includes("Criterios");

  console.log(`\n[${i.key}] ${i.fields.status.name}`);
  console.log(`SUMMARY: ${i.fields.summary}`);
  console.log(`LABELS: ${(i.fields.labels || []).join(", ")}`);
  console.log(`US FORMAT: ${hasUS ? "✓" : "✗"} | ESTRUCTURA COMPLETA: ${hasStructure ? "✓" : "✗"}`);
  console.log(`DESC: ${usText.slice(0, 200)}${usText.length > 200 ? "..." : ""}`);
  console.log("-".repeat(80));
}
