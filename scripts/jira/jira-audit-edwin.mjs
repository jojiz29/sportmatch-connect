// scripts/jira-audit-edwin.mjs
// Lee las 8 US de Edwin en Sprint 4 y analiza formato de título vs descripción
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

async function api(endpoint) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  return res.json();
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
console.log("=== TÍTULOS Y DESCRIPCIONES ACTUALES DE EDWIN SPRINT 4 ===\n");
for (const key of keys) {
  const data = await api(
    `/rest/api/3/issue/${key}?fields=summary,description,labels,customfield_10020`,
  );
  console.log(`\n${"=".repeat(70)}`);
  console.log(`${key}`);
  console.log(`${"=".repeat(70)}`);
  console.log(`TÍTULO: ${data.fields.summary}`);
  console.log(`\nDESCRIPCIÓN (plano):`);
  const descAdf = data.fields.description;
  if (descAdf && descAdf.content) {
    descAdf.content.forEach((c) => {
      if (c.content) {
        c.content.forEach((t) => console.log(`  "${t.text}"`));
      }
    });
  }
  console.log(`\nLABELS: ${(data.fields.labels || []).join(", ")}`);
}
