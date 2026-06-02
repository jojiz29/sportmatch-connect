import { EXCEL_MOCK_COURTS } from "../src/shared/api/mockCourtsData.ts";

const targetNames = [
  "Padel Center Surco",
  "Deporcentro Casuarinas",
  "Complejo Municipal Surco",
  "Soccer City Surco",
  "Alborada Tennis Club",
  "Club Germania",
  "La 10 - Surco",
  "Padel Rooftop Jockey",
  "Polideportivo Sagitario",
  "Vikingos Padel Club",
  "Gimnasio Smart Fit Surco",
  "Club Monterrico",
  "Canchas El Gol",
  "Surco Vóley Club",
  "Skatepark Surco",
  "Polideportivo Limatambo",
  "Pentagonito (Running Hub)",
  "Tennis Club San Borja",
  "Miraflores Padel Club",
  "Estadio Manuel Bonilla",
  "Centro Naval San Borja",
  "Rooftop Tennis Miraflores",
  "Complejo Chino Vasquez",
  "San Borja Sur Soccer",
  "Miraflores Skate Park",
  "Campo de Marte",
  "Complejo Huantille",
  "Estadio Nacional (IPD)",
  "Ymca Perú",
  "Complejo Mariscal Castilla",
  "Magdalena Padel",
  "Centro Juvenil Lince",
  "Piscina Olímpica",
  "Círculo Militar",
  "Costa Verde Sports",
];

console.log("Total target names:", targetNames.length);
let count = 0;
targetNames.forEach((name) => {
  const found = EXCEL_MOCK_COURTS.find((c) => c.name.toLowerCase() === name.toLowerCase());
  if (found) {
    count++;
  } else {
    console.log("Missing:", name);
  }
});
console.log("Found in mock courts:", count);
