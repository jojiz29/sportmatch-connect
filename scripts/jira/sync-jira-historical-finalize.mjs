// scripts/sync-jira-historical-finalize.mjs
// Re-transiciona los 21 tickets históricos a Finalizada
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

async function api(endpoint, options = {}) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: auth,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.status === 204 ? null : res.json();
}

async function transition(issueKey, transitionId) {
  return api(`/rest/api/3/issue/${issueKey}/transitions`, {
    method: "POST",
    body: JSON.stringify({ transition: { id: transitionId } }),
  });
}

const keys = [
  "SCRUM-367",
  "SCRUM-368",
  "SCRUM-369",
  "SCRUM-370",
  "SCRUM-371",
  "SCRUM-372",
  "SCRUM-373",
  "SCRUM-374",
  "SCRUM-375",
  "SCRUM-376",
  "SCRUM-377",
  "SCRUM-378",
  "SCRUM-379",
  "SCRUM-380",
  "SCRUM-381",
  "SCRUM-382",
  "SCRUM-383",
  "SCRUM-384",
  "SCRUM-385",
  "SCRUM-386",
  "SCRUM-387",
];

console.log(`Transicionando ${keys.length} tickets a Finalizada...`);
let ok = 0,
  fail = 0;
for (const key of keys) {
  try {
    // Estado actual: En curso (10001). Transición 41 → Finalizada.
    await transition(key, "41");
    console.log(`  ✓ ${key}`);
    ok++;
  } catch (err) {
    console.error(`  ! ${key} ERROR: ${err.message.slice(0, 100)}`);
    fail++;
  }
}
console.log(`\nResumen: ${ok} OK, ${fail} fallos`);
