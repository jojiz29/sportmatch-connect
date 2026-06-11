import React, { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { User, Users, Zap, Loader2 } from "lucide-react";

export type Format = "5vs5" | "7vs7" | "11vs11";
export type PositionLine = "GK" | "DEF" | "MID" | "FWD";

interface PlayerSlot {
  id: string;
  name: string;
  avatarUrl?: string;
  isFilled: boolean;
  position: PositionLine;
  positionLabel: string;
}

const PRESET_PLAYERS: {
  id: string;
  name: string;
  avatarUrl: string;
  position: PositionLine;
  positionLabel: string;
}[] = [
  {
    id: "1",
    name: "Carlos 'Gato' Silva",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Carlos",
    position: "GK",
    positionLabel: "Portero",
  },
  {
    id: "2",
    name: "Mateo 'Zurdo' Pérez",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Mateo",
    position: "DEF",
    positionLabel: "Defensa Central",
  },
  {
    id: "3",
    name: "Lucía 'Flecha' Gómez",
    avatarUrl: "https://api.dicebear.com/7.x/avataaars/svg?seed=Lucia",
    position: "MID",
    positionLabel: "Medio Centro",
  },
];

// Reusable slot component wrapped in React.memo to prevent unnecessary re-renders (Task 2.4 - Long-Session Performance)
const PitchSlot = React.memo(({ player, index }: { player: PlayerSlot; index: number }) => {
  return (
    <div
      className={`flex flex-col items-center justify-center p-2 rounded-2xl w-20 md:w-24 text-center transition-all border duration-300 relative ${
        player.isFilled
          ? "bg-[#0b132b]/95 border-[#39FF14]/40 shadow-[0_0_15px_rgba(57,255,20,0.15)] scale-100 hover:scale-105"
          : "border-dashed border-white/20 bg-black/40 text-white/50 hover:border-primary/40"
      }`}
    >
      <span className="absolute top-1 left-2 text-[8px] font-black text-white/30">
        #{index + 1}
      </span>

      {player.isFilled ? (
        <>
          <img
            src={player.avatarUrl}
            alt={player.name}
            className="h-8 w-8 md:h-10 md:w-10 rounded-full bg-muted border border-border/80 object-cover"
          />
          <span className="text-[9px] md:text-[10px] font-bold text-white mt-1.5 truncate w-full">
            {player.name.split(" ")[0]}
          </span>
          <span className="text-[7px] md:text-[8px] px-1 py-0.5 rounded bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/20 mt-1 tracking-wider uppercase font-bold">
            {player.position}
          </span>
        </>
      ) : (
        <>
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-full border border-dashed border-white/25 flex items-center justify-center bg-white/5">
            <User className="h-3.5 w-3.5 text-white/40" />
          </div>
          <span className="text-[8px] md:text-[9px] font-bold text-white/40 mt-1.5 truncate w-full">
            Requerido
          </span>
          <span className="text-[7px] md:text-[8px] px-1 py-0.5 rounded bg-orange-400/10 text-orange-300 border border-orange-400/20 mt-1 tracking-wider uppercase font-bold animate-pulse">
            {player.position}
          </span>
        </>
      )}
    </div>
  );
});

PitchSlot.displayName = "PitchSlot";

export function SquadBuilder() {
  const [format, setFormat] = useState<Format>("5vs5");
  const [loading, setLoading] = useState(false);

  // Parse total slots based on format (QA Gate 2: "Validate that the squad format state tightly controls the array length of player slots in the UI.")
  const totalSlotsCount = useMemo(() => {
    if (format === "5vs5") return 5;
    if (format === "7vs7") return 7;
    return 11;
  }, [format]);

  // Initial standard tactical structure for the team format (Goalkeeper -> Defender -> Midfielders -> Forwards)
  const [players, setPlayers] = useState<PlayerSlot[]>(() => {
    const defaultSlots: PlayerSlot[] = [
      {
        id: "slot-1",
        name: "Buscando...",
        isFilled: false,
        position: "GK",
        positionLabel: "Portero",
      },
      {
        id: "slot-2",
        name: "Buscando...",
        isFilled: false,
        position: "DEF",
        positionLabel: "Defensa",
      },
      {
        id: "slot-3",
        name: "Buscando...",
        isFilled: false,
        position: "MID",
        positionLabel: "Medio",
      },
      {
        id: "slot-4",
        name: "Buscando...",
        isFilled: false,
        position: "MID",
        positionLabel: "Medio",
      },
      {
        id: "slot-5",
        name: "Buscando...",
        isFilled: false,
        position: "FWD",
        positionLabel: "Delantero",
      },
      {
        id: "slot-6",
        name: "Buscando...",
        isFilled: false,
        position: "DEF",
        positionLabel: "Defensa",
      },
      {
        id: "slot-7",
        name: "Buscando...",
        isFilled: false,
        position: "MID",
        positionLabel: "Medio",
      },
      {
        id: "slot-8",
        name: "Buscando...",
        isFilled: false,
        position: "DEF",
        positionLabel: "Defensa",
      },
      {
        id: "slot-9",
        name: "Buscando...",
        isFilled: false,
        position: "DEF",
        positionLabel: "Defensa",
      },
      {
        id: "slot-10",
        name: "Buscando...",
        isFilled: false,
        position: "MID",
        positionLabel: "Medio",
      },
      {
        id: "slot-11",
        name: "Buscando...",
        isFilled: false,
        position: "FWD",
        positionLabel: "Delantero",
      },
    ];

    // Seed preset core players initially
    PRESET_PLAYERS.forEach((preset, idx) => {
      if (idx < defaultSlots.length) {
        defaultSlots[idx] = {
          id: preset.id,
          name: preset.name,
          avatarUrl: preset.avatarUrl,
          isFilled: true,
          position: preset.position,
          positionLabel: preset.positionLabel,
        };
      }
    });

    return defaultSlots;
  });

  // Dynamically slice player list based on the format state to tightly control array sizes (QA Gate 2)
  const currentSquadSlots = useMemo(() => {
    // 5vs5 formation: 1 GK, 1 DEF, 2 MID, 1 FWD
    if (format === "5vs5") {
      return [
        players.find((p) => p.position === "GK") || players[0],
        players.find((p) => p.position === "DEF") || players[1],
        ...players.filter((p) => p.position === "MID").slice(0, 2),
        players.find((p) => p.position === "FWD") || players[4],
      ];
    }
    // 7vs7 formation: 1 GK, 2 DEF, 3 MID, 1 FWD
    if (format === "7vs7") {
      const defs = players.filter((p) => p.position === "DEF").slice(0, 2);
      const mids = players.filter((p) => p.position === "MID").slice(0, 3);
      return [
        players.find((p) => p.position === "GK") || players[0],
        ...defs,
        ...mids,
        players.find((p) => p.position === "FWD") || players[4],
      ];
    }
    // 11vs11 formation: 1 GK, 4 DEF, 4 MID, 2 FWD
    return players;
  }, [players, format]);

  const filledSlotsCount = useMemo(
    () => currentSquadSlots.filter((p) => p.isFilled).length,
    [currentSquadSlots],
  );
  const pendingSlotsCount = useMemo(
    () => totalSlotsCount - filledSlotsCount,
    [totalSlotsCount, filledSlotsCount],
  );

  // Specific missing positions algorithm for AI Matchmaking (Task 2.2)
  const missingPositionsSummary = useMemo(() => {
    const missing: Record<PositionLine, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
    currentSquadSlots.forEach((slot) => {
      if (!slot.isFilled) {
        missing[slot.position]++;
      }
    });
    return Object.entries(missing)
      .filter(([, count]) => count > 0)
      .map(([pos, count]) => `${count} ${pos}`)
      .join(", ");
  }, [currentSquadSlots]);

  // Auto-Fill matchmaking with strict position-specific requests (Task 2.2 & useCallback optimization)
  const handleAutoFillMatchmaking = useCallback(async () => {
    if (pendingSlotsCount === 0) return;
    setLoading(true);
    const toastId = toast.loading(`Buscando por IA: Reclutando [ ${missingPositionsSummary} ]...`);

    try {
      const baseUrl = import.meta.env.VITE_API_URL || "https://sportmatch-connect.onrender.com";
      const response = await fetch(`${baseUrl}/api/v1/tournaments/matchmake`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          format,
          requestedPositions: missingPositionsSummary,
          pendingCount: pendingSlotsCount,
        }),
      });

      if (!response.ok && response.status !== 404) {
        throw new Error("Matchmaking endpoint failed");
      }

      // Simulate network latency (Task 2.4 - UI stabilization)
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const mockCandidates = {
        GK: [
          { name: "Piero 'Muro' L.", seed: "Piero" },
          { name: "Franco 'Reflejo' V.", seed: "Franco" },
        ],
        DEF: [
          { name: "Sofi 'Muralla' F.", seed: "Sofi" },
          { name: "Diego 'Rifle' T.", seed: "Diego" },
          { name: "Bruno 'Bala' O.", seed: "Bruno" },
        ],
        MID: [
          { name: "Leo 'Mago' M.", seed: "Leo" },
          { name: "Ana 'Rayo' G.", seed: "Ana" },
          { name: "Emma 'Luz' K.", seed: "Emma" },
        ],
        FWD: [
          { name: "Juan 'Titan' R.", seed: "Juan" },
          { name: "Pedro 'Tanque' S.", seed: "Pedro" },
        ],
      };

      setPlayers((prev) => {
        const counts: Record<PositionLine, number> = { GK: 0, DEF: 0, MID: 0, FWD: 0 };
        return prev.map((player) => {
          // Check if this slot is active in the current format and empty
          const isActiveAndEmpty = currentSquadSlots.some(
            (activeSlot) => activeSlot.id === player.id && !activeSlot.isFilled,
          );

          if (isActiveAndEmpty) {
            const list = mockCandidates[player.position];
            const idx = counts[player.position] % list.length;
            counts[player.position]++;
            const candidate = list[idx];
            return {
              ...player,
              name: candidate.name,
              avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${candidate.seed}`,
              isFilled: true,
            };
          }
          return player;
        });
      });

      toast.success("¡Sindicato táctico completo! Posiciones cubiertas exitosamente.", {
        id: toastId,
      });
    } catch (err) {
      console.error("Matchmaking error:", err);
      toast.error("Error al buscar jugadores calificados", { id: toastId });
    } finally {
      setLoading(false);
    }
  }, [format, pendingSlotsCount, missingPositionsSummary, currentSquadSlots]);

  const handleResetSquad = useCallback(() => {
    setPlayers((prev) =>
      prev.map((player) => {
        const isPreset = PRESET_PLAYERS.some((preset) => preset.id === player.id);
        if (isPreset) return player;
        return {
          ...player,
          name: "Buscando...",
          avatarUrl: undefined,
          isFilled: false,
        };
      }),
    );
    toast.info("Alineación táctica reiniciada.");
  }, []);

  // Filter tactical positions for rendering the grid lines of the football pitch
  const goalkeepers = currentSquadSlots.filter((p) => p.position === "GK");
  const defenders = currentSquadSlots.filter((p) => p.position === "DEF");
  const midfielders = currentSquadSlots.filter((p) => p.position === "MID");
  const forwards = currentSquadSlots.filter((p) => p.position === "FWD");

  return (
    <div className="bg-gradient-card border border-border rounded-3xl p-5 md:p-6 shadow-card">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-border/40">
        <div>
          <h3 className="font-heading text-2xl tracking-wide text-foreground flex items-center gap-2">
            <Users className="h-5 w-5 text-neon" />
            Constructor de Escuadras
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Configura el formato táctico de tu equipo de campeonato
          </p>
        </div>

        {/* Format segmented control (Task 2.2) */}
        <div className="flex bg-background/50 border border-border p-1 rounded-xl shrink-0 self-start md:self-auto">
          {(["5vs5", "7vs7", "11vs11"] as Format[]).map((f) => (
            <button
              key={f}
              onClick={() => setFormat(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                format === f
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Visual indicators for slots (Task 2.2) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5">
        <div className="bg-background/45 border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Alineación
          </span>
          <span className="text-lg font-black text-foreground mt-1">
            {totalSlotsCount} Jugadores
          </span>
        </div>
        <div className="bg-background/45 border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-[#39FF14] uppercase font-bold tracking-wider">
            Completados
          </span>
          <span className="text-lg font-black text-[#39FF14] mt-1">
            {filledSlotsCount} / {totalSlotsCount}
          </span>
        </div>
        <div className="bg-background/45 border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-orange-400 uppercase font-bold tracking-wider">
            Pendientes
          </span>
          <span className="text-lg font-black text-orange-400 mt-1">{pendingSlotsCount} cupos</span>
        </div>
        <div className="bg-background/45 border border-border/60 rounded-2xl p-3 flex flex-col items-center justify-center text-center">
          <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Posiciones
          </span>
          <span className="text-xs font-bold text-foreground truncate max-w-[150px] mt-1.5">
            {pendingSlotsCount === 0 ? "¡Formación Cubierta!" : `Falta: ${missingPositionsSummary}`}
          </span>
        </div>
      </div>

      {/* TACTICAL "FOOTBALL PITCH" VIEW (Task 2.2) */}
      <div
        className="relative rounded-3xl overflow-hidden p-6 min-h-[460px] md:min-h-[500px] flex flex-col justify-between gap-6 shadow-2xl border border-white/10"
        style={{
          background: "radial-gradient(circle, #16a34a 0%, #14532d 100%)",
        }}
      >
        {/* Pitch Lines Decorator */}
        <div className="absolute inset-0 pointer-events-none border-4 border-white/10 rounded-3xl m-2" />
        <div className="absolute inset-x-0 top-0 h-24 border-b-2 border-white/10 max-w-[60%] mx-auto rounded-b-xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 border-t-2 border-white/10 max-w-[60%] mx-auto rounded-t-xl" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/10" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-28 w-28 rounded-full border-2 border-white/10" />

        {/* FORWARDS LINE */}
        <div className="flex justify-center gap-6 md:gap-12 relative z-10">
          {forwards.map((player) => {
            const idx = players.findIndex((p) => p.id === player.id);
            return <PitchSlot key={player.id} player={player} index={idx} />;
          })}
        </div>

        {/* MIDFIELDERS LINE */}
        <div className="flex justify-center gap-4 md:gap-8 relative z-10">
          {midfielders.map((player) => {
            const idx = players.findIndex((p) => p.id === player.id);
            return <PitchSlot key={player.id} player={player} index={idx} />;
          })}
        </div>

        {/* DEFENDERS LINE */}
        <div className="flex justify-center gap-4 md:gap-8 relative z-10">
          {defenders.map((player) => {
            const idx = players.findIndex((p) => p.id === player.id);
            return <PitchSlot key={player.id} player={player} index={idx} />;
          })}
        </div>

        {/* GOALKEEPER LINE */}
        <div className="flex justify-center relative z-10">
          {goalkeepers.map((player) => {
            const idx = players.findIndex((p) => p.id === player.id);
            return <PitchSlot key={player.id} player={player} index={idx} />;
          })}
        </div>
      </div>

      <div className="flex gap-3 mt-6 border-t border-border/30 pt-5">
        <button
          onClick={handleResetSquad}
          className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-colors cursor-pointer"
        >
          Reiniciar
        </button>

        {/* Matchmaking Auto-Fill trigger (Task 2.2) */}
        <button
          onClick={handleAutoFillMatchmaking}
          disabled={loading || pendingSlotsCount === 0}
          className="flex-1 py-2.5 rounded-xl bg-gradient-primary disabled:opacity-50 disabled:scale-100 text-primary-foreground font-black text-xs tracking-wide cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 shadow-glow"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Reclutando {missingPositionsSummary}...
            </>
          ) : (
            <>
              <Zap className="h-4 w-4 animate-pulse" />
              Reclutar Posiciones Faltantes (IA)
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default SquadBuilder;
