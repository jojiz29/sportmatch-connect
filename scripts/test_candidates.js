// ============================================================
// test_candidates.js — Script de prueba de candidatos de matchmaking
// Verifica la estructura de datos de usuarios de prueba por deporte
// ============================================================

// Using native global fetch in Node v22
const candidates = [
  // Fútbol
  {
    sport: "Fútbol (soccer ball on field)",
    id: "1508098682722-e99c43a406b2",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Fútbol (alternative 1)",
    id: "1579952363873-27f3bade9f55",
    url: "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Fútbol (alternative 2)",
    id: "1517649763962-0c623066013b",
    url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Fútbol (alternative 3)",
    id: "1503676260728-1c00da094a0b",
    url: "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=600",
  },

  // Básquet
  {
    sport: "Básquet (hoop)",
    id: "1519766304817-4f37bda74a27",
    url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Básquet (alternative 1)",
    id: "1546519638-68e109498ffc",
    url: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Básquet (alternative 2)",
    id: "1519766304817-4f37bda74a27",
    url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=600",
  },

  // Vóley
  {
    sport: "Vóley (match)",
    id: "1592656094247-b98a09698714",
    url: "https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Vóley (alternative 1)",
    id: "1612872087720-bb876e2e67d1",
    url: "https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Vóley (alternative 2)",
    id: "1593787406539-566a3d904c78",
    url: "https://images.unsplash.com/photo-1593787406539-566a3d904c78?auto=format&fit=crop&q=80&w=600",
  },
];

async function check() {
  for (const item of candidates) {
    try {
      const res = await fetch(item.url, { method: "HEAD" });
      console.log(`[${res.status}] ${item.sport} - ${item.url}`);
    } catch (err) {
      console.log(`[ERR] ${item.sport} - ${err.message}`);
    }
  }
}

check();
