// ============================================================
// check_images.js — Script de verificación de imágenes
// Comprueba que las URLs de imágenes de deportes sean accesibles
// ============================================================

// Using native global fetch in Node v22

const urls = [
  {
    sport: "Fútbol",
    url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Básquet",
    url: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Vóley",
    url: "https://images.unsplash.com/photo-1592656094247-b98a09698714?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Natación",
    url: "https://images.unsplash.com/photo-1519666336592-e225a99dcd2f?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Tenis",
    url: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Pádel",
    url: "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Running",
    url: "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600",
  },
  {
    sport: "Gimnasio",
    url: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600",
  },
];

async function check() {
  for (const item of urls) {
    try {
      const res = await fetch(item.url, { method: "HEAD" });
      console.log(`Sport: ${item.sport} | Status: ${res.status} | OK: ${res.ok}`);
    } catch (err) {
      console.log(`Sport: ${item.sport} | Error: ${err.message}`);
    }
  }
}

check();
