import fs from "fs";
import path from "path";

const esPath =
  "c:\\Users\\ejuni\\OneDrive - SEIDOR SOLUTIONS S.L\\Documentos\\GitHub\\sportmatch-connect\\public\\locales\\es.json";
const enPath =
  "c:\\Users\\ejuni\\OneDrive - SEIDOR SOLUTIONS S.L\\Documentos\\GitHub\\sportmatch-connect\\public\\locales\\en.json";

function getFlatKeys(obj, prefix = "") {
  let keys = [];
  for (const k in obj) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (obj[k] && typeof obj[k] === "object" && !Array.isArray(obj[k])) {
      keys = keys.concat(getFlatKeys(obj[k], key));
    } else {
      keys.push(key);
    }
  }
  return keys;
}

function walkDir(dir, callback) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      walkDir(filePath, callback);
    } else if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      callback(filePath);
    }
  }
}

function main() {
  const esObj = JSON.parse(fs.readFileSync(esPath, "utf8"));
  const enObj = JSON.parse(fs.readFileSync(enPath, "utf8"));
  const esKeys = new Set(getFlatKeys(esObj));
  const enKeys = new Set(getFlatKeys(enObj));

  console.log("ES keys:", esKeys.size);
  console.log("EN keys:", enKeys.size);

  const tRegex = /\bt\(\s*['"`]([^'`"]+)['"`]/g;
  const missingEs = {};
  const missingEn = {};

  walkDir(
    "c:\\Users\\ejuni\\OneDrive - SEIDOR SOLUTIONS S.L\\Documentos\\GitHub\\sportmatch-connect\\src",
    (filePath) => {
      const content = fs.readFileSync(filePath, "utf8");
      let match;
      while ((match = tRegex.exec(content)) !== null) {
        const key = match[1];
        // Skip dynamic expressions
        if (key.includes("${")) continue;

        // Some dynamic patterns are resolved in code: Skip checking those if their prefix is known
        const skipPrefixes = [
          "cancellations.",
          "attendance.",
          "punctuality.",
          "behavior.",
          "role_",
          "cat_",
          "profile.metrics.",
          "auth.password_strength_",
          "auth.password_crit_",
        ];
        if (skipPrefixes.some((p) => key.startsWith(p))) continue;

        if (!esKeys.has(key)) {
          if (!missingEs[key]) missingEs[key] = [];
          missingEs[key].push(path.relative(process.cwd(), filePath));
        }
        if (!enKeys.has(key)) {
          if (!missingEn[key]) missingEn[key] = [];
          missingEn[key].push(path.relative(process.cwd(), filePath));
        }
      }
    },
  );

  console.log("\n--- Checking ES Missing Keys ---");
  const missingEsList = Object.keys(missingEs);
  if (missingEsList.length > 0) {
    for (const key of missingEsList) {
      console.log(`Key "${key}" missing in es.json. Used in: ${missingEs[key].join(", ")}`);
    }
  } else {
    console.log("No missing keys in es.json!");
  }

  console.log("\n--- Checking EN Missing Keys ---");
  const missingEnList = Object.keys(missingEn);
  if (missingEnList.length > 0) {
    for (const key of missingEnList) {
      console.log(`Key "${key}" missing in en.json. Used in: ${missingEn[key].join(", ")}`);
    }
  } else {
    console.log("No missing keys in en.json!");
  }
}

main();
