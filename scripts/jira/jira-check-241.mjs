// scripts/jira-check-241.mjs
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

const r = await fetch(env.JIRA_BASE_URL + "/rest/api/3/issue/SCRUM-241", {
  headers: { Authorization: auth, Accept: "application/json" },
});
const d = await r.json();
if (d.errorMessages) {
  console.log("NO EXISTE:", d.errorMessages);
} else {
  console.log("Existe. Key:", d.key, "Summary:", d.fields.summary);
  console.log("Status:", d.fields.status.name);
  console.log("Parent:", d.fields.parent?.key);
}
