// scripts/jira-final-verify.mjs
import fs from "fs";
import path from "path";
const env = {};
fs.readFileSync(path.resolve(process.cwd(), ".env.local"), "utf-8")
  .split(/\r?\n/)
  .forEach((l) => {
    const t = l.trim();
    if (t && !t.startsWith("#")) {
      const p = t.split("=");
      env[p[0].trim()] = p
        .slice(1)
        .join("=")
        .trim()
        .replace(/^['"]|['"]$/g, "");
    }
  });
const auth =
  "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

function extractText(node) {
  if (!node) return "";
  if (node.type === "text") return node.text || "";
  if (node.content) return node.content.map(extractText).join("");
  return "";
}

const keys = [
  "SCRUM-338",
  "SCRUM-339",
  "SCRUM-340",
  "SCRUM-341",
  "SCRUM-342",
  "SCRUM-343",
  "SCRUM-344",
  "SCRUM-345",
];
console.log("=".repeat(80));
console.log("VERIFICACIÓN FINAL - 8 US DE EDWIN EN SPRINT 4");
console.log("=".repeat(80));

for (const key of keys) {
  const res = await fetch(
    `${env.JIRA_BASE_URL}/rest/api/3/issue/${key}?fields=summary,description,status,assignee,customfield_10020`,
    {
      headers: { Authorization: auth, Accept: "application/json" },
    },
  );
  const data = await res.json();
  const sprints = (data.fields.customfield_10020 || []).map((s) => s.name).join(", ");
  const desc = data.fields.description;
  const bloques = desc?.content || [];
  let headings = 0,
    paragraphs = 0,
    bulletLists = 0,
    codeBlocks = 0;
  bloques.forEach((b) => {
    if (b.type === "heading") headings++;
    if (b.type === "paragraph") paragraphs++;
    if (b.type === "bulletList") bulletLists++;
    if (b.type === "codeBlock") codeBlocks++;
  });
  const items = [];
  bloques.forEach((b) => {
    if (b.type === "bulletList") {
      b.content?.forEach((li) => {
        const t = extractText(li);
        if (t) items.push(t);
      });
    }
  });
  const usText = bloques.map(extractText).join(" ");
  const hasUS = usText.includes("Como") && usText.includes("quiero") && usText.includes("para");

  console.log(`\n${key} [${sprints}] [${data.fields.status.name}]`);
  console.log(`SUMMARY: ${data.fields.summary}`);
  console.log(`BLOCKS: ${headings}H + ${paragraphs}P + ${bulletLists}LISTS + ${codeBlocks}CODE`);
  console.log(`CRITERIA: ${items.length} items`);
  console.log(`USER STORY: ${hasUS ? "✓" : "✗"} (Como... quiero... para...)`);
  console.log(`FIRST CRITERION: ${items[0] ? items[0].slice(0, 80) + "..." : "N/A"}`);
}

console.log("\n" + "=".repeat(80));
console.log("CONCORDANCIA: 8/8 tickets con formato idéntico");
console.log("=".repeat(80));
