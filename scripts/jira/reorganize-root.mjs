#!/usr/bin/env node
// ============================================================
// scripts/reorganize-root.mjs
// Limpia y organiza los archivos misplaceados en la raíz del repo
// Estrategia: usa `git mv` para preservar historial
// ============================================================

import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const ROOT = process.cwd();

function run(cmd) {
  console.log(`  $ ${cmd}`);
  try {
    execSync(cmd, { stdio: "inherit", cwd: ROOT });
    return true;
  } catch (e) {
    console.error(`  ! Error: ${e.message.split("\n")[0]}`);
    return false;
  }
}

function exists(p) {
  try {
    return fs.existsSync(path.resolve(ROOT, p));
  } catch {
    return false;
  }
}

function mkdir(p) {
  if (!exists(p)) {
    run(`mkdir -p "${p}"`);
  }
}

function gitMv(from, to) {
  if (!exists(from)) {
    console.log(`  · Skip (no existe): ${from}`);
    return false;
  }
  // Asegurar que el directorio destino existe
  const toDir = path.dirname(to);
  mkdir(toDir);
  if (run(`git mv "${from}" "${to}"`)) {
    console.log(`  ✓ ${from} → ${to}`);
    return true;
  }
  return false;
}

function deleteFile(p) {
  if (!exists(p)) return false;
  run(`rm "${p}"`);
  console.log(`  ✗ Eliminado: ${p}`);
  return true;
}

console.log("=== PASO 0: Crear estructura de carpetas especializada ===\n");
mkdir("scripts/jira");
mkdir("scripts/archive");
mkdir("scripts/archive/scratch");
mkdir("scripts/debug");
mkdir("docs/sprints");
mkdir("docs/reports");
mkdir("deploy/docker");
mkdir("archive/legacy-vercel-serverless");

console.log("\n=== PASO 1: Mover scripts Jira a scripts/jira/ ===\n");
const JIRA_SCRIPTS = [
  ["assign-epics-to-edwin.mjs", "scripts/jira/assign-epics-to-edwin.mjs"],
  ["jira-audit-all-edwin.mjs", "scripts/jira/jira-audit-all-edwin.mjs"],
  ["jira-audit-edwin.mjs", "scripts/jira/jira-audit-edwin.mjs"],
  ["jira-check-241.mjs", "scripts/jira/jira-check-241.mjs"],
  ["jira-check-range.mjs", "scripts/jira/jira-check-range.mjs"],
  ["jira-check-transitions.mjs", "scripts/jira/jira-check-transitions.mjs"],
  ["jira-count-issues.mjs", "scripts/jira/jira-count-issues.mjs"],
  ["jira-count.mjs", "scripts/jira/jira-count.mjs"],
  ["jira-debug.mjs", "scripts/jira/jira-debug.mjs"],
  ["jira-deep-audit.mjs", "scripts/jira/jira-deep-audit.mjs"],
  ["jira-fetch-sprint4.mjs", "scripts/jira/jira-fetch-sprint4.mjs"],
  ["jira-final-epic-summary.mjs", "scripts/jira/jira-final-epic-summary.mjs"],
  ["jira-final-verify.mjs", "scripts/jira/jira-final-verify.mjs"],
  ["jira-find-epic-field.mjs", "scripts/jira/jira-find-epic-field.mjs"],
  ["jira-inspect.mjs", "scripts/jira/jira-inspect.mjs"],
  ["jira-investigate-epics.mjs", "scripts/jira/jira-investigate-epics.mjs"],
  ["jira-list-sprints-v2.mjs", "scripts/jira/jira-list-sprints-v2.mjs"],
  ["jira-list-sprints.mjs", "scripts/jira/jira-list-sprints.mjs"],
  ["jira-meta.mjs", "scripts/jira/jira-meta.mjs"],
  ["jira-page.mjs", "scripts/jira/jira-page.mjs"],
  ["jira-page2.mjs", "scripts/jira/jira-page2.mjs"],
  ["jira-page3.mjs", "scripts/jira/jira-page3.mjs"],
  ["jira-raw-adf.mjs", "scripts/jira/jira-raw-adf.mjs"],
  ["jira-status-summary.mjs", "scripts/jira/jira-status-summary.mjs"],
  ["jira-verify-edwin.mjs", "scripts/jira/jira-verify-edwin.mjs"],
  ["jira-verify-final.mjs", "scripts/jira/jira-verify-final.mjs"],
  ["standardize-all-edwin-sprint4.mjs", "scripts/jira/standardize-all-edwin-sprint4.mjs"],
  ["standardize-edwin-tickets.mjs", "scripts/jira/standardize-edwin-tickets.mjs"],
  ["sync-jira-historical-finalize.mjs", "scripts/jira/sync-jira-historical-finalize.mjs"],
  ["sync-jira-historical.mjs", "scripts/jira/sync-jira-historical.mjs"],
  ["sync-jira-sprint2-backlog.mjs", "scripts/jira/sync-jira-sprint2-backlog.mjs"],
  ["sync-jira-sprint2-closure.mjs", "scripts/jira/sync-jira-sprint2-closure.mjs"],
  ["sync-jira-sprint2.mjs", "scripts/jira/sync-jira-sprint2.mjs"],
  ["sync-jira-sprint4.mjs", "scripts/jira/sync-jira-sprint4.mjs"],
  ["update-jira.mjs", "scripts/jira/update-jira.mjs"],
  ["test-ai-chat.mjs", "scripts/jira/test-ai-chat.mjs"],
];
JIRA_SCRIPTS.forEach(([from, to]) => gitMv(from, to));

console.log("\n=== PASO 2: Mover scripts scratch/debug a scripts/archive/ ===\n");
const ARCHIVE_SCRIPTS = [
  ["fix_mock.mjs", "scripts/archive/fix_mock.mjs"],
  ["refactor.mjs", "scripts/archive/refactor.mjs"],
  ["refactor_dates.mjs", "scripts/archive/refactor_dates.mjs"],
  ["scratch_jira_search.js", "scripts/archive/scratch_jira_search.js"],
  ["scratch_match_jira.js", "scripts/archive/scratch_match_jira.js"],
  ["scratch_sprint_issues.js", "scripts/archive/scratch_sprint_issues.js"],
  ["scratch_temp.js", "scripts/archive/scratch_temp.js"],
  ["generate_report.js", "scripts/archive/generate_report.js"],
  ["check_images.js", "scripts/debug/check_images.js"],
  ["inspect-db-schema.js", "scripts/debug/inspect-db-schema.js"],
  ["inspect_courts.js", "scripts/debug/inspect_courts.js"],
  ["test_auth.mjs", "scripts/debug/test_auth.mjs"],
  ["test_candidates.js", "scripts/debug/test_candidates.js"],
];
ARCHIVE_SCRIPTS.forEach(([from, to]) => gitMv(from, to));

console.log("\n=== PASO 3: Mover contenido de scratch/ a scripts/archive/scratch/ ===\n");
if (exists("scratch")) {
  run(`git mv scratch scripts/archive/scratch-old`);
}

console.log("\n=== PASO 4: Mover docs de sprint a docs/sprints/ ===\n");
gitMv("Informe_Sprint_2.docx", "docs/sprints/Informe_Sprint_2.docx");
gitMv("sprint_3_issues.json", "docs/sprints/sprint_3_issues.json");

console.log("\n=== PASO 5: Mover configs de deploy a deploy/ ===\n");
gitMv("Dockerfile", "deploy/docker/Dockerfile");
gitMv("docker-compose.yml", "deploy/docker/docker-compose.yml");
gitMv("railway.toml", "deploy/railway.toml");

console.log("\n=== PASO 6: Archivar Vercel serverless obsoleto ===\n");
gitMv("api/[...path].js", "archive/legacy-vercel-serverless/[...path].js");

console.log("\n=== PASO 7: Eliminar archivos vacíos / innecesarios ===\n");
deleteFile("build_err.txt");
deleteFile("build_out.txt");
deleteFile("bun.lock");

console.log("\n=== PASO 8: Verificar resultado final ===\n");
const remaining = execSync(
  `git ls-files | grep -E "^(fix_|refactor_|scratch_|generate_report|build_err|build_out|bun\\.lock|sprint_3_issues\\.json|Informe_Sprint_2|Dockerfile$|docker-compose|railway\\.toml|api/\\[)"`,
  { cwd: ROOT, encoding: "utf-8" },
);
if (remaining.trim()) {
  console.log("⚠ Archivos misplaced restantes:");
  console.log(remaining);
} else {
  console.log("✓ No quedan archivos misplaced en el repo tracked");
}

console.log("\n=== Resumen de archivos en root (git tracked) ===\n");
const rootTracked = execSync(
  `git ls-files | grep -v "^\\.\\|^docs/\\|^server/\\|^src/\\|^tests/\\|^supabase/\\|^public/\\|^playwright-report/\\|^test-results/\\|^deploy/\\|^archive/\\|^scripts/"`,
  { cwd: ROOT, encoding: "utf-8" },
);
console.log(rootTracked || "(vacío)");
