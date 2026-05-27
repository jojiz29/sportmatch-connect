import fs from "fs";
import path from "path";

const SRC_DIR = "./src";

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((f) => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

function refactor() {
  walk(SRC_DIR, (filePath) => {
    if (!filePath.endsWith(".ts") && !filePath.endsWith(".tsx")) return;

    let content = fs.readFileSync(filePath, "utf8");
    let original = content;

    content = content.replace(/\.scheduled_at\b/g, ".date");
    // Also fix the new Date() around match.date since it's just a string now like '2026-05-28'
    // actually new Date('2026-05-28') still works, but maybe we just format it simply or leave it if it works

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  });
}

refactor();
