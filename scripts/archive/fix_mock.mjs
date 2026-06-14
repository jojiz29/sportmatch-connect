import fs from "fs";

let content = fs.readFileSync("src/lib/mock.ts", "utf8");

// Replace User properties:
// We need to add matches_played: 12 somewhere in the mock users.
content = content.replace(/trust_score: (\d+)/g, "trust_score: $1, matches_played: 12");

// Replace Match properties:
// Replace `scheduled_at: futureDay(x)` with `date: futureDay(x).split('T')[0], time: "18:00"`
content = content.replace(
  /scheduled_at:\s*futureDay\(([^)]+)\)/g,
  'date: futureDay($1).split("T")[0], time: "18:00"',
);

fs.writeFileSync("src/lib/mock.ts", content);
