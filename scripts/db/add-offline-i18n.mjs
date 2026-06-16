import fs from "node:fs";

const offlineEs = { banner: "Sin conexion. Mostrando los ultimos datos guardados." };
const offlineEn = { banner: "Offline. Showing the last saved data." };
const offlinePt = { banner: "Sem conexao. Mostrando os ultimos dados salvos." };

const files = [
  ["src/shared/i18n/locales/es.json", offlineEs],
  ["src/shared/i18n/locales/en.json", offlineEn],
  ["src/shared/i18n/locales/pt.json", offlinePt],
];

for (const [file, dict] of files) {
  let content = fs.readFileSync(file, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const json = JSON.parse(content);
  json.offline = dict;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");
  console.log("Updated " + file);
}
