import fs from "node:fs";

const mapEs = {
  title: "Canchas cercanas",
  my_location: "Mi ubicacion",
  sport_label: "Deporte",
  radius_label: "Radio",
  price_label: "Precio maximo",
  any: "Cualquiera",
  searching: "Buscando canchas...",
  courts_found: "canchas encontradas",
  attribution: "Tiles por OpenStreetMap contributors",
};

const mapEn = {
  title: "Nearby courts",
  my_location: "My location",
  sport_label: "Sport",
  radius_label: "Radius",
  price_label: "Max price",
  any: "Any",
  searching: "Searching courts...",
  courts_found: "courts found",
  attribution: "Tiles by OpenStreetMap contributors",
};

const mapPt = {
  title: "Quadras proximas",
  my_location: "Minha localizacao",
  sport_label: "Esporte",
  radius_label: "Raio",
  price_label: "Preco maximo",
  any: "Qualquer",
  searching: "Buscando quadras...",
  courts_found: "quadras encontradas",
  attribution: "Tiles por OpenStreetMap contributors",
};

const files = [
  ["src/shared/i18n/locales/es.json", mapEs],
  ["src/shared/i18n/locales/en.json", mapEn],
  ["src/shared/i18n/locales/pt.json", mapPt],
];

for (const [file, dict] of files) {
  let content = fs.readFileSync(file, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const json = JSON.parse(content);
  json.map = dict;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");
  console.log("Updated " + file);
}
