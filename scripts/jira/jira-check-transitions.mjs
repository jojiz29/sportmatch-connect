// scripts/sync-jira-historical-fix.mjs
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
      env[p[0].trim()] = p.slice(1).join("=").trim().replace(/^['"]|['"]$/g, "");
    }
  });
const auth = "Basic " + Buffer.from(env.JIRA_USER_EMAIL + ":" + env.JIRA_API_TOKEN).toString("base64");

async function api(endpoint, options = {}) {
  const res = await fetch(`${env.JIRA_BASE_URL}${endpoint}`, {
    headers: { Authorization: auth, Accept: "application/json", "Content-Type": "application/json" },
    ...options,
  });
  return res.json();
}

// Para SCRUM-388, primero ver qué transiciones están disponibles
const sample = "SCRUM-367";
const data = await api(`/rest/api/3/issue/${sample}/transitions`);
console.log("Transiciones disponibles:");
data.transitions.forEach((t) => console.log(`  ${t.id}: ${t.name} → ${t.to?.name} (id=${t.to?.id})`));
