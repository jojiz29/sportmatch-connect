// === BLOQUE: IMPORTACIONES ===
import React, { useState, useMemo, useEffect } from "react";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  Swords,
  ChevronRight,
  Zap,
  Search,
  MessageSquare,
  RefreshCw,
  Sliders,
} from "lucide-react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS } from "@/shared/api/apiClient";
import { getSquads } from "@/shared/api/squadService";
import { User, Squad } from "@/entities/types";

// === BLOQUE: INTERFACES DE TIPOS ===
interface Team {
  id: string;
  name: string;
  logoSeed: string;
  score?: number;
  isWinner?: boolean;
}

interface MatchNode {
  id: string;
  teamA: Team;
  teamB: Team;
  winnerId?: string;
}

// === BLOQUE: ESCUADRAS LOCALES DE COMPLEMENTO ===
// Equipos realistas de Lima para rellenar las llaves si hay pocos Squads creados en la BD.
// Esto evita la data genérica "sucia" anterior y ofrece una atmósfera deportiva real de Lima.
const AMATEUR_LIMA_SQUADS: Team[] = [
  { id: "local-1", name: "Surco Pichanga Club", logoSeed: "surco-pichanga" },
  { id: "local-2", name: "La Molina Pádel Team", logoSeed: "molina-padel" },
  { id: "local-3", name: "Miraflores Tenis Squad", logoSeed: "mira-tenis" },
  { id: "local-4", name: "San Borja Básquet F.C.", logoSeed: "borja-basket" },
  { id: "local-5", name: "Lince Vóley Club", logoSeed: "lince-voley" },
  { id: "local-6", name: "Chorrillos FC", logoSeed: "chorri-fc" },
  { id: "local-7", name: "Barranco Running Squad", logoSeed: "barranco-run" },
  { id: "local-8", name: "San Isidro Pádel Pro", logoSeed: "isidro-padel" },
  { id: "local-9", name: "Magdalena Básquet Hub", logoSeed: "magda-basket" },
  { id: "local-10", name: "Surquillo Pichanga Club", logoSeed: "surquillo-pich" },
  { id: "local-11", name: "La Victoria Futsal", logoSeed: "victoria-futsal" },
  { id: "local-12", name: "San Miguel Vóley Team", logoSeed: "miguel-voley" },
  { id: "local-13", name: "Pueblo Libre Pádel", logoSeed: "pueblo-padel" },
  { id: "local-14", name: "Ate Fútbol Asociación", logoSeed: "ate-futbol" },
  { id: "local-15", name: "Jesús María Tenis Club", logoSeed: "jesus-tenis" },
  { id: "local-16", name: "Comas Pichangueros F.C.", logoSeed: "comas-pich" },
];

const SPORT_FORMAT_CONFIG: Record<string, { starters: number; subs: number; formats: string[] }> = {
  Fútbol: { starters: 7, subs: 3, formats: ["5vs5", "7vs7", "11vs11"] },
  Vóley: { starters: 6, subs: 3, formats: ["6vs6"] },
  Pádel: { starters: 2, subs: 1, formats: ["2vs2"] },
  Tenis: { starters: 2, subs: 1, formats: ["1vs1", "2vs2"] },
  Básquet: { starters: 5, subs: 2, formats: ["3vs3", "5vs5"] },
};

export function TournamentHub() {
  const currentUser = useAuthStore((state) => state.user);

  // === ESTADOS DE NAVEGACIÓN Y CONFIGURACIÓN ===
  const [activeTab, setActiveTab] = useState<"brackets" | "squads">("brackets");
  const [selectedSport, setSelectedSport] = useState<
    "Fútbol" | "Vóley" | "Pádel" | "Básquet" | "Tenis"
  >("Fútbol");
  const [squadFormat, setSquadFormat] = useState<string>("7vs7");
  const [tournamentSize, setTournamentSize] = useState<2 | 4 | 8 | 16>(8); // 2 = Final, 4 = Semis, 8 = Cuartos, 16 = Octavos
  const [championshipCode, setChampionshipCode] = useState("COPA-CHAMP-2026");
  const [searchCodeInput, setSearchCodeInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // === ESTADOS DE LA BASE DE DATOS DE SQUADS ===
  const [dbSquads, setDbSquads] = useState<Squad[]>([]);
  const [isLoadingSquads, setIsLoadingSquads] = useState(true);

  // === ESTADOS DE LA LLAVE (BRACKETS) DINÁMICA ===
  const [brackets, setBrackets] = useState<{
    round16: MatchNode[];
    quarters: MatchNode[];
    semis: MatchNode[];
    finals: MatchNode[];
  }>({
    round16: [],
    quarters: [],
    semis: [],
    finals: [],
  });

  const [simulationStep, setSimulationStep] = useState<
    "init" | "round16" | "quarters" | "semis" | "finals"
  >("init");
  const [champion, setChampion] = useState<Team | null>(null);

  // === CARGAR SQUADS REALES DESDE LA BASE DE DATOS ===
  useEffect(() => {
    let active = true;
    setIsLoadingSquads(true);
    getSquads()
      .then((list) => {
        if (active) {
          setDbSquads(list);
          setIsLoadingSquads(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load real squads for tournament:", err);
        if (active) setIsLoadingSquads(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // === INICIALIZACIÓN DINÁMICA DE LA LLAVE DE TORNEO ===
  // Crea los emparejamientos utilizando Squads reales del sistema
  // y completando los espacios vacíos con escuadras amateur de Lima.
  const initializeTournament = () => {
    // 1. Convertir los squads de la base de datos a formato de equipo (Team)
    const realTeams: Team[] = dbSquads.map((s) => ({
      id: s.id,
      name: s.name,
      logoSeed: s.avatar_url || s.name,
    }));

    // 2. Barajar y tomar de los equipos de Lima predefinidos si faltan para completar la llave
    const neededCount = tournamentSize;
    let combinedTeams: Team[] = [...realTeams];

    if (combinedTeams.length < neededCount) {
      const remainingCount = neededCount - combinedTeams.length;
      const shuffler = [...AMATEUR_LIMA_SQUADS].sort(() => 0.5 - Math.random());
      combinedTeams = [...combinedTeams, ...shuffler.slice(0, remainingCount)];
    } else {
      combinedTeams = combinedTeams.slice(0, neededCount);
    }

    // Asegurar orden aleatorio
    combinedTeams = combinedTeams.sort(() => 0.5 - Math.random());

    // 3. Crear nodos de partidos para la primera ronda activa según el tamaño seleccionado
    const r16Nodes: MatchNode[] = [];
    const qNodes: MatchNode[] = [];
    const sNodes: MatchNode[] = [];
    const fNodes: MatchNode[] = [];

    if (tournamentSize === 16) {
      for (let i = 0; i < 8; i++) {
        r16Nodes.push({
          id: `r16-${i + 1}`,
          teamA: combinedTeams[i * 2],
          teamB: combinedTeams[i * 2 + 1],
        });
      }
      // Rellenar rondas posteriores con marcadores de posición pendientes
      for (let i = 0; i < 4; i++) {
        qNodes.push({
          id: `q-${i + 1}`,
          teamA: {
            id: `pending-q-${i + 1}-a`,
            name: `Ganador R16 #${i * 2 + 1}`,
            logoSeed: "pending",
          },
          teamB: {
            id: `pending-q-${i + 1}-b`,
            name: `Ganador R16 #${i * 2 + 2}`,
            logoSeed: "pending",
          },
        });
      }
    }

    if (tournamentSize >= 8) {
      for (let i = 0; i < 4; i++) {
        const teamA = tournamentSize === 8 ? combinedTeams[i * 2] : qNodes[i].teamA;
        const teamB = tournamentSize === 8 ? combinedTeams[i * 2 + 1] : qNodes[i].teamB;
        qNodes[i] = { id: `q-${i + 1}`, teamA, teamB };
      }
    }

    // Semifinales
    for (let i = 0; i < 2; i++) {
      const teamA =
        tournamentSize === 4
          ? combinedTeams[i * 2]
          : {
              id: `pending-s-${i + 1}-a`,
              name: `Ganador Cuartos #${i * 2 + 1}`,
              logoSeed: "pending",
            };
      const teamB =
        tournamentSize === 4
          ? combinedTeams[i * 2 + 1]
          : {
              id: `pending-s-${i + 1}-b`,
              name: `Ganador Cuartos #${i * 2 + 2}`,
              logoSeed: "pending",
            };
      sNodes.push({ id: `s-${i + 1}`, teamA, teamB });
    }

    // Final
    const teamAF =
      tournamentSize === 2
        ? combinedTeams[0]
        : { id: "pending-f-a", name: "Ganador Semifinal 1", logoSeed: "pending" };
    const teamBF =
      tournamentSize === 2
        ? combinedTeams[1]
        : { id: "pending-f-b", name: "Ganador Semifinal 2", logoSeed: "pending" };
    fNodes.push({ id: "f-1", teamA: teamAF, teamB: teamBF });

    setBrackets({
      round16: r16Nodes,
      quarters: qNodes,
      semis: sNodes,
      finals: fNodes,
    });

    setChampion(null);
    setSimulationStep("init");
    toast.success(
      `¡Torneo de ${selectedSport} (${tournamentSize} Squads) inicializado con éxito!`,
      {
        description: `Código de llave asignado: ${championshipCode}`,
      },
    );
  };

  // Inicializar al montar y cuando cambie el tamaño del torneo o los squads
  useEffect(() => {
    if (!isLoadingSquads) {
      initializeTournament();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tournamentSize, dbSquads, isLoadingSquads, selectedSport]);

  // === SIMULACIÓN DE RONDA ACTUAL ===
  // Avanza la simulación generando resultados reales y lógicos para el deporte activo
  const handleSimulateStep = () => {
    if (simulationStep === "init") {
      if (tournamentSize === 16) {
        // Simular Octavos de Final y promover a Cuartos
        const simulatedR16 = brackets.round16.map((match) => {
          const scoreA = Math.floor(Math.random() * 4);
          const scoreB = Math.floor(Math.random() * 4);
          const isWinnerA = scoreA >= scoreB;
          return {
            ...match,
            teamA: { ...match.teamA, score: scoreA, isWinner: isWinnerA },
            teamB: { ...match.teamB, score: scoreB, isWinner: !isWinnerA },
            winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
          };
        });

        const nextQuarters = brackets.quarters.map((match, i) => {
          const winnerA =
            simulatedR16[i * 2].winnerId === simulatedR16[i * 2].teamA.id
              ? simulatedR16[i * 2].teamA
              : simulatedR16[i * 2].teamB;
          const winnerB =
            simulatedR16[i * 2 + 1].winnerId === simulatedR16[i * 2 + 1].teamA.id
              ? simulatedR16[i * 2 + 1].teamA
              : simulatedR16[i * 2 + 1].teamB;
          return {
            ...match,
            teamA: { ...winnerA, score: undefined, isWinner: undefined },
            teamB: { ...winnerB, score: undefined, isWinner: undefined },
          };
        });

        setBrackets((prev) => ({
          ...prev,
          round16: simulatedR16,
          quarters: nextQuarters,
        }));
        setSimulationStep("round16");
        toast.success("¡Octavos de final simulados exitosamente!");
        return;
      }
      setSimulationStep("round16"); // saltar directo si el tamaño es menor
    }

    if (simulationStep === "init" || simulationStep === "round16") {
      if (tournamentSize >= 8) {
        // Simular Cuartos y promover a Semis
        const simulatedQuarters = brackets.quarters.map((match) => {
          const scoreA = Math.floor(Math.random() * 5);
          const scoreB = Math.floor(Math.random() * 5);
          const isWinnerA = scoreA >= scoreB;
          return {
            ...match,
            teamA: { ...match.teamA, score: scoreA, isWinner: isWinnerA },
            teamB: { ...match.teamB, score: scoreB, isWinner: !isWinnerA },
            winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
          };
        });

        const nextSemis = brackets.semis.map((match, i) => {
          const winnerA =
            simulatedQuarters[i * 2].winnerId === simulatedQuarters[i * 2].teamA.id
              ? simulatedQuarters[i * 2].teamA
              : simulatedQuarters[i * 2].teamB;
          const winnerB =
            simulatedQuarters[i * 2 + 1].winnerId === simulatedQuarters[i * 2 + 1].teamA.id
              ? simulatedQuarters[i * 2 + 1].teamA
              : simulatedQuarters[i * 2 + 1].teamB;
          return {
            ...match,
            teamA: { ...winnerA, score: undefined, isWinner: undefined },
            teamB: { ...winnerB, score: undefined, isWinner: undefined },
          };
        });

        setBrackets((prev) => ({
          ...prev,
          quarters: simulatedQuarters,
          semis: nextSemis,
        }));
        setSimulationStep("quarters");
        toast.success("¡Cuartos de final completados!");
        return;
      }
      setSimulationStep("quarters"); // saltar si es menor de 8
    }

    if (simulationStep === "quarters") {
      // Simular Semifinales y promover a la Gran Final
      const simulatedSemis = brackets.semis.map((match) => {
        const scoreA = Math.floor(Math.random() * 3) + 1;
        const scoreB = Math.floor(Math.random() * 3) + 1;
        const isWinnerA = scoreA >= scoreB;
        return {
          ...match,
          teamA: { ...match.teamA, score: scoreA, isWinner: isWinnerA },
          teamB: { ...match.teamB, score: scoreB, isWinner: !isWinnerA },
          winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
        };
      });

      const nextFinal = brackets.finals.map((match) => {
        const winnerA =
          simulatedSemis[0].winnerId === simulatedSemis[0].teamA.id
            ? simulatedSemis[0].teamA
            : simulatedSemis[0].teamB;
        const winnerB =
          simulatedSemis[1].winnerId === simulatedSemis[1].teamA.id
            ? simulatedSemis[1].teamA
            : simulatedSemis[1].teamB;
        return {
          ...match,
          teamA: { ...winnerA, score: undefined, isWinner: undefined },
          teamB: { ...winnerB, score: undefined, isWinner: undefined },
        };
      });

      setBrackets((prev) => ({
        ...prev,
        semis: simulatedSemis,
        finals: nextFinal,
      }));
      setSimulationStep("semis");
      toast.success("¡Semifinales completadas!");
    } else if (simulationStep === "semis") {
      // Simular la Gran Final y coronar Campeón
      const match = brackets.finals[0];
      const scoreA = Math.floor(Math.random() * 3) + 1;
      const scoreB = Math.floor(Math.random() * 3) + 1;
      const isWinnerA = scoreA >= scoreB;
      const winnerTeam = isWinnerA ? match.teamA : match.teamB;

      setBrackets((prev) => ({
        ...prev,
        finals: [
          {
            ...match,
            teamA: { ...match.teamA, score: scoreA, isWinner: isWinnerA },
            teamB: { ...match.teamB, score: scoreB, isWinner: !isWinnerA },
            winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
          },
        ],
      }));

      setChampion(winnerTeam);
      setSimulationStep("finals");
      toast.success(`🏆 ¡${winnerTeam.name} se coronó Campeón de la Copa!`, {
        description: "Recompensas de FitCoins distribuidas a la escuadra.",
        duration: 8000,
      });
    }
  };

  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCodeInput.trim()) return;
    setChampionshipCode(searchCodeInput.toUpperCase());
    setSearchCodeInput("");
    toast.success(`¡Te has unido exitosamente al torneo [ ${searchCodeInput.toUpperCase()} ]!`);
  };

  // === BÚSQUEDA DE USUARIOS PARA RECLUTAMIENTO ===
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    return MOCK_USERS.filter(
      (u) =>
        u.id !== currentUser?.id && u.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
    ).slice(0, 5);
  }, [userSearchQuery, currentUser]);

  const handleInviteUserByChat = async (targetUser: User) => {
    try {
      const chatStore = useChatStore.getState();
      const inviteMsg = `¡Hola ${targetUser.name}! Te invito a unirte a mi escuadra de ${selectedSport} para jugar el torneo relámpago. Código de Torneo: *${championshipCode}*. ¡Entra y súmate al equipo!`;
      const existingChat = chatStore.chats.find(
        (c) =>
          c.current_players.includes(currentUser?.id || "") &&
          c.current_players.includes(targetUser.id),
      );
      const chatId = existingChat ? existingChat.id : await chatStore.createChat(targetUser.id);
      await chatStore.sendMessage(chatId, inviteMsg);
      toast.success(`¡Invitación enviada con éxito a ${targetUser.name} por el Chat!`, {
        icon: <MessageSquare className="h-4 w-4 text-primary" />,
      });
    } catch (err) {
      console.error("Error sending chat invite:", err);
      toast.error("Error al procesar la invitación por chat.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in text-foreground">
      {/* === BANNER ENCABEZADO === */}
      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="text-left">
            <span className="text-[10px] text-neon uppercase font-black tracking-widest bg-neon/15 px-3 py-1 rounded-full border border-neon/20">
              Copa de Squads SportMatch 2026
            </span>
            <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-foreground mt-3">
              Campeonato entre Escuadras
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Compite en llaves dinámicas entre tu propio Squad y otros equipos de la base de datos
              de Lima. Simula brackets y sube el Trust de tu club.
            </p>
          </div>
          {/* Selector de pestañas */}
          <div className="flex gap-2 bg-background/50 border border-border p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("brackets")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "brackets" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Swords className="h-4 w-4" /> Llaves de Torneo
            </button>
            <button
              onClick={() => setActiveTab("squads")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "squads" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Users className="h-4 w-4" /> Mis Miembros
            </button>
          </div>
        </div>
      </div>

      {/* === CONTENIDO DE PESTAÑAS === */}
      {activeTab === "squads" ? (
        <div className="grid grid-cols-1 gap-6 bg-gradient-card border border-border rounded-3xl p-6 shadow-card text-left">
          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <div>
              <h3 className="text-lg font-bold flex items-center gap-2 text-foreground">
                <Users className="h-5 w-5 text-neon" /> Miembros de mi Escuadra
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Recluta y organiza a tus titulares de cara al campeonato actual.
              </p>
            </div>
            <span className="text-xs font-bold text-neon bg-neon/10 px-3 py-1 rounded-full border border-neon/20">
              Código del Torneo: {championshipCode}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Lista de Miembros en Escuadra */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-1">
                Alineación Tactica (Titulares)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {MOCK_USERS.slice(0, 4).map((u, idx) => (
                  <div
                    key={u.id}
                    className="p-4 bg-background/50 border border-border/80 rounded-2xl flex items-center gap-3"
                  >
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-xl bg-muted object-cover"
                    />
                    <div>
                      <div className="text-xs font-bold text-foreground flex items-center gap-1">
                        {u.name}{" "}
                        {idx === 0 && (
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold">
                            CAP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {selectedSport} · {u.level || "Intermedio"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel de Reclutamiento de Jugadores Reales */}
            <div className="bg-background/40 border border-border rounded-2xl p-4 space-y-4">
              <div className="pb-2 border-b border-white/5">
                <h4 className="text-sm font-black text-foreground">Buscar Jugadores Reales</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Invítalos a jugar el torneo mediante el Chat
                </p>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Buscar deportista..."
                  className="w-full bg-background/60 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary text-foreground"
                />
              </div>
              <div className="space-y-2">
                {filteredUsers.map((u) => (
                  <div
                    key={u.id}
                    className="flex items-center justify-between p-2 bg-background/30 border border-border/40 rounded-xl animate-scale-in"
                  >
                    <div className="min-w-0 flex items-center gap-2">
                      <img
                        src={u.avatar_url}
                        alt=""
                        className="h-8 w-8 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{u.name}</div>
                        <div className="text-[9px] text-muted-foreground truncate">
                          {u.preferred_sports?.[0]} · {u.level}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleInviteUserByChat(u)}
                      className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer border-0 flex items-center justify-center"
                      title="Invitar por Chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {!userSearchQuery && (
                  <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">
                    Escribe un nombre para reclutar deportistas...
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* === PANEL DE CONTROL IZQUIERDO === */}
          <div className="col-span-1 bg-gradient-card border border-border rounded-3xl p-5 shadow-card space-y-5 text-left">
            <div>
              <h3 className="font-heading text-lg tracking-wide text-foreground flex items-center gap-2">
                <Sliders className="h-4.5 w-4.5 text-neon" /> Configurar Copa
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Define los parámetros del campeonato
              </p>
            </div>

            <div className="space-y-4">
              {/* Disciplina */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Disciplina
                </label>
                <div className="grid grid-cols-5 gap-1 bg-background/50 p-1 border border-border rounded-xl">
                  {(["Fútbol", "Vóley", "Pádel", "Básquet", "Tenis"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSelectedSport(s);
                        setSquadFormat(SPORT_FORMAT_CONFIG[s]?.formats[0] || "5vs5");
                      }}
                      className={`py-1.5 rounded-lg text-[9px] font-black tracking-wide transition-all cursor-pointer ${selectedSport === s ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:text-foreground"}`}
                      title={s}
                    >
                      {s === "Fútbol"
                        ? "⚽"
                        : s === "Vóley"
                          ? "🏐"
                          : s === "Pádel"
                            ? "🏓"
                            : s === "Básquet"
                              ? "🏀"
                              : "🎾"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Formato */}
              {selectedSport === "Fútbol" && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                    Formato táctico
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-background/50 p-1 border border-border rounded-xl">
                    {SPORT_FORMAT_CONFIG["Fútbol"].formats.map((f) => (
                      <button
                        key={f}
                        onClick={() => setSquadFormat(f)}
                        className={`py-1 rounded-lg text-[10px] font-black tracking-wide transition-all cursor-pointer ${squadFormat === f ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Tamaño de llave */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Tamaño de la Llave (Squads)
                </label>
                <div className="grid grid-cols-4 gap-1 bg-background/50 p-1 border border-border rounded-xl">
                  {([2, 4, 8, 16] as const).map((size) => (
                    <button
                      key={size}
                      onClick={() => setTournamentSize(size)}
                      className={`py-1.5 rounded-lg text-[10px] font-black tracking-wide transition-all cursor-pointer ${tournamentSize === size ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:text-foreground"}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-px bg-border/40" />

              {/* Unirse por código */}
              <form onSubmit={handleJoinByCode} className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Unirse a Campeonato
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={searchCodeInput}
                    onChange={(e) => setSearchCodeInput(e.target.value)}
                    placeholder="Código de Torneo..."
                    className="w-full bg-background border border-border rounded-xl px-4 py-2.5 text-xs uppercase tracking-widest text-foreground focus:outline-none focus:border-primary pr-12"
                  />
                  <button
                    type="submit"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-2 py-1.5 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold cursor-pointer"
                  >
                    Unirme
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* === PANEL DERECHO: VISUALIZACIÓN DE BRACKETS === */}
          <div className="col-span-1 lg:col-span-3 bg-gradient-card border border-border rounded-3xl p-5 shadow-card space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/5">
              <div className="text-left">
                <h3 className="font-heading text-xl tracking-wide text-foreground flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-warning" /> Brackets de Eliminatoria (
                  {tournamentSize} Squads)
                </h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Simula partidos y promueve a los Squads en tiempo real
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={initializeTournament}
                  className="px-4 py-2 rounded-xl bg-accent border border-border text-foreground font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                  title="Reiniciar Llave"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Re-sortear
                </button>
                {simulationStep !== "finals" && (
                  <button
                    onClick={handleSimulateStep}
                    className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-black text-xs flex items-center justify-center gap-1.5 shadow-glow cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 animate-pulse" />
                    {simulationStep === "init" &&
                      (tournamentSize === 16 ? "Simular Octavos" : "Simular Cuartos")}
                    {simulationStep === "round16" && "Simular Cuartos"}
                    {simulationStep === "quarters" && "Simular Semifinales"}
                    {simulationStep === "semis" && "Simular Gran Final"}
                  </button>
                )}
              </div>
            </div>

            {/* Brackets visuales */}
            <div className="bg-background/25 border border-border/50 rounded-2xl p-4 md:p-6 overflow-x-auto">
              <div className="min-w-[850px] flex justify-between items-center gap-4 py-4 relative">
                {/* Octavos de Final (Solo si size = 16) */}
                {tournamentSize === 16 && (
                  <div className="flex-1 space-y-4">
                    <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Octavos de Final
                      </span>
                    </div>
                    {brackets.round16.map((node) => (
                      <MatchCard key={node.id} match={node} />
                    ))}
                  </div>
                )}

                {tournamentSize === 16 && (
                  <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}

                {/* Cuartos de Final (Solo si size >= 8) */}
                {tournamentSize >= 8 && (
                  <div className="flex-1 space-y-6">
                    <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                      <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                        Cuartos de Final
                      </span>
                    </div>
                    {brackets.quarters.map((node) => (
                      <MatchCard key={node.id} match={node} />
                    ))}
                  </div>
                )}

                {tournamentSize >= 8 && (
                  <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                    <ChevronRight className="h-5 w-5" />
                  </div>
                )}

                {/* Semifinales */}
                <div className="flex-1 space-y-12">
                  <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                    <span className="text-[9px] uppercase font-bold text-primary tracking-widest">
                      Semifinales
                    </span>
                  </div>
                  {brackets.semis.map((node) => (
                    <MatchCard key={node.id} match={node} />
                  ))}
                </div>

                <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                  <ChevronRight className="h-5 w-5" />
                </div>

                {/* Gran Final y Campeón */}
                <div className="flex-1 space-y-16">
                  <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                    <span className="text-[9px] uppercase font-bold text-red-500 tracking-widest">
                      Gran Final
                    </span>
                  </div>
                  {brackets.finals[0] && <MatchCard match={brackets.finals[0]} />}
                  {champion && (
                    <div className="mt-6 animate-scale-in flex flex-col items-center p-4 bg-primary/10 border border-primary/50 rounded-2xl shadow-glow text-center relative overflow-hidden">
                      <Trophy className="h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] animate-bounce" />
                      <span className="text-[8px] uppercase font-black text-primary tracking-widest mt-1.5 block">
                        Campeón de la Copa
                      </span>
                      <h5 className="text-xs font-black text-foreground mt-0.5 truncate max-w-[180px]">
                        {champion.name}
                      </h5>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: MatchNode }) {
  const getLogoUrl = (seed: string) =>
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;

  return (
    <div className="bg-gradient-card border border-border/80 rounded-2xl shadow-md overflow-hidden text-left relative transition-all duration-300 hover:border-primary/30">
      <div className="p-3 space-y-2">
        {/* Equipo A */}
        <div
          className={`flex items-center justify-between gap-2.5 ${match.teamA.isWinner === false ? "opacity-35" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamA.logoSeed)}
              alt=""
              className="h-5 w-5 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground">
              {match.teamA.name}
            </span>
          </div>
          {match.teamA.score !== undefined ? (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${match.teamA.isWinner ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground"}`}
            >
              {match.teamA.score}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-muted-foreground tracking-wider">—</span>
          )}
        </div>
        <div className="h-px bg-border/45" />
        {/* Equipo B */}
        <div
          className={`flex items-center justify-between gap-2.5 ${match.teamB.isWinner === false ? "opacity-35" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamB.logoSeed)}
              alt=""
              className="h-5 w-5 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground">
              {match.teamB.name}
            </span>
          </div>
          {match.teamB.score !== undefined ? (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${match.teamB.isWinner ? "bg-primary/15 text-primary border border-primary/25" : "bg-muted text-muted-foreground"}`}
            >
              {match.teamB.score}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-muted-foreground tracking-wider">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TournamentHub;
