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

    // User renaming
    content = content.replace(/\.sports\b/g, ".preferred_sports");
    content = content.replace(/sports:/g, "preferred_sports:");

    // Match renaming
    content = content.replace(/\.participants\b/g, ".current_players");
    content = content.replace(/participants:/g, "current_players:");
    content = content.replace(/\.total_spots\b/g, ".max_players");
    content = content.replace(/total_spots:/g, "max_players:");
    // Note: scheduled_at needs to be handled carefully, especially in mock.ts
    // In mock.ts, scheduled_at is being set. We will do mock.ts manually if needed, or just let regex do the easy parts

    // Transactions
    content = content.replace(/"REWARD"/g, '"EARN"');
    content = content.replace(/"PURCHASE"/g, '"SPEND"');

    if (content !== original) {
      fs.writeFileSync(filePath, content);
      console.log(`Updated ${filePath}`);
    }
  });
}

refactor();
