// scripts/jira-check-range.mjs
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

// Verificar cada ticket de la lista para confirmar cuáles existen
const tickets = ["SCRUM-241", "SCRUM-242", "SCRUM-243", "SCRUM-244", "SCRUM-245"];
for (const k of tickets) {
  const r = await fetch(env.JIRA_BASE_URL + "/rest/api/3/issue/" + k, {
    headers: { Authorization: auth, Accept: "application/json" },
  });
  const d = await r.json();
  if (d.errorMessages) {
    console.log(k, "→ NO EXISTE");
  } else {
    console.log(k, "→", d.fields.summary, "|", d.fields.status.name);
  }
}
