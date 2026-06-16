import fs from "fs";
import path from "path";

// 1. Process Frontend lcov
const frontendLcov = path.resolve("coverage/lcov.info");
if (fs.existsSync(frontendLcov)) {
  let content = fs.readFileSync(frontendLcov, "utf-8");
  content = content.split("\n").map(line => {
    if (line.startsWith("SF:")) {
      return line.replace(/\\/g, "/");
    }
    return line;
  }).join("\n");
  fs.writeFileSync(frontendLcov, content, "utf-8");
  console.log("Successfully normalized frontend lcov.info paths!");
} else {
  console.warn("Frontend lcov.info not found at: " + frontendLcov);
}

// 2. Process Backend lcov
const backendLcov = path.resolve("server/coverage/lcov.info");
if (fs.existsSync(backendLcov)) {
  let content = fs.readFileSync(backendLcov, "utf-8");
  content = content.split("\n").map(line => {
    if (line.startsWith("SF:")) {
      let normalized = line.replace(/\\/g, "/");
      if (normalized.includes("src/")) {
        const index = normalized.indexOf("src/");
        if (index !== -1 && !normalized.includes("server/src/")) {
          normalized = normalized.slice(0, index) + "server/src/" + normalized.slice(index + 4);
        }
      }
      return normalized;
    }
    return line;
  }).join("\n");
  fs.writeFileSync(backendLcov, content, "utf-8");
  console.log("Successfully normalized backend lcov.info paths!");
} else {
  console.warn("Backend lcov.info not found at: " + backendLcov);
}

