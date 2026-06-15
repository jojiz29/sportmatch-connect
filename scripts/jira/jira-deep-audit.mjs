// scripts/jira-deep-audit.mjs
// Inspecciona el ADF completo de las US de Edwin para verificar estructura
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

function inspectAdf(node, depth = 0) {
  if (!node) return;
  const indent = "  ".repeat(depth);
  const txt = extractText(node);
  if (node.type === "heading") {
    console.log(`${indent}H${node.attrs?.level}: ${txt}`);
  } else if (node.type === "paragraph" && txt) {
    console.log(`${indent}P: ${txt.slice(0, 100)}${txt.length > 100 ? "..." : ""}`);
  } else if (node.type === "bulletList") {
    console.log(`${indent}LIST (${node.content?.length || 0} items):`);
    node.content?.forEach((item) => {
      const itemTxt = extractText(item);
      console.log(`${indent}  • ${itemTxt.slice(0, 100)}${itemTxt.length > 100 ? "..." : ""}`);
    });
  } else if (node.type === "codeBlock") {
    console.log(`${indent}CODE (${node.attrs?.language}):`);
    console.log(`${indent}  ${txt.split("\n")[0]}...`);
  } else if (node.type === "doc") {
    console.log(`${indent}DOC with ${node.content?.length || 0} blocks:`);
  }
}

const key = "SCRUM-338";
const res = await fetch(`${env.JIRA_BASE_URL}/rest/api/3/issue/${key}?fields=summary,description`, {
  headers: { Authorization: auth, Accept: "application/json" },
});
const data = await res.json();
console.log(`=== ${key} ===`);
console.log(`SUMMARY: ${data.fields.summary}\n`);
console.log("ADF STRUCTURE:");
inspectAdf(data.fields.description);
