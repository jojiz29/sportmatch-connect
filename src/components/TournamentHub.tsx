// === BLOQUE: IMPORTACIONES ===
// Dependencias: React (hooks useState/useMemo), notificaciones sonner, iconos Lucide, stores de chat y autenticación,
// datos mock de usuarios, y componentes SquadBuilder/MatchupVersus
import React, { useState, useMemo } from "react";
import { toast } from "sonner";
import {
  Trophy,
  Users,
  Swords,
  ChevronRight,
  Zap,
  Search,
  MessageSquare,
  UserPlus,
  Plus,
} from "lucide-react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS } from "@/shared/api/apiClient";
import { SquadBuilder } from "./SquadBuilder";
import { MatchupVersus } from "./MatchupVersus";
import { User } from "@/entities/types";

// === BLOQUE: INTERFACES DE TIPOS ===
// Team: representa un equipo con nombre, semilla de logo, puntaje opcional y estado de ganador
// MatchNode: representa un enfrentamiento entre dos equipos con un ganador opcional
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

// === BLOQUE: EQUIPOS PREDEFINIDOS ===
// 8 equipos ficticios para poblar la llave de cuartos de final del torneo
const PRESET_TEAMS: Team[] = [
  { id: "t1", name: "Real Madrid SportMatch", logoSeed: "real" },
  { id: "t2", name: "Alianza F.C.", logoSeed: "alianza" },
  { id: "t3", name: "Sporting Cristal Connect", logoSeed: "cristal" },
  { id: "t4", name: "Deportivo Universitario", logoSeed: "u" },
  { id: "t5", name: "Pádel Club San Isidro", logoSeed: "padel" },
  { id: "t6", name: "Los Galácticos del Rímac", logoSeed: "galacticos" },
  { id: "t7", name: "La Maquinaria F.C.", logoSeed: "maquina" },
  { id: "t8", name: "Sport Matchers Surco", logoSeed: "surco" },
];

// === BLOQUE: CONFIGURACIÓN DE FORMATOS POR DEPORTE ===
// Define cantidad de titulares, suplentes y formatos disponibles para cada disciplina
const SPORT_FORMAT_CONFIG: Record<string, { starters: number; subs: number; formats: string[] }> = {
  Fútbol: { starters: 11, subs: 4, formats: ["5vs5", "7vs7", "11vs11"] },
  Vóley: { starters: 6, subs: 3, formats: ["6vs6"] },
  Pádel: { starters: 2, subs: 1, formats: ["2vs2"] },
  Tenis: { starters: 2, subs: 1, formats: ["1vs1", "2vs2"] },
};

// === BLOQUE: COMPONENTE PRINCIPAL DEL HUB DE TORNEOS ===
// Centro de torneos relámpago con simulador de llaves eliminatorias (cuartos -> semis -> final),
// panel de gestión de escuadra táctica, reclutamiento de jugadores por chat y visualización de brackets
export function TournamentHub() {
  const currentUser = useAuthStore((state) => state.user);

  // === BLOQUE: ESTADOS DE NAVEGACIÓN Y SIMULACIÓN ===
  const [activeTab, setActiveTab] = useState<"brackets" | "squads">("brackets");
  const [simulationStep, setSimulationStep] = useState<"init" | "quarters" | "semis" | "finals">(
    "init",
  );
  const [isVersusOpen, setIsVersusOpen] = useState(false);

  // === BLOQUE: ESTADOS DEL PANEL DE ESCUADRA ===
  const [isSquadPanelOpen, setIsSquadPanelOpen] = useState(true);
  const [selectedSport, setSelectedSport] = useState<"Fútbol" | "Vóley" | "Pádel">("Fútbol");
  const [squadFormat, setSquadFormat] = useState<string>("7vs7");
  const [championshipCode, setChampionshipCode] = useState("COPA-CHAMP-2026");
  const [searchCodeInput, setSearchCodeInput] = useState("");
  const [userSearchQuery, setUserSearchQuery] = useState("");

  // Miembros de la escuadra (poblados con datos mock del usuario actual + jugadores ficticios)
  const [squadMembers, setSquadMembers] = useState<
    { id: string; name: string; level: string; position: string; isSub?: boolean }[]
  >(() => [
    {
      id: currentUser?.id || "me",
      name: currentUser?.name || "Edwin Flores",
      level: "Elite",
      position: "MID",
    },
    { id: "user-fabiola", name: "Fabiola Rivas", level: "Intermedio", position: "DEF" },
    { id: "user-1", name: "Carlos Mendoza", level: "Avanzado", position: "GK" },
    { id: "user-2", name: "Ana Sofía Prado", level: "Intermedio", position: "FWD" },
    { id: "user-3", name: "Juan Diego Torres", level: "Avanzado", position: "MID", isSub: true },
  ]);

  // === BLOQUE: CÁLCULO DINÁMICO DE LÍMITES DE ESCUADRA ===
  // Resuelve la cantidad de titulares y suplentes según el deporte y formato seleccionados
  const activeConfig = useMemo(() => {
    const config = SPORT_FORMAT_CONFIG[selectedSport] || {
      starters: 11,
      subs: 4,
      formats: ["5vs5", "7vs7", "11vs11"],
    };
    let startersCount = config.starters;
    if (selectedSport === "Fútbol") {
      startersCount = squadFormat === "5vs5" ? 5 : squadFormat === "7vs7" ? 7 : 11;
    }
    return { startersLimit: startersCount, subsLimit: config.subs };
  }, [selectedSport, squadFormat]);

  // Listas separadas de titulares y suplentes según los límites calculados
  const startersList = useMemo(
    () => squadMembers.filter((m) => !m.isSub).slice(0, activeConfig.startersLimit),
    [squadMembers, activeConfig],
  );
  const subsList = useMemo(
    () =>
      squadMembers
        .filter((m) => m.isSub || squadMembers.indexOf(m) >= activeConfig.startersLimit)
        .slice(0, activeConfig.subsLimit),
    [squadMembers, activeConfig],
  );

  // === BLOQUE: ESTRUCTURA DE LLAVES (BRACKETS) ===
  // Cuartos (4 nodos), Semifinales (2 nodos) y Final (1 nodo)
  const [brackets, setBrackets] = useState<{
    quarters: MatchNode[];
    semis: MatchNode[];
    finals: MatchNode[];
  }>({
    quarters: [
      { id: "q1", teamA: { ...PRESET_TEAMS[0] }, teamB: { ...PRESET_TEAMS[1] } },
      { id: "q2", teamA: { ...PRESET_TEAMS[2] }, teamB: { ...PRESET_TEAMS[3] } },
      { id: "q3", teamA: { ...PRESET_TEAMS[4] }, teamB: { ...PRESET_TEAMS[5] } },
      { id: "q4", teamA: { ...PRESET_TEAMS[6] }, teamB: { ...PRESET_TEAMS[7] } },
    ],
    semis: [
      {
        id: "s1",
        teamA: { id: "pending-s1-a", name: "Clasificado Q1", logoSeed: "p1" },
        teamB: { id: "pending-s1-b", name: "Clasificado Q2", logoSeed: "p2" },
      },
      {
        id: "s2",
        teamA: { id: "pending-s2-a", name: "Clasificado Q3", logoSeed: "p3" },
        teamB: { id: "pending-s2-b", name: "Clasificado Q4", logoSeed: "p4" },
      },
    ],
    finals: [
      {
        id: "f1",
        teamA: { id: "pending-f1-a", name: "Clasificado Semifinal 1", logoSeed: "p5" },
        teamB: { id: "pending-f1-b", name: "Clasificado Semifinal 2", logoSeed: "p6" },
      },
    ],
  });

  const [champion, setChampion] = useState<Team | null>(null);

  // === BLOQUE: BÚSQUEDA DE USUARIOS ===
  // Filtra los usuarios mock excluyendo al usuario actual
  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    return MOCK_USERS.filter(
      (u) =>
        u.id !== currentUser?.id && u.name.toLowerCase().includes(userSearchQuery.toLowerCase()),
    ).slice(0, 5);
  }, [userSearchQuery, currentUser]);

  // === BLOQUE: INVITACIÓN POR CHAT ===
  // Envía un mensaje de invitación al torneo a través del chat real usando la store de chat
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
        icon: <MessageSquare className="h-4 w-4 text-[#39FF14]" />,
      });
    } catch (err) {
      console.error("Error sending chat invite:", err);
      toast.error("Error al procesar la invitación por chat.");
    }
  };

  // === BLOQUE: AGREGAR MIEMBRO A LA ESCUADRA ===
  // Añade un jugador a la lista de miembros, determinando si es titular o suplente según los límites
  const handleAddMemberToSquad = (player: User) => {
    if (squadMembers.some((m) => m.id === player.id)) {
      toast.warning("El jugador ya es parte de la escuadra.");
      return;
    }
    const isSub = squadMembers.filter((m) => !m.isSub).length >= activeConfig.startersLimit;
    setSquadMembers((prev) => [
      ...prev,
      {
        id: player.id,
        name: player.name,
        level: player.level || "Intermedio",
        position: player.user_sports?.[0]?.sport_id === "Pádel" ? "MID" : "DEF",
        isSub,
      },
    ]);
    toast.success(`¡${player.name} agregado a la escuadra!`);
  };

  // === BLOQUE: UNIRSE POR CÓDIGO DE TORNEO ===
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchCodeInput.trim()) return;
    setChampionshipCode(searchCodeInput.toUpperCase());
    setSearchCodeInput("");
    toast.success(`¡Te has unido exitosamente al torneo [ ${searchCodeInput.toUpperCase()} ]!`);
  };

  // === BLOQUE: LÓGICA DE SIMULACIÓN DEL TORNEO ===
  // Avanza la simulación por etapas: init -> quarters -> semis -> finals
  // Cada etapa genera puntajes aleatorios y promueve a los ganadores a la siguiente ronda
  const handleSimulateStep = () => {
    if (simulationStep === "init") {
      const newQuarters = brackets.quarters.map((match) => {
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
      setBrackets((prev) => ({
        ...prev,
        quarters: newQuarters,
        semis: [
          {
            id: "s1",
            teamA: {
              ...(newQuarters[0].winnerId === newQuarters[0].teamA.id
                ? newQuarters[0].teamA
                : newQuarters[0].teamB),
              score: undefined,
              isWinner: undefined,
            },
            teamB: {
              ...(newQuarters[1].winnerId === newQuarters[1].teamA.id
                ? newQuarters[1].teamA
                : newQuarters[1].teamB),
              score: undefined,
              isWinner: undefined,
            },
          },
          {
            id: "s2",
            teamA: {
              ...(newQuarters[2].winnerId === newQuarters[2].teamA.id
                ? newQuarters[2].teamA
                : newQuarters[2].teamB),
              score: undefined,
              isWinner: undefined,
            },
            teamB: {
              ...(newQuarters[3].winnerId === newQuarters[3].teamA.id
                ? newQuarters[3].teamA
                : newQuarters[3].teamB),
              score: undefined,
              isWinner: undefined,
            },
          },
        ],
      }));
      setSimulationStep("quarters");
      toast.success("¡Cuartos de final completados!");
    } else if (simulationStep === "quarters") {
      const newSemis = brackets.semis.map((match) => {
        const scoreA = Math.floor(Math.random() * 4) + 1;
        const scoreB = Math.floor(Math.random() * 4) + 1;
        const isWinnerA = scoreA >= scoreB;
        return {
          ...match,
          teamA: { ...match.teamA, score: scoreA, isWinner: isWinnerA },
          teamB: { ...match.teamB, score: scoreB, isWinner: !isWinnerA },
          winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
        };
      });
      setBrackets((prev) => ({
        ...prev,
        semis: newSemis,
        finals: [
          {
            id: "f1",
            teamA: {
              ...(newSemis[0].winnerId === newSemis[0].teamA.id
                ? newSemis[0].teamA
                : newSemis[0].teamB),
              score: undefined,
              isWinner: undefined,
            },
            teamB: {
              ...(newSemis[1].winnerId === newSemis[1].teamA.id
                ? newSemis[1].teamA
                : newSemis[1].teamB),
              score: undefined,
              isWinner: undefined,
            },
          },
        ],
      }));
      setSimulationStep("semis");
      toast.success("¡Semifinales completadas!");
    } else if (simulationStep === "semis") {
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
      toast.success(`¡El torneo ha terminado! Campeón: ${winnerTeam.name}`, { icon: "🏆" });
    }
  };

  // === BLOQUE: REINICIO DEL TORNEO ===
  const handleResetTournament = () => {
    setBrackets({
      quarters: [
        { id: "q1", teamA: { ...PRESET_TEAMS[0] }, teamB: { ...PRESET_TEAMS[1] } },
        { id: "q2", teamA: { ...PRESET_TEAMS[2] }, teamB: { ...PRESET_TEAMS[3] } },
        { id: "q3", teamA: { ...PRESET_TEAMS[4] }, teamB: { ...PRESET_TEAMS[5] } },
        { id: "q4", teamA: { ...PRESET_TEAMS[6] }, teamB: { ...PRESET_TEAMS[7] } },
      ],
      semis: [
        {
          id: "s1",
          teamA: { id: "pending-s1-a", name: "Clasificado Q1", logoSeed: "p1" },
          teamB: { id: "pending-s1-b", name: "Clasificado Q2", logoSeed: "p2" },
        },
        {
          id: "s2",
          teamA: { id: "pending-s2-a", name: "Clasificado Q3", logoSeed: "p3" },
          teamB: { id: "pending-s2-b", name: "Clasificado Q4", logoSeed: "p4" },
        },
      ],
      finals: [
        {
          id: "f1",
          teamA: { id: "pending-f1-a", name: "Clasificado Semifinal 1", logoSeed: "p5" },
          teamB: { id: "pending-f1-b", name: "Clasificado Semifinal 2", logoSeed: "p6" },
        },
      ],
    });
    setChampion(null);
    setSimulationStep("init");
    toast.info("Torneo reiniciado.");
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* === BLOQUE: PANEL DE ENCABEZADO === */}
      {/* Banner principal con badge "Mundial SportMatch 2026", título y selector de pestañas */}
      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-[#D4AF37]/10 blur-3xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="text-[10px] text-neon uppercase font-black tracking-widest bg-neon/15 px-3 py-1 rounded-full border border-neon/20">
              Mundial SportMatch 2026
            </span>
            <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-foreground mt-3">
              Centro de Torneos Relámpago
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl">
              Crea tu escuadra táctica, recluta jugadores reales por chat y compite en brackets en
              vivo.
            </p>
          </div>
          {/* Selector de pestañas: Llave Eliminatoria / Mi Escuadra Táctica */}
          <div className="flex gap-2 bg-background/50 border border-border p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("brackets")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "brackets" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Swords className="h-4 w-4" /> Llave Eliminatoria
            </button>
            <button
              onClick={() => setActiveTab("squads")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${activeTab === "squads" ? "bg-gradient-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}
            >
              <Users className="h-4 w-4" /> Mi Escuadra Táctica
            </button>
          </div>
        </div>
      </div>

      {/* === BLOQUE: CONTENIDO SEGÚN PESTAÑA ACTIVA === */}
      {activeTab === "squads" ? (
        <SquadBuilder />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* === PANEL IZQUIERDO: GESTIÓN DE ESCUADRA === */}
          <div className="col-span-1 bg-gradient-card border border-border rounded-3xl p-4 shadow-card space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="font-heading text-lg tracking-wide text-foreground flex items-center gap-2">
                <Users className="h-4.5 w-4.5 text-neon" /> Mi Escuadra
              </h3>
              <button
                onClick={() => setIsSquadPanelOpen(!isSquadPanelOpen)}
                className="text-xs font-bold text-neon hover:underline cursor-pointer"
              >
                {isSquadPanelOpen ? "Ocultar" : "Mostrar"}
              </button>
            </div>
            {isSquadPanelOpen && (
              <div className="space-y-4 animate-scale-in text-left">
                {/* Selector de disciplina */}
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Disciplina
                  </label>
                  <div className="grid grid-cols-3 gap-1 bg-background/40 p-1 border border-border/50 rounded-xl">
                    {(["Fútbol", "Vóley", "Pádel"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSelectedSport(s);
                          setSquadFormat(SPORT_FORMAT_CONFIG[s]?.formats[0] || "5vs5");
                        }}
                        className={`py-1 rounded-lg text-[10px] font-black tracking-wide transition-all cursor-pointer ${selectedSport === s ? "bg-primary text-primary-foreground font-black" : "text-muted-foreground hover:text-foreground"}`}
                      >
                        {s === "Fútbol" ? "⚽ Fub" : s === "Vóley" ? "🏐 Vol" : "🏓 Pad"}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Selector de formato (solo Fútbol) */}
                {selectedSport === "Fútbol" && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                      Formato
                    </label>
                    <div className="grid grid-cols-3 gap-1 bg-background/40 p-1 border border-border/50 rounded-xl">
                      {["5vs5", "7vs7", "11vs11"].map((fmt) => (
                        <button
                          key={fmt}
                          onClick={() => setSquadFormat(fmt)}
                          className={`py-1 rounded-lg text-[9px] font-black transition-all cursor-pointer ${squadFormat === fmt ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                          {fmt}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {/* Lista de titulares */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>
                      Titulares ({startersList.length} / {activeConfig.startersLimit})
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {startersList.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-white/5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {member.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-medium">
                            {member.position} · {member.level}
                          </div>
                        </div>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-neon/15 text-neon uppercase">
                          TIT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Lista de suplentes */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    <span>
                      Suplentes ({subsList.length} / {activeConfig.subsLimit})
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto">
                    {subsList.map((member) => (
                      <div
                        key={member.id}
                        className="flex items-center justify-between p-2 rounded-xl bg-background/50 border border-white/5"
                      >
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-foreground truncate">
                            {member.name}
                          </div>
                          <div className="text-[9px] text-muted-foreground font-medium">
                            {member.position} · {member.level}
                          </div>
                        </div>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-300 uppercase">
                          SUPL
                        </span>
                      </div>
                    ))}
                    {subsList.length === 0 && (
                      <p className="text-[10px] text-muted-foreground/60 italic">
                        Sin suplentes inscritos.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* === PANEL CENTRAL: LLAVES Y CONTROLADOR === */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Control de código de torneo */}
            <div className="bg-gradient-card border border-border/70 p-5 rounded-3xl shadow-card flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="text-left">
                <span className="text-[9px] bg-amber-500/20 text-[#D4AF37] border border-amber-500/30 px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                  Código de Torneo
                </span>
                <h4 className="text-sm font-black text-foreground mt-1.5 flex items-center gap-1.5 font-mono">
                  {championshipCode}
                </h4>
              </div>
              <form onSubmit={handleJoinByCode} className="flex gap-2 w-full md:w-auto">
                <input
                  type="text"
                  value={searchCodeInput}
                  onChange={(e) => setSearchCodeInput(e.target.value)}
                  placeholder="CÓDIGO-DE-TORNEO..."
                  className="bg-background/80 border border-border rounded-xl px-3 py-2 text-xs focus:outline-none text-foreground w-full md:w-40 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-black text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  Unirse
                </button>
              </form>
            </div>

            {/* Barra de control de simulación */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-card border border-border/70 p-5 rounded-3xl shadow-card">
              <div className="text-left">
                <p className="text-xs font-bold text-[#D4AF37] uppercase tracking-wider">
                  Controlador de Eliminatoria
                </p>
                <h4 className="text-sm font-semibold text-foreground mt-0.5">
                  {simulationStep === "init" && "Comienza el torneo desde Cuartos"}
                  {simulationStep === "quarters" && "Jugar las Semifinales de campeonato"}
                  {simulationStep === "semis" && "¡Llegó el momento de la Gran Final!"}
                  {simulationStep === "finals" && "Torneo finalizado con éxito"}
                </h4>
              </div>
              <div className="flex gap-3 w-full sm:w-auto flex-wrap">
                {simulationStep !== "init" && (
                  <button
                    onClick={handleResetTournament}
                    className="px-4 py-2.5 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-accent/40 transition-all cursor-pointer"
                  >
                    Reiniciar Llaves
                  </button>
                )}
                {simulationStep === "semis" && (
                  <button
                    onClick={() => setIsVersusOpen(true)}
                    className="px-4 py-2.5 rounded-xl border-2 border-[#39FF14] text-[#39FF14] bg-[#39FF14]/5 text-xs font-bold hover:bg-[#39FF14]/15 transition-all flex items-center gap-1.5 cursor-pointer shadow-[0_0_12px_rgba(57,255,20,0.15)] animate-pulse"
                  >
                    <Swords className="h-4 w-4" /> Ver Enfrentamiento (VS)
                  </button>
                )}
                {simulationStep !== "finals" && (
                  <button
                    onClick={handleSimulateStep}
                    className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground font-black text-xs tracking-wider shadow-glow hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5 animate-pulse" />
                    {simulationStep === "init" && "Simular Cuartos"}
                    {simulationStep === "quarters" && "Simular Semifinales"}
                    {simulationStep === "semis" && "Simular Gran Final"}
                  </button>
                )}
              </div>
            </div>

            {/* === VISUALIZACIÓN DE LLAVES === */}
            <div
              className="bg-background/25 border border-border/50 rounded-3xl p-4 md:p-8 overflow-x-auto"
              id="tournament-hub-tour"
            >
              <div className="min-w-[900px] flex justify-between items-center gap-6 py-6 relative">
                {/* Cuartos de Final */}
                <div className="flex-1 space-y-8">
                  <div className="text-center pb-2 border-b border-border/20">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest">
                      Cuartos de Final
                    </span>
                  </div>
                  {brackets.quarters.map((node) => (
                    <MatchCard key={node.id} match={node} />
                  ))}
                </div>
                <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                  <ChevronRight className="h-6 w-6" />
                </div>
                {/* Semifinales */}
                <div className="flex-1 space-y-16">
                  <div className="text-center pb-2 border-b border-border/20">
                    <span className="text-[10px] uppercase font-bold text-[#D4AF37] tracking-widest">
                      Semifinales
                    </span>
                  </div>
                  {brackets.semis.map((node) => (
                    <MatchCard key={node.id} match={node} />
                  ))}
                </div>
                <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                  <ChevronRight className="h-6 w-6" />
                </div>
                {/* Gran Final y Campeón */}
                <div className="flex-1 space-y-24">
                  <div className="text-center pb-2 border-b border-border/20">
                    <span className="text-[10px] uppercase font-bold text-red-500 tracking-widest">
                      Gran Final
                    </span>
                  </div>
                  <MatchCard match={brackets.finals[0]} />
                  {champion && (
                    <div className="mt-8 animate-scale-in flex flex-col items-center p-5 bg-[#D4AF37]/10 border border-[#D4AF37]/50 rounded-2xl shadow-[0_0_20px_rgba(212,175,55,0.25)] text-center relative overflow-hidden">
                      <div
                        className="absolute inset-0 pointer-events-none opacity-[0.05]"
                        style={{
                          backgroundImage: "radial-gradient(circle, #D4AF37 1px, transparent 1px)",
                          backgroundSize: "16px 16px",
                        }}
                      />
                      <Trophy className="h-10 w-10 text-[#D4AF37] drop-shadow-[0_0_10px_rgba(212,175,55,0.7)] animate-bounce" />
                      <span className="text-[9px] uppercase font-black text-[#D4AF37] tracking-widest mt-2 block">
                        Campeón del Torneo
                      </span>
                      <h5 className="text-sm font-black text-white mt-1 truncate max-w-[200px]">
                        {champion.name}
                      </h5>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* === PANEL DERECHO: RECLUTAMIENTO POR CHAT === */}
          <div className="col-span-1 bg-gradient-card border border-border rounded-3xl p-4 shadow-card space-y-4">
            <div className="pb-2 border-b border-white/5 text-left">
              <h3 className="font-heading text-lg tracking-wide text-foreground flex items-center gap-2">
                <UserPlus className="h-4.5 w-4.5 text-neon" /> Reclutar por Chat
              </h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Invita a deportistas directamente a tu escuadra
              </p>
            </div>
            {/* Campo de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Buscar jugador..."
                className="w-full bg-background/50 border border-border rounded-xl pl-9 pr-4 py-2.5 text-xs focus:outline-none focus:border-primary text-foreground"
              />
            </div>
            {/* Resultados de búsqueda */}
            <div className="space-y-2.5">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-2 p-2 bg-background/40 border border-white/5 hover:border-primary/20 rounded-2xl transition-all text-left animate-scale-in"
                >
                  <div className="min-w-0 flex items-center gap-2">
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full bg-muted object-cover flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-foreground truncate">{u.name}</div>
                      <div className="text-[9px] text-muted-foreground font-semibold">
                        {u.preferred_sports?.[0] || "Deporte"} · {u.level}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleAddMemberToSquad(u)}
                      className="p-1.5 rounded-lg bg-neon/15 text-neon hover:bg-neon/25 transition-colors cursor-pointer border-0"
                      title="Agregar directo"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleInviteUserByChat(u)}
                      className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer border-0"
                      title="Invitar por Chat"
                    >
                      <MessageSquare className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
              {userSearchQuery && filteredUsers.length === 0 && (
                <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">
                  No se encontraron jugadores.
                </p>
              )}
              {!userSearchQuery && (
                <p className="text-[10px] text-muted-foreground/60 italic text-center py-4">
                  Escribe un nombre para buscar deportistas...
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === BLOQUE: MODAL DE ENFRENTAMIENTO (VS) === */}
      <MatchupVersus
        isOpen={isVersusOpen}
        onClose={() => setIsVersusOpen(false)}
        teamAName="Escuadra Edwin Flores (Local)"
        teamBName={brackets.finals[0]?.teamB?.name || "Real Madrid SportMatch"}
        format={squadFormat}
      />
    </div>
  );
}

// === BLOQUE: COMPONENTE AUXILIAR DE TARJETA DE PARTIDO ===
// Renderiza un enfrentamiento individual con dos equipos, puntajes y logos generados por DiceBear
function MatchCard({ match }: { match: MatchNode }) {
  const getLogoUrl = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;

  return (
    <div className="bg-gradient-card border border-border/80 rounded-2xl shadow-md overflow-hidden text-left relative transition-all duration-300 hover:border-primary/30">
      <div className="p-3 space-y-2.5">
        {/* Equipo A */}
        <div
          className={`flex items-center justify-between gap-3 ${match.teamA.isWinner === false ? "opacity-40" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamA.logoSeed)}
              alt=""
              className="h-6 w-6 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground">
              {match.teamA.name}
            </span>
          </div>
          {match.teamA.score !== undefined ? (
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-lg ${match.teamA.isWinner ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/25" : "bg-muted text-muted-foreground"}`}
            >
              {match.teamA.score}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              —
            </span>
          )}
        </div>
        <div className="h-px bg-border/40" />
        {/* Equipo B */}
        <div
          className={`flex items-center justify-between gap-3 ${match.teamB.isWinner === false ? "opacity-40" : ""}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamB.logoSeed)}
              alt=""
              className="h-6 w-6 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground">
              {match.teamB.name}
            </span>
          </div>
          {match.teamB.score !== undefined ? (
            <span
              className={`text-xs font-black px-2 py-0.5 rounded-lg ${match.teamB.isWinner ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/25" : "bg-muted text-muted-foreground"}`}
            >
              {match.teamB.score}
            </span>
          ) : (
            <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
              —
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default TournamentHub;
