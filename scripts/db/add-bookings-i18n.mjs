import fs from "node:fs";

const bookingsEs = {
  title: "Calendario de reservas",
  slots_for: "Horarios disponibles",
  no_slots: "No hay horarios disponibles",
  confirm_title: "Confirmar reserva",
  confirm: "Reservar",
  price: "Precio",
  my_bookings: "Mis reservas",
  confirm_cancel: "Cancelar esta reserva?",
};

const bookingsEn = {
  title: "Booking calendar",
  slots_for: "Available slots",
  no_slots: "No available slots",
  confirm_title: "Confirm booking",
  confirm: "Book",
  price: "Price",
  my_bookings: "My bookings",
  confirm_cancel: "Cancel this booking?",
};

const bookingsPt = {
  title: "Calendario de reservas",
  slots_for: "Horarios disponiveis",
  no_slots: "Sem horarios disponiveis",
  confirm_title: "Confirmar reserva",
  confirm: "Reservar",
  price: "Preco",
  my_bookings: "Minhas reservas",
  confirm_cancel: "Cancelar esta reserva?",
};

const files = [
  ["src/shared/i18n/locales/es.json", bookingsEs],
  ["src/shared/i18n/locales/en.json", bookingsEn],
  ["src/shared/i18n/locales/pt.json", bookingsPt],
];

for (const [file, dict] of files) {
  let content = fs.readFileSync(file, "utf-8");
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);
  const json = JSON.parse(content);
  json.bookings = dict;
  fs.writeFileSync(file, JSON.stringify(json, null, 2) + "\n", "utf-8");
  console.log("Updated " + file);
}
