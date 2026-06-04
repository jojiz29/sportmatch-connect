export interface SportCardData {
  id: string;
  nameKey: string;
  descKey: string;
  emoji: string;
  category: "traditional" | "esports";
  styleClass: string;
  isExtra?: boolean;
}

export const SPORTS_CATALOG: SportCardData[] = [
  // === DEPORTES TRADICIONALES ===
  // Baseline (6 cards for perfect 3x2 grid)
  {
    id: "Fútbol",
    nameKey: "sports.futbol.name",
    descKey: "sports.futbol.desc",
    emoji: "⚽🏃",
    category: "traditional",
    styleClass:
      "bg-gradient-to-br from-emerald-800 via-emerald-950 to-green-950 border-emerald-500/30",
  },
  {
    id: "Vóley",
    nameKey: "sports.voley.name",
    descKey: "sports.voley.desc",
    emoji: "🏐🏐",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-amber-700 via-yellow-800 to-amber-950 border-amber-500/30",
  },
  {
    id: "Pádel",
    nameKey: "sports.padel.name",
    descKey: "sports.padel.desc",
    emoji: "🎾🧱",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-blue-900 via-cyan-900 to-blue-950 border-cyan-500/30",
  },
  {
    id: "Básquet",
    nameKey: "sports.basquet.name",
    descKey: "sports.basquet.desc",
    emoji: "🏀🦘",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-orange-800 via-orange-950 to-red-950 border-orange-500/30",
  },
  {
    id: "Tenis",
    nameKey: "sports.tenis.name",
    descKey: "sports.tenis.desc",
    emoji: "🎾🎾",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-red-800 via-red-950 to-orange-950 border-red-500/30",
  },
  {
    id: "Running",
    nameKey: "sports.running.name",
    descKey: "sports.running.desc",
    emoji: "🏃💨",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-orange-700 via-red-800 to-amber-950 border-orange-500/30",
  },
  // Long-Tail Extra (12 cards to complete exactly 18 Traditional Sports)
  {
    id: "Rugby",
    nameKey: "sports.rugby.name",
    descKey: "sports.rugby.desc",
    emoji: "🏉💪",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-lime-900 via-green-950 to-emerald-950 border-lime-500/30",
    isExtra: true,
  },
  {
    id: "Natación",
    nameKey: "sports.natacion.name",
    descKey: "sports.natacion.desc",
    emoji: "🏊🌊",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-cyan-900 via-blue-900 to-indigo-950 border-cyan-500/30",
    isExtra: true,
  },
  {
    id: "Gimnasio",
    nameKey: "sports.gimnasio.name",
    descKey: "sports.gimnasio.desc",
    emoji: "🏋️🏋️",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-zinc-800 via-stone-900 to-neutral-950 border-stone-500/30",
    isExtra: true,
  },
  {
    id: "Calistenia",
    nameKey: "sports.calistenia.name",
    descKey: "sports.calistenia.desc",
    emoji: "🤸🤸",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-teal-900 via-emerald-950 to-green-950 border-teal-500/30",
    isExtra: true,
  },
  {
    id: "Tenis de Mesa",
    nameKey: "sports.tenis_mesa.name",
    descKey: "sports.tenis_mesa.desc",
    emoji: "🏓⚪",
    category: "traditional",
    styleClass:
      "bg-gradient-to-br from-emerald-800 via-teal-900 to-green-950 border-emerald-500/30",
    isExtra: true,
  },
  {
    id: "Boxeo / MMA",
    nameKey: "sports.boxeo_mma.name",
    descKey: "sports.boxeo_mma.desc",
    emoji: "🥊🥋",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-red-900 via-stone-900 to-neutral-950 border-red-500/30",
    isExtra: true,
  },
  {
    id: "Ciclismo",
    nameKey: "sports.ciclismo.name",
    descKey: "sports.ciclismo.desc",
    emoji: "🚴💨",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-teal-800 via-cyan-950 to-slate-950 border-teal-500/30",
    isExtra: true,
  },
  {
    id: "Fútbol Americano",
    nameKey: "sports.futbol_americano.name",
    descKey: "sports.futbol_americano.desc",
    emoji: "🏈🏟",
    category: "traditional",
    styleClass:
      "bg-gradient-to-br from-emerald-900 via-stone-950 to-neutral-950 border-emerald-500/30",
    isExtra: true,
  },
  {
    id: "Béisbol",
    nameKey: "sports.beisbol.name",
    descKey: "sports.beisbol.desc",
    emoji: "⚾🦇",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-slate-700 via-zinc-800 to-stone-950 border-zinc-500/30",
    isExtra: true,
  },
  {
    id: "Skateboarding",
    nameKey: "sports.skateboarding.name",
    descKey: "sports.skateboarding.desc",
    emoji: "🛹🛹",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-rose-900 via-neutral-900 to-zinc-950 border-rose-500/30",
    isExtra: true,
  },
  {
    id: "Golf",
    nameKey: "sports.golf.name",
    descKey: "sports.golf.desc",
    emoji: "⛳🏌️",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-green-800 via-emerald-900 to-slate-950 border-green-500/30",
    isExtra: true,
  },
  {
    id: "Automovilismo",
    nameKey: "sports.automovilismo.name",
    descKey: "sports.automovilismo.desc",
    emoji: "🏎️🏁",
    category: "traditional",
    styleClass: "bg-gradient-to-br from-gray-800 via-stone-900 to-slate-950 border-gray-500/30",
    isExtra: true,
  },

  // === E-SPORTS & GAMING ===
  // Baseline (6 cards)
  {
    id: "EA Sports FC",
    nameKey: "sports.ea_fc.name",
    descKey: "sports.ea_fc.desc",
    emoji: "🎮⚽",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-blue-950 via-slate-900 to-blue-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)]",
  },
  {
    id: "League of Legends",
    nameKey: "sports.lol.name",
    descKey: "sports.lol.desc",
    emoji: "🧙⚔",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-purple-500/30 shadow-[inset_0_0_12px_rgba(168,85,247,0.15)]",
  },
  {
    id: "Valorant",
    nameKey: "sports.valorant.name",
    descKey: "sports.valorant.desc",
    emoji: "🎯🔫",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-rose-950 via-neutral-900 to-zinc-950 border-rose-500/30 shadow-[inset_0_0_10px_rgba(244,63,94,0.15)]",
  },
  {
    id: "Clash Royale",
    nameKey: "sports.clash_royale.name",
    descKey: "sports.clash_royale.desc",
    emoji: "👑🏰",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-blue-900 via-blue-950 to-slate-950 border-yellow-400/40 shadow-[inset_0_0_10px_rgba(250,204,21,0.2)]",
  },
  {
    id: "Fortnite",
    nameKey: "sports.fortnite.name",
    descKey: "sports.fortnite.desc",
    emoji: "🪂⛏",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-fuchsia-900 via-purple-950 to-indigo-950 border-fuchsia-500/30 shadow-[inset_0_0_10px_rgba(217,70,239,0.15)]",
  },
  {
    id: "Brawl Stars",
    nameKey: "sports.brawl_stars.name",
    descKey: "sports.brawl_stars.desc",
    emoji: "🤠⭐",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-yellow-600 via-amber-900 to-red-950 border-yellow-500/50 shadow-[inset_0_0_15px_rgba(234,179,8,0.25)]",
  },
  // Long-Tail Extra (12 cards to complete exactly 18 E-Sports)
  {
    id: "Counter-Strike 2",
    nameKey: "sports.cs2.name",
    descKey: "sports.cs2.desc",
    emoji: "🎯💣",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-amber-950 via-slate-900 to-zinc-950 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.15)]",
    isExtra: true,
  },
  {
    id: "Dota 2",
    nameKey: "sports.dota2.name",
    descKey: "sports.dota2.desc",
    emoji: "🛡️⚔",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-red-950 via-neutral-900 to-stone-950 border-red-500/30 shadow-[inset_0_0_12px_rgba(220,38,38,0.15)]",
    isExtra: true,
  },
  {
    id: "Rocket League",
    nameKey: "sports.rocket_league.name",
    descKey: "sports.rocket_league.desc",
    emoji: "🚗⚽",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-blue-950 via-indigo-950 to-slate-950 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]",
    isExtra: true,
  },
  {
    id: "Overwatch 2",
    nameKey: "sports.overwatch2.name",
    descKey: "sports.overwatch2.desc",
    emoji: "🛡️🔫",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-orange-950 via-zinc-900 to-slate-950 border-orange-500/30 shadow-[inset_0_0_10px_rgba(249,115,22,0.15)]",
    isExtra: true,
  },
  {
    id: "Street Fighter / Tekken",
    nameKey: "sports.street_fighter_tekken.name",
    descKey: "sports.street_fighter_tekken.desc",
    emoji: "🥊⚡",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-red-950 via-purple-950 to-neutral-950 border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)]",
    isExtra: true,
  },
  {
    id: "Apex Legends",
    nameKey: "sports.apex_legends.name",
    descKey: "sports.apex_legends.desc",
    emoji: "🚀🔫",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-red-950 via-zinc-900 to-slate-900 border-red-500/30 shadow-[inset_0_0_10px_rgba(239,68,68,0.15)]",
    isExtra: true,
  },
  {
    id: "PUBG Mobile",
    nameKey: "sports.pubg_mobile.name",
    descKey: "sports.pubg_mobile.desc",
    emoji: "🪂🍳",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-yellow-950 via-neutral-900 to-zinc-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)]",
    isExtra: true,
  },
  {
    id: "Free Fire",
    nameKey: "sports.free_fire.name",
    descKey: "sports.free_fire.desc",
    emoji: "📱🔥",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-amber-950 via-red-950 to-neutral-950 border-amber-500/30 shadow-[inset_0_0_10px_rgba(245,158,11,0.15)]",
    isExtra: true,
  },
  {
    id: "Call of Duty: Warzone",
    nameKey: "sports.cod_warzone.name",
    descKey: "sports.cod_warzone.desc",
    emoji: "🎖️🔫",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-stone-900 via-neutral-900 to-zinc-950 border-stone-500/30 shadow-[inset_0_0_10px_rgba(120,113,108,0.15)]",
    isExtra: true,
  },
  {
    id: "Rainbow Six Siege",
    nameKey: "sports.rainbow_six.name",
    descKey: "sports.rainbow_six.desc",
    emoji: "🛡️💥",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-blue-950 via-slate-900 to-neutral-950 border-blue-500/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.15)]",
    isExtra: true,
  },
  {
    id: "Hearthstone",
    nameKey: "sports.hearthstone.name",
    descKey: "sports.hearthstone.desc",
    emoji: "🃏🔮",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-amber-900 via-yellow-950 to-slate-950 border-yellow-500/30 shadow-[inset_0_0_10px_rgba(234,179,8,0.15)]",
    isExtra: true,
  },
  {
    id: "iRacing / F1 SimRacing",
    nameKey: "sports.iracing_simracing.name",
    descKey: "sports.iracing_simracing.desc",
    emoji: "🏎️🎮",
    category: "esports",
    styleClass:
      "bg-gradient-to-br from-stone-800 via-slate-900 to-black border-red-500/30 shadow-[inset_0_0_12px_rgba(239,68,68,0.15)]",
    isExtra: true,
  },
];
