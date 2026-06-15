// scripts/jira-find-epic-field.mjs
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

// Buscar el custom field que se usa en épicas mirando un ticket hijo de SCRUM-11
const res = await fetch(`${env.JIRA_BASE_URL}/rest/api/3/issue/SCRUM-255?fields=*all`, {
  headers: { Authorization: auth, Accept: "application/json" },
});
const data = await res.json();
const allFields = data.fields;
const keys = Object.keys(allFields);
console.log("Custom fields en SCRUM-255:");
keys
  .filter((k) => k.startsWith("customfield"))
  .forEach((k) => {
    const v = allFields[k];
    const display = typeof v === "object" ? JSON.stringify(v).slice(0, 80) : String(v);
    console.log(`  ${k}: ${display}`);
  });

// También probar el campo parent
console.log("\n¿Existe parent field?");
console.log(JSON.stringify(allFields.parent || "NO EXISTE", null, 2));
