export type Sport = "Fútbol" | "Básquet" | "Tenis" | "Pádel" | "Vóley" | "Running";

export const SPORTS: { name: Sport; emoji: string }[] = [
  { name: "Fútbol", emoji: "⚽" },
  { name: "Básquet", emoji: "🏀" },
  { name: "Tenis", emoji: "🎾" },
  { name: "Pádel", emoji: "🏓" },
  { name: "Vóley", emoji: "🏐" },
  { name: "Running", emoji: "🏃" },
];

export type Player = {
  id: string;
  name: string;
  age: number;
  distanceKm: number;
  sport: Sport;
  level: "Principiante" | "Intermedio" | "Avanzado" | "Elite";
  trustScore: number; // 0-100
  fitcoins: number;
  matches: number;
  bio: string;
  avatar: string;
  available: string;
};

const avatars = (seed: string) =>
  `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=7c3aed,2563eb,059669,db2777`;

export const PLAYERS: Player[] = [
  { id: "p1", name: "Camila Torres", age: 24, distanceKm: 1.2, sport: "Pádel", level: "Avanzado", trustScore: 96, fitcoins: 1240, matches: 87, bio: "Compito en torneos los fines de semana. Busco rivales constantes.", avatar: avatars("Camila"), available: "Hoy 19:00" },
  { id: "p2", name: "Diego Ramírez", age: 28, distanceKm: 2.4, sport: "Fútbol", level: "Intermedio", trustScore: 88, fitcoins: 860, matches: 54, bio: "Mediocampista. Juego martes y jueves después del trabajo.", avatar: avatars("Diego"), available: "Mañana 20:30" },
  { id: "p3", name: "Sofía Méndez", age: 22, distanceKm: 0.8, sport: "Tenis", level: "Avanzado", trustScore: 92, fitcoins: 1530, matches: 102, bio: "Saque potente, busco peloteo serio.", avatar: avatars("Sofia"), available: "Hoy 18:00" },
  { id: "p4", name: "Mateo Sánchez", age: 31, distanceKm: 3.1, sport: "Básquet", level: "Elite", trustScore: 98, fitcoins: 2100, matches: 145, bio: "Ex-universitario. Pickup games todos los sábados.", avatar: avatars("Mateo"), available: "Sáb 10:00" },
  { id: "p5", name: "Lucía Fernández", age: 26, distanceKm: 1.7, sport: "Running", level: "Avanzado", trustScore: 94, fitcoins: 980, matches: 60, bio: "10K en 45min. Busco grupo para entrenamientos largos.", avatar: avatars("Lucia"), available: "Dom 7:00" },
  { id: "p6", name: "Andrés Pérez", age: 29, distanceKm: 2.0, sport: "Pádel", level: "Intermedio", trustScore: 81, fitcoins: 540, matches: 38, bio: "Mejorando el revés. Juego 2 veces por semana.", avatar: avatars("Andres"), available: "Hoy 21:00" },
];

export type Court = {
  id: string;
  name: string;
  sport: Sport;
  pricePerHour: number;
  rating: number;
  reviews: number;
  distanceKm: number;
  image: string;
  amenities: string[];
  available: boolean;
};

const courtImg = (q: string) => `https://images.unsplash.com/${q}?auto=format&fit=crop&w=900&q=80`;

export const COURTS: Court[] = [
  { id: "c1", name: "Club Pádel Central", sport: "Pádel", pricePerHour: 28, rating: 4.8, reviews: 312, distanceKm: 0.6, image: courtImg("photo-1554068865-24cecd4e34b8"), amenities: ["Iluminación", "Vestuarios", "Parking"], available: true },
  { id: "c2", name: "Cancha Estadio Norte", sport: "Fútbol", pricePerHour: 60, rating: 4.6, reviews: 480, distanceKm: 1.4, image: courtImg("photo-1551958219-acbc608c6377"), amenities: ["Pasto sintético", "Cafetería"], available: true },
  { id: "c3", name: "Tennis Club Mirador", sport: "Tenis", pricePerHour: 22, rating: 4.9, reviews: 198, distanceKm: 2.1, image: courtImg("photo-1622279457486-62dcc4a431d6"), amenities: ["Polvo de ladrillo", "Pro shop"], available: false },
  { id: "c4", name: "Arena Básquet 360", sport: "Básquet", pricePerHour: 35, rating: 4.7, reviews: 256, distanceKm: 1.8, image: courtImg("photo-1546519638-68e109498ffc"), amenities: ["Indoor", "AC"], available: true },
];

export type MatchEvent = {
  id: string;
  sport: Sport;
  title: string;
  date: string;
  spots: { taken: number; total: number };
  level: Player["level"];
  court: string;
};

export const MATCHES: MatchEvent[] = [
  { id: "m1", sport: "Pádel", title: "Doble mixto · Friendly", date: "Hoy · 19:00", spots: { taken: 3, total: 4 }, level: "Intermedio", court: "Club Pádel Central" },
  { id: "m2", sport: "Fútbol", title: "Fútbol 7 · Liga amateur", date: "Mañana · 20:30", spots: { taken: 9, total: 14 }, level: "Avanzado", court: "Estadio Norte" },
  { id: "m3", sport: "Básquet", title: "Pickup 5v5", date: "Sáb · 10:00", spots: { taken: 6, total: 10 }, level: "Elite", court: "Arena Básquet 360" },
  { id: "m4", sport: "Tenis", title: "Singles competitivo", date: "Hoy · 18:00", spots: { taken: 1, total: 2 }, level: "Avanzado", court: "Tennis Club Mirador" },
];

export const ME = {
  name: "Alex Rivera",
  age: 27,
  city: "Buenos Aires",
  trustScore: 93,
  fitcoins: 1850,
  matches: 76,
  level: "Avanzado" as const,
  sports: ["Pádel", "Fútbol", "Running"] as Sport[],
  avatar: avatars("AlexRivera"),
  badges: [
    { id: "b1", name: "Racha 10", emoji: "🔥" },
    { id: "b2", name: "MVP del mes", emoji: "🏆" },
    { id: "b3", name: "Puntual", emoji: "⏱️" },
    { id: "b4", name: "Top 5%", emoji: "💎" },
  ],
};

export const LEADERBOARD = [
  { rank: 1, name: "Mateo Sánchez", coins: 2100, avatar: avatars("Mateo") },
  { rank: 2, name: "Alex Rivera", coins: 1850, avatar: ME.avatar },
  { rank: 3, name: "Sofía Méndez", coins: 1530, avatar: avatars("Sofia") },
  { rank: 4, name: "Camila Torres", coins: 1240, avatar: avatars("Camila") },
  { rank: 5, name: "Lucía Fernández", coins: 980, avatar: avatars("Lucia") },
];

export const CHATS = [
  { id: "ch1", name: "Doble Pádel · Hoy", last: "Camila: Llego en 10 ⚡", unread: 2, group: true, avatar: avatars("Camila") },
  { id: "ch2", name: "Diego Ramírez", last: "¿Confirmás el partido?", unread: 0, group: false, avatar: avatars("Diego") },
  { id: "ch3", name: "Pickup 5v5", last: "Mateo: Llevo el balón", unread: 5, group: true, avatar: avatars("Mateo") },
  { id: "ch4", name: "Sofía Méndez", last: "Buen partido 🎾", unread: 0, group: false, avatar: avatars("Sofia") },
];

export const IOT = {
  heartRate: 142,
  calories: 612,
  distanceKm: 7.4,
  pace: "5:32",
  steps: 9120,
  weeklyLoad: [60, 72, 45, 88, 30, 95, 70],
};

export const ADMIN_KPI = {
  users: 12480,
  matchesToday: 312,
  revenue: 28450,
  occupancy: 78,
  weekly: [40, 55, 62, 70, 65, 88, 92],
  sportsShare: [
    { sport: "Pádel", value: 42 },
    { sport: "Fútbol", value: 28 },
    { sport: "Tenis", value: 14 },
    { sport: "Básquet", value: 10 },
    { sport: "Otros", value: 6 },
  ],
};
