/* eslint-disable @typescript-eslint/no-unused-vars */
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
  Plus,
  Play,
  Check,
  X,
  Lock,
  Share2,
  Trash2,
  Settings,
} from "lucide-react";
import { useChatStore } from "@/features/chat/useChatStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { MOCK_USERS, apiClient } from "@/shared/api/apiClient";
import { getSquads } from "@/shared/api/squadService";
import { User, Squad } from "@/entities/types";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

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

interface Tournament {
  code: string;
  name: string;
  sport: "Fútbol" | "Vóley" | "Pádel" | "Básquet" | "Tenis";
  format: string;
  size: 2 | 4 | 8 | 16;
  isStarted: boolean;
  champion: Team | null;
  teams: Team[];
  brackets: {
    round16: MatchNode[];
    quarters: MatchNode[];
    semis: MatchNode[];
    finals: MatchNode[];
  };
  simulationStep: "init" | "round16" | "quarters" | "semis" | "finals";
}

// === BLOQUE: ESCUADRAS LOCALES REALISTAS DE LIMA ===
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

  // === ESTADOS DE NAVEGACIÓN Y BUSCADOR ===
  const [activeTab, setActiveTab] = useState<"brackets" | "squads">("brackets");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [searchCodeInput, setSearchCodeInput] = useState("");

  // === RECLUTAMIENTO DE JUGADORES ===
  const [registeredUsers, setRegisteredUsers] = useState<User[]>([]);

  useEffect(() => {
    const isDemoMode = useAuthStore.getState().isDemoMode;
    if (isDemoMode) {
      setRegisteredUsers((MOCK_USERS as User[]).filter((u) => u.user_role !== "BUSINESS"));
    } else {
      apiClient.users
        .getMatches()
        .then((list) => setRegisteredUsers(list))
        .catch((err) => console.warn("Failed to load users for tournament recruitment:", err));
    }
  }, []);

  const filteredUsers = useMemo(() => {
    if (!userSearchQuery.trim()) return [];
    return registeredUsers.filter((u) =>
      u.name?.toLowerCase().includes(userSearchQuery.toLowerCase()),
    );
  }, [registeredUsers, userSearchQuery]);

  // === ESTADOS DE BASE DE DATOS DE SQUADS ===
  const [dbSquads, setDbSquads] = useState<Squad[]>([]);
  const [isLoadingSquads, setIsLoadingSquads] = useState(true);

  // === ESTADOS DEL MOTOR MULTI-TORNEO ===
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [activeTournamentCode, setActiveTournamentCode] = useState<string>("");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);

  // Formulario de creación
  const [newTourName, setNewTourName] = useState("");
  const [newTourSport, setNewTourSport] = useState<Tournament["sport"]>("Fútbol");
  const [newTourFormat, setNewTourFormat] = useState("7vs7");
  const [newTourSize, setNewTourSize] = useState<Tournament["size"]>(8);

  // Guardado de resultado manual
  const [selectedMatchNode, setSelectedMatchNode] = useState<{
    roundKey: "round16" | "quarters" | "semis" | "finals";
    node: MatchNode;
    index: number;
  } | null>(null);
  const [scoreA, setScoreA] = useState<string>("0");
  const [scoreB, setScoreB] = useState<string>("0");

  // Cargar squads reales
  useEffect(() => {
    let active = true;
    setIsLoadingSquads(true);
    getSquads()
      .then((list) => {
        if (active) {
          // Filtrar equipos con nombres no realistas o sucios para mantener estética premium
          const filtered = list.filter(
            (s) =>
              s.name &&
              s.name.trim() !== "" &&
              s.name.toLowerCase() !== "tttttt" &&
              s.name.toLowerCase() !== "seleccion de prueba",
          );
          setDbSquads(filtered);
          setIsLoadingSquads(false);
        }
      })
      .catch((err) => {
        console.warn("Failed to load real squads:", err);
        if (active) setIsLoadingSquads(false);
      });
    return () => {
      active = false;
    };
  }, []);

  // Cargar y persistir torneos de localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sportmatch_active_tournaments");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0) {
        setTournaments(parsed);
        setActiveTournamentCode(parsed[0].code);
        return;
      }
    }

    // Sembrar torneos por defecto realistas
    const initialTournaments: Tournament[] = [
      {
        code: "COPA-SURCO-2026",
        name: "Copa Surco Inter-Escuadras",
        sport: "Fútbol",
        format: "7vs7",
        size: 8,
        isStarted: false,
        champion: null,
        teams: [],
        brackets: { round16: [], quarters: [], semis: [], finals: [] },
        simulationStep: "init",
      },
      {
        code: "PADEL-LIMA-2026",
        name: "Lima Open de Pádel Pro",
        sport: "Pádel",
        format: "2vs2",
        size: 4,
        isStarted: false,
        champion: null,
        teams: [],
        brackets: { round16: [], quarters: [], semis: [], finals: [] },
        simulationStep: "init",
      },
    ];
    setTournaments(initialTournaments);
    setActiveTournamentCode(initialTournaments[0].code);
    localStorage.setItem("sportmatch_active_tournaments", JSON.stringify(initialTournaments));
  }, []);

  const activeTournament = useMemo(() => {
    return tournaments.find((t) => t.code === activeTournamentCode) || null;
  }, [tournaments, activeTournamentCode]);

  // Guardar torneos en localStorage cada vez que cambien
  const saveTournaments = (updatedList: Tournament[]) => {
    setTournaments(updatedList);
    localStorage.setItem("sportmatch_active_tournaments", JSON.stringify(updatedList));
  };

  // === CREACIÓN DE UN NUEVO TORNEO ===
  const handleCreateTournament = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTourName.trim()) {
      toast.error("Por favor, ingresa el nombre del campeonato.");
      return;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const code = `COPA-${newTourSport.slice(0, 3).toUpperCase()}-${randomSuffix}`;

    const newTournament: Tournament = {
      code,
      name: newTourName.trim(),
      sport: newTourSport,
      format: newTourFormat,
      size: newTourSize,
      isStarted: false,
      champion: null,
      teams: [],
      brackets: { round16: [], quarters: [], semis: [], finals: [] },
      simulationStep: "init",
    };

    const updated = [newTournament, ...tournaments];
    saveTournaments(updated);
    setActiveTournamentCode(code);
    setIsCreateModalOpen(false);
    setNewTourName("");

    toast.success(`🏆 ¡Torneo "${newTournament.name}" creado con éxito!`, {
      description: `Código único de torneo: ${code}. Comparte este código para invitar squads.`,
    });
  };

  // === ELIMINACIÓN DE UN TORNEO ===
  const handleDeleteTournament = (code: string) => {
    if (tournaments.length <= 1) {
      toast.error("Debes mantener al menos un torneo en el sistema.");
      return;
    }
    if (!confirm("¿Estás seguro de que deseas eliminar este campeonato por completo?")) return;

    const filtered = tournaments.filter((t) => t.code !== code);
    saveTournaments(filtered);
    if (activeTournamentCode === code) {
      setActiveTournamentCode(filtered[0].code);
    }
    toast.success("Campeonato eliminado con éxito.");
  };

  // === UNIRSE A CAMPEONATO POR CÓDIGO ===
  const handleJoinByCode = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCode = searchCodeInput.trim().toUpperCase();
    if (!targetCode) return;

    const targetTournament = tournaments.find((t) => t.code === targetCode);
    if (!targetTournament) {
      toast.error("El código de torneo ingresado no es válido.");
      return;
    }

    if (targetTournament.isStarted) {
      toast.error("Este torneo ya ha comenzado. No se permiten nuevas inscripciones.");
      return;
    }

    if (targetTournament.teams.length >= targetTournament.size) {
      toast.error("Este torneo ya completó el límite máximo de cupos.");
      return;
    }

    // Obtener la escuadra del propio usuario o simular una
    const userSquad = dbSquads.find((s) => s.creator_id === currentUser?.id) || dbSquads[0];

    if (!userSquad) {
      toast.error("No tienes ninguna escuadra creada para unirte a este torneo.");
      return;
    }

    // Verificar si ya está inscrito
    if (targetTournament.teams.some((t) => t.id === userSquad.id)) {
      toast.error("Tu escuadra ya se encuentra inscrita en este campeonato.");
      return;
    }

    const newTeam: Team = {
      id: userSquad.id,
      name: userSquad.name,
      logoSeed: userSquad.avatar_url || userSquad.name,
    };

    const updatedTournaments = tournaments.map((t) => {
      if (t.code === targetCode) {
        return {
          ...t,
          teams: [...t.teams, newTeam],
        };
      }
      return t;
    });

    saveTournaments(updatedTournaments);
    setActiveTournamentCode(targetCode);
    setSearchCodeInput("");
    toast.success(
      `🚀 ¡Tu escuadra "${userSquad.name}" se unió exitosamente a ${targetTournament.name}!`,
    );
  };

  // === REGISTRAR/INSCRIBIR SQUAD DIRECTAMENTE (ADMIN) ===
  const handleAddTeamDirectly = (team: Team) => {
    if (!activeTournament) return;

    if (activeTournament.isStarted) {
      toast.error("El torneo ya empezó. No puedes agregar más equipos.");
      return;
    }

    if (activeTournament.teams.length >= activeTournament.size) {
      toast.error("Límite máximo de cupos alcanzado.");
      return;
    }

    if (activeTournament.teams.some((t) => t.id === team.id)) {
      toast.error("Este equipo ya se encuentra inscrito.");
      return;
    }

    const updated = tournaments.map((t) => {
      if (t.code === activeTournament.code) {
        return {
          ...t,
          teams: [...t.teams, team],
        };
      }
      return t;
    });

    saveTournaments(updated);
    toast.success(`✅ Equipo "${team.name}" inscrito en el torneo.`);
  };

  // === REMOVER EQUIPO DEL TORNEO ===
  const handleRemoveTeam = (teamId: string) => {
    if (!activeTournament) return;
    if (activeTournament.isStarted) {
      toast.error("No se pueden remover equipos después de haber iniciado la copa.");
      return;
    }

    const updated = tournaments.map((t) => {
      if (t.code === activeTournament.code) {
        return {
          ...t,
          teams: t.teams.filter((x) => x.id !== teamId),
        };
      }
      return t;
    });

    saveTournaments(updated);
    toast.success("Equipo removido de la lista de inscritos.");
  };

  // === AUTO-COMPLETAR EQUIPOS CON SQUADS DE LIMA ===
  const handleAutoFillTeams = () => {
    if (!activeTournament) return;
    if (activeTournament.isStarted) return;

    const currentCount = activeTournament.teams.length;
    const needed = activeTournament.size - currentCount;

    if (needed <= 0) {
      toast.info("La lista de equipos ya está llena.");
      return;
    }

    // Filtrar los que no estén inscritos aún
    const availableLima = AMATEUR_LIMA_SQUADS.filter(
      (local) => !activeTournament.teams.some((t) => t.id === local.id),
    );

    const shuffled = [...availableLima].sort(() => 0.5 - Math.random());
    const toAdd = shuffled.slice(0, needed);

    const updated = tournaments.map((t) => {
      if (t.code === activeTournament.code) {
        return {
          ...t,
          teams: [...t.teams, ...toAdd],
        };
      }
      return t;
    });

    saveTournaments(updated);
    toast.success(
      `🏟️ Se han completado los ${needed} cupos del torneo con escuadras realistas de Lima.`,
    );
  };

  // === INICIAR CAMPEONATO (🚀 LOCK DE BRACKETS) ===
  const handleStartTournament = () => {
    if (!activeTournament) return;

    if (activeTournament.teams.length < activeTournament.size) {
      toast.error(`Para iniciar necesitas exactamente ${activeTournament.size} equipos inscritos.`);
      return;
    }

    // Inicializar llaves/brackets con los inscritos
    const shuffledTeams = [...activeTournament.teams].sort(() => 0.5 - Math.random());
    const size = activeTournament.size;

    const r16Nodes: MatchNode[] = [];
    const qNodes: MatchNode[] = [];
    const sNodes: MatchNode[] = [];
    const fNodes: MatchNode[] = [];

    // Octavos de final
    if (size === 16) {
      for (let i = 0; i < 8; i++) {
        r16Nodes.push({
          id: `r16-${i + 1}`,
          teamA: shuffledTeams[i * 2],
          teamB: shuffledTeams[i * 2 + 1],
        });
      }
      for (let i = 0; i < 4; i++) {
        qNodes.push({
          id: `q-${i + 1}`,
          teamA: {
            id: `pending-q-${i * 2 + 1}`,
            name: `Ganador R16 #${i * 2 + 1}`,
            logoSeed: "pending",
          },
          teamB: {
            id: `pending-q-${i * 2 + 2}`,
            name: `Ganador R16 #${i * 2 + 2}`,
            logoSeed: "pending",
          },
        });
      }
    }

    // Cuartos de final
    if (size >= 8) {
      const quartersCount = 4;
      for (let i = 0; i < quartersCount; i++) {
        const teamA = size === 8 ? shuffledTeams[i * 2] : qNodes[i].teamA;
        const teamB = size === 8 ? shuffledTeams[i * 2 + 1] : qNodes[i].teamB;
        qNodes[i] = { id: `q-${i + 1}`, teamA, teamB };
      }
    }

    // Semifinales
    for (let i = 0; i < 2; i++) {
      const teamA =
        size === 4
          ? shuffledTeams[i * 2]
          : {
              id: `pending-s-${i * 2 + 1}`,
              name: `Ganador Cuartos #${i * 2 + 1}`,
              logoSeed: "pending",
            };
      const teamB =
        size === 4
          ? shuffledTeams[i * 2 + 1]
          : {
              id: `pending-s-${i * 2 + 2}`,
              name: `Ganador Cuartos #${i * 2 + 2}`,
              logoSeed: "pending",
            };
      sNodes.push({ id: `s-${i + 1}`, teamA, teamB });
    }

    // Gran Final
    const teamAF =
      size === 2
        ? shuffledTeams[0]
        : { id: "pending-f-a", name: "Ganador Semis #1", logoSeed: "pending" };
    const teamBF =
      size === 2
        ? shuffledTeams[1]
        : { id: "pending-f-b", name: "Ganador Semis #2", logoSeed: "pending" };
    fNodes.push({ id: "f-1", teamA: teamAF, teamB: teamBF });

    const updated = tournaments.map((t) => {
      if (t.code === activeTournament.code) {
        return {
          ...t,
          isStarted: true,
          simulationStep: "init" as const,
          brackets: {
            round16: r16Nodes,
            quarters: qNodes,
            semis: sNodes,
            finals: fNodes,
          },
          champion: null,
        };
      }
      return t;
    });

    saveTournaments(updated);
    toast.success("🚀 ¡El campeonato ha comenzado!", {
      description:
        "Las llaves están oficialmente bloqueadas. Haz clic en un partido para registrar los goles.",
      duration: 5000,
    });
  };

  // === REGISTRAR RESULTADOS MANUALES (CLIC EN BRACKET) ===
  const handleOpenScoreModal = (
    roundKey: "round16" | "quarters" | "semis" | "finals",
    node: MatchNode,
    index: number,
  ) => {
    if (!activeTournament || !activeTournament.isStarted) return;

    // Validar si el partido tiene rivales definidos y no placeholders
    if (node.teamA.id.startsWith("pending") || node.teamB.id.startsWith("pending")) {
      toast.error("Este partido aún no tiene rivales asignados. Juega las rondas previas.");
      return;
    }

    setSelectedMatchNode({ roundKey, node, index });
    setScoreA(node.teamA.score !== undefined ? String(node.teamA.score) : "0");
    setScoreB(node.teamB.score !== undefined ? String(node.teamB.score) : "0");
    setIsScoreModalOpen(true);
  };

  const handleSaveMatchScore = () => {
    if (!activeTournament || !selectedMatchNode) return;

    const gA = Math.max(0, parseInt(scoreA) || 0);
    const gB = Math.max(0, parseInt(scoreB) || 0);

    if (gA === gB) {
      toast.warning("En eliminación directa debe haber un ganador. Sorteando tanda de penales...");
    }

    // Tanda de penales simulada en caso de empate
    const isWinnerA = gA > gB ? true : gA < gB ? false : Math.random() >= 0.5;
    const finalScoreA = gA === gB && isWinnerA ? `${gA} (P)` : String(gA);
    const finalScoreB = gA === gB && !isWinnerA ? `${gB} (P)` : String(gB);

    const roundKey = selectedMatchNode.roundKey;
    const matchIndex = selectedMatchNode.index;
    const winnerTeam: Team = {
      ...(isWinnerA ? selectedMatchNode.node.teamA : selectedMatchNode.node.teamB),
      score: undefined,
      isWinner: undefined,
    };

    // Actualizar el partido modificado
    const updatedBrackets = { ...activeTournament.brackets };
    updatedBrackets[roundKey] = updatedBrackets[roundKey].map((match, idx) => {
      if (idx === matchIndex) {
        return {
          ...match,
          teamA: { ...match.teamA, score: gA, isWinner: isWinnerA },
          teamB: { ...match.teamB, score: gB, isWinner: !isWinnerA },
          winnerId: isWinnerA ? match.teamA.id : match.teamB.id,
        };
      }
      return match;
    });

    // --- PROMOVER GANADOR AL SIGUIENTE NODO ---
    if (roundKey === "round16") {
      const nextQuartersIndex = Math.floor(matchIndex / 2);
      const isPositionA = matchIndex % 2 === 0;
      updatedBrackets.quarters = updatedBrackets.quarters.map((match, idx) => {
        if (idx === nextQuartersIndex) {
          return {
            ...match,
            teamA: isPositionA ? winnerTeam : match.teamA,
            teamB: !isPositionA ? winnerTeam : match.teamB,
          };
        }
        return match;
      });
    } else if (roundKey === "quarters") {
      const nextSemisIndex = Math.floor(matchIndex / 2);
      const isPositionA = matchIndex % 2 === 0;
      updatedBrackets.semis = updatedBrackets.semis.map((match, idx) => {
        if (idx === nextSemisIndex) {
          return {
            ...match,
            teamA: isPositionA ? winnerTeam : match.teamA,
            teamB: !isPositionA ? winnerTeam : match.teamB,
          };
        }
        return match;
      });
    } else if (roundKey === "semis") {
      const isPositionA = matchIndex === 0;
      updatedBrackets.finals = updatedBrackets.finals.map((match, idx) => {
        if (idx === 0) {
          return {
            ...match,
            teamA: isPositionA ? winnerTeam : match.teamA,
            teamB: !isPositionA ? winnerTeam : match.teamB,
          };
        }
        return match;
      });
    }

    // Actualizar campeón en state
    let championData = activeTournament.champion;
    let step = activeTournament.simulationStep;

    if (roundKey === "finals") {
      championData = winnerTeam;
      step = "finals";
      toast.success(`🏆 ¡${winnerTeam.name} se coronó Campeón del torneo! 🎉`, {
        duration: 10000,
      });
    }

    const updatedTournaments = tournaments.map((t) => {
      if (t.code === activeTournament.code) {
        return {
          ...t,
          brackets: updatedBrackets,
          champion: championData,
          simulationStep: step,
        };
      }
      return t;
    });

    saveTournaments(updatedTournaments);
    setIsScoreModalOpen(false);
    setSelectedMatchNode(null);
    toast.success("Resultado guardado y llaves actualizadas.");
  };

  // === ENVIAR INVITACIÓN POR CHAT DE SQUAD ===
  const handleInviteUserByChat = async (targetUser: User) => {
    if (!activeTournament) return;
    try {
      const chatStore = useChatStore.getState();
      const inviteMsg = `¡Hola ${targetUser.name}! Te invito a inscribir a tu escuadra al torneo "${activeTournament.name}" de ${activeTournament.sport}. Código de acceso único: *${activeTournament.code}*. ¡Entra a la sección de Torneos e inscríbete! 🏆⚽`;

      const existingChat = chatStore.chats.find(
        (c) =>
          c.current_players.includes(currentUser?.id || "") &&
          c.current_players.includes(targetUser.id),
      );
      const chatId = existingChat ? existingChat.id : await chatStore.createChat(targetUser.id);
      await chatStore.sendMessage(chatId, inviteMsg);

      toast.success(`¡Invitación al torneo enviada a ${targetUser.name} por chat!`, {
        icon: <MessageSquare className="h-4 w-4 text-primary" />,
      });
    } catch (err) {
      console.error("Error sending chat tournament invite:", err);
      toast.error("Error al procesar la invitación por chat.");
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto animate-fade-in text-foreground">
      {/* Banner Encabezado */}
      <div className="bg-gradient-card border border-border rounded-3xl p-6 md:p-8 shadow-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-primary/15 blur-3xl" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="text-left">
            <span className="text-[10px] text-neon uppercase font-black tracking-widest bg-neon/15 px-3 py-1 rounded-full border border-neon/20 animate-pulse">
              🏆 Copa de Squads SportMatch 2026
            </span>
            <h1 className="font-heading text-4xl md:text-5xl tracking-wide text-foreground mt-3 uppercase font-black">
              Campeonato entre Escuadras
            </h1>
            <p className="text-sm text-muted-foreground mt-1 max-w-xl leading-relaxed">
              Crea torneos personalizados, comparte códigos de campeonato con otras escuadras e
              ingresa marcadores manuales de fútbol, pádel y tenis para coronar a tus campeones.
            </p>
          </div>

          <div className="flex gap-2 shrink-0 bg-background/50 border border-border p-1 rounded-2xl">
            <button
              onClick={() => setActiveTab("brackets")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "brackets"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Swords className="h-4 w-4" /> Brackets
            </button>
            <button
              onClick={() => setActiveTab("squads")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === "squads"
                  ? "bg-gradient-primary text-primary-foreground shadow-glow"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Users className="h-4 w-4" /> Reclutar Miembros
            </button>
          </div>
        </div>
      </div>

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
              Código de Torneo: {activeTournament?.code || "—"}
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
            {/* Lista de Miembros en Escuadra */}
            <div className="lg:col-span-2 space-y-4">
              <h4 className="text-sm font-black uppercase tracking-wider text-muted-foreground mb-1">
                Alineación Táctica (Titulares)
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
                          <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold animate-pulse">
                            CAP
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                        {activeTournament?.sport || "Deporte"} · {u.level || "Intermedio"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel de Reclutamiento de Jugadores Reales */}
            <div className="bg-background/40 border border-border rounded-2xl p-4 space-y-4">
              <div className="pb-2 border-b border-white/5">
                <h4 className="text-sm font-black text-foreground">Invitar Deportistas</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Invítalos a inscribir a sus clubes usando el código.
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
                    className="flex items-center justify-between p-2 bg-background/30 border border-border/40 rounded-xl"
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
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <div>
                <h3 className="font-heading text-base tracking-wide text-foreground flex items-center gap-2">
                  <Settings className="h-4.5 w-4.5 text-neon" /> Mis Campeonatos
                </h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="p-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors cursor-pointer border-0 flex items-center justify-center"
                title="Crear Torneo"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {/* Listado de torneos creados */}
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Seleccionar Campeonato
              </label>
              <div className="space-y-1.5">
                {tournaments.map((t) => (
                  <div
                    key={t.code}
                    onClick={() => setActiveTournamentCode(t.code)}
                    className={`p-3 rounded-xl border flex justify-between items-center gap-2 cursor-pointer transition-all ${
                      activeTournamentCode === t.code
                        ? "bg-primary/10 border-primary shadow-glow text-white"
                        : "bg-background/40 border-border/50 hover:bg-white/5 text-muted-foreground"
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold truncate text-foreground">{t.name}</div>
                      <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-mono mt-0.5 flex items-center gap-1.5">
                        <span>{t.sport}</span>
                        <span>·</span>
                        <span className="text-primary font-bold">{t.code}</span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTournament(t.code);
                      }}
                      className="p-1 rounded text-muted-foreground/60 hover:text-destructive transition-colors cursor-pointer border-0 bg-transparent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {activeTournament && (
              <div className="space-y-4 pt-2 border-t border-white/5">
                <div className="space-y-1">
                  <div className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                    Código de Invitación:
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-background border border-border rounded-xl">
                    <span className="text-xs font-bold font-mono tracking-widest text-primary flex-1 select-all">
                      {activeTournament.code}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(activeTournament.code);
                        toast.success("Código copiado al portapapeles.");
                      }}
                      className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground cursor-pointer border-0 bg-transparent"
                    >
                      <Share2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Lista de Equipos Inscritos */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                      Inscritos ({activeTournament.teams.length} / {activeTournament.size})
                    </label>
                    {!activeTournament.isStarted && (
                      <button
                        onClick={handleAutoFillTeams}
                        className="text-[9px] text-neon font-bold hover:underline border-0 bg-transparent cursor-pointer"
                      >
                        Auto-llenar
                      </button>
                    )}
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {activeTournament.teams.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic text-center py-4 bg-background/20 border border-dashed border-border/60 rounded-xl">
                        Ninguna escuadra inscrita. Comparte el código de arriba.
                      </p>
                    ) : (
                      activeTournament.teams.map((team) => (
                        <div
                          key={team.id}
                          className="flex items-center justify-between p-2 bg-background/50 border border-border/80 rounded-xl"
                        >
                          <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">
                            {team.name}
                          </span>
                          {!activeTournament.isStarted && (
                            <button
                              onClick={() => handleRemoveTeam(team.id)}
                              className="text-[10px] text-muted-foreground hover:text-destructive cursor-pointer border-0 bg-transparent"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

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

          {/* === PANEL DERECHO: VISUALIZACIÓN DE BRACKETS === */}
          <div className="col-span-1 lg:col-span-3 bg-gradient-card border border-border rounded-3xl p-5 shadow-card space-y-4">
            {activeTournament ? (
              <>
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pb-3 border-b border-white/5">
                  <div className="text-left">
                    <h3 className="font-heading text-xl tracking-wide text-foreground flex items-center gap-2">
                      <Trophy className="h-5 w-5 text-warning" /> Llaves de Torneo (
                      {activeTournament.name})
                    </h3>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      {activeTournament.isStarted
                        ? "Haz clic sobre un partido activo para registrar los resultados manuales"
                        : "Inscribe los equipos necesarios de la lista o auto-llena para empezar el torneo"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!activeTournament.isStarted ? (
                      <button
                        onClick={handleStartTournament}
                        disabled={activeTournament.teams.length < activeTournament.size}
                        className="px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-black text-xs flex items-center justify-center gap-1.5 shadow-glow cursor-pointer disabled:opacity-50"
                      >
                        <Play className="h-3.5 w-3.5 fill-current animate-pulse" /> Empezar Torneo
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              "¿Estás seguro de que deseas reiniciar las llaves por completo?",
                            )
                          ) {
                            const updated = tournaments.map((t) => {
                              if (t.code === activeTournament.code) {
                                return {
                                  ...t,
                                  isStarted: false,
                                  champion: null,
                                  brackets: { round16: [], quarters: [], semis: [], finals: [] },
                                };
                              }
                              return t;
                            });
                            saveTournaments(updated);
                            toast.success("Torneo restablecido. Vuelve a configurar los equipos.");
                          }
                        }}
                        className="px-4 py-2 rounded-xl bg-accent border border-border text-foreground font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <RefreshCw className="h-3.5 w-3.5" /> Re-sortear
                      </button>
                    )}
                  </div>
                </div>

                {/* Brackets visuales */}
                <div className="bg-background/25 border border-border/50 rounded-2xl p-4 md:p-6 overflow-x-auto">
                  {activeTournament.isStarted ? (
                    <div className="min-w-[850px] flex justify-between items-center gap-4 py-4 relative">
                      {/* Octavos de Final */}
                      {activeTournament.size === 16 && (
                        <div className="flex-1 space-y-4">
                          <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                              Octavos de Final
                            </span>
                          </div>
                          {activeTournament.brackets.round16.map((node, idx) => (
                            <MatchCard
                              key={node.id}
                              match={node}
                              onClick={() => handleOpenScoreModal("round16", node, idx)}
                            />
                          ))}
                        </div>
                      )}

                      {activeTournament.size === 16 && (
                        <div className="flex items-center justify-center text-muted-foreground/30 shrink-0">
                          <ChevronRight className="h-5 w-5" />
                        </div>
                      )}

                      {/* Cuartos de Final */}
                      {activeTournament.size >= 8 && (
                        <div className="flex-1 space-y-6">
                          <div className="text-center pb-1.5 border-b border-border/20 mb-2">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">
                              Cuartos de Final
                            </span>
                          </div>
                          {activeTournament.brackets.quarters.map((node, idx) => (
                            <MatchCard
                              key={node.id}
                              match={node}
                              onClick={() => handleOpenScoreModal("quarters", node, idx)}
                            />
                          ))}
                        </div>
                      )}

                      {activeTournament.size >= 8 && (
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
                        {activeTournament.brackets.semis.map((node, idx) => (
                          <MatchCard
                            key={node.id}
                            match={node}
                            onClick={() => handleOpenScoreModal("semis", node, idx)}
                          />
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
                        {activeTournament.brackets.finals[0] && (
                          <MatchCard
                            match={activeTournament.brackets.finals[0]}
                            onClick={() =>
                              handleOpenScoreModal("finals", activeTournament.brackets.finals[0], 0)
                            }
                          />
                        )}
                        {activeTournament.champion && (
                          <div className="mt-6 animate-scale-in flex flex-col items-center p-4 bg-primary/10 border border-primary/50 rounded-2xl shadow-glow text-center relative overflow-hidden">
                            <Trophy className="h-8 w-8 text-primary drop-shadow-[0_0_8px_hsl(var(--primary)/0.6)] animate-bounce" />
                            <span className="text-[8px] uppercase font-black text-primary tracking-widest mt-1.5 block">
                              Campeón de la Copa
                            </span>
                            <h5 className="text-xs font-black text-foreground mt-0.5 truncate max-w-[180px]">
                              {activeTournament.champion.name}
                            </h5>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 flex flex-col items-center text-center space-y-3">
                      <Trophy className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
                      <h4 className="text-sm font-bold text-foreground">
                        El torneo aún no ha comenzado
                      </h4>
                      <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                        Completa la lista de escuadras inscritas en el panel de la izquierda (mínimo{" "}
                        {activeTournament.size}) o haz clic en "Auto-llenar" para iniciar de
                        inmediato la Copa.
                      </p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-16 text-center space-y-2">
                <RefreshCw className="h-8 w-8 mx-auto text-muted-foreground animate-spin" />
                <p className="text-sm text-muted-foreground font-semibold">
                  Cargando campeonatos...
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: CREACIÓN DE NUEVO TORNEO */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-md bg-background/95 border-border shadow-2xl rounded-3xl p-6 text-foreground text-left">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-white">
              🏆 Crear Nuevo Campeonato
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Define los parámetros del nuevo campeonato para generar su código único.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateTournament} className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                Nombre del Torneo
              </label>
              <input
                value={newTourName}
                onChange={(e) => setNewTourName(e.target.value)}
                placeholder="Ej. Torneo de Campeones 2026"
                className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Disciplina
                </label>
                <select
                  value={newTourSport}
                  onChange={(e) => {
                    const s = e.target.value as Tournament["sport"];
                    setNewTourSport(s);
                    setNewTourFormat(SPORT_FORMAT_CONFIG[s]?.formats[0] || "5vs5");
                  }}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none"
                >
                  <option value="Fútbol">Fútbol ⚽</option>
                  <option value="Pádel">Pádel 🏓</option>
                  <option value="Tenis">Tenis 🎾</option>
                  <option value="Básquet">Básquet 🏀</option>
                  <option value="Vóley">Vóley 🏐</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block">
                  Tamaño de Llave
                </label>
                <select
                  value={newTourSize}
                  onChange={(e) => setNewTourSize(Number(e.target.value) as Tournament["size"])}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-border text-sm focus:border-primary outline-none"
                >
                  <option value={2}>2 (Gran Final)</option>
                  <option value={4}>4 (Semifinales)</option>
                  <option value={8}>8 (Cuartos de Final)</option>
                  <option value={16}>16 (Octavos de Final)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-border/15">
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="px-4 py-2 rounded-xl border border-border/80 text-xs font-semibold hover:bg-accent transition-all cursor-pointer bg-transparent"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:scale-[1.03] transition-transform shadow-glow cursor-pointer border-0"
              >
                Crear Torneo Pro
              </button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: INGRESAR RESULTADOS DE PARTIDO */}
      <Dialog open={isScoreModalOpen} onOpenChange={setIsScoreModalOpen}>
        <DialogContent className="max-w-md bg-background/95 border-border shadow-2xl rounded-3xl p-6 text-foreground text-left">
          <DialogHeader>
            <DialogTitle className="text-lg font-black uppercase text-white">
              ⚽ Registrar Resultados del Partido
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Ingresa los goles/puntos anotados por cada escuadra para definir quién avanza en el
              bracket.
            </DialogDescription>
          </DialogHeader>

          {selectedMatchNode && (
            <div className="space-y-4 pt-4">
              <div className="flex items-center justify-between gap-6 p-4 rounded-2xl bg-background/40 border border-border/50">
                {/* Equipo A */}
                <div className="flex flex-col items-center flex-1 text-center space-y-2 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold uppercase shrink-0">
                    {selectedMatchNode.node.teamA.name.slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-foreground truncate w-full">
                    {selectedMatchNode.node.teamA.name}
                  </span>
                  <input
                    value={scoreA}
                    onChange={(e) => setScoreA(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    min="0"
                    className="w-16 text-center text-base font-black px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
                  />
                </div>

                <div className="text-xs font-black text-muted-foreground uppercase tracking-widest shrink-0">
                  VS
                </div>

                {/* Equipo B */}
                <div className="flex flex-col items-center flex-1 text-center space-y-2 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-sm font-bold uppercase shrink-0">
                    {selectedMatchNode.node.teamB.name.slice(0, 2)}
                  </div>
                  <span className="text-xs font-bold text-foreground truncate w-full">
                    {selectedMatchNode.node.teamB.name}
                  </span>
                  <input
                    value={scoreB}
                    onChange={(e) => setScoreB(e.target.value.replace(/\D/g, ""))}
                    type="number"
                    min="0"
                    className="w-16 text-center text-base font-black px-3 py-2 rounded-lg bg-background border border-border outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-border/15">
                <button
                  type="button"
                  onClick={() => setIsScoreModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border/80 text-xs font-semibold hover:bg-accent transition-all cursor-pointer bg-transparent"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveMatchScore}
                  className="px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-bold hover:scale-[1.03] transition-transform shadow-glow cursor-pointer border-0"
                >
                  Confirmar Marcador
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function MatchCard({ match, onClick }: { match: MatchNode; onClick?: () => void }) {
  const getLogoUrl = (seed: string) =>
    `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(seed)}`;

  const isPlayable = !match.teamA.id.startsWith("pending") && !match.teamB.id.startsWith("pending");

  return (
    <div
      onClick={isPlayable && onClick ? onClick : undefined}
      className={`bg-gradient-card border border-border/80 rounded-2xl shadow-md overflow-hidden text-left relative transition-all duration-300 ${
        isPlayable && onClick
          ? "hover:border-primary/50 cursor-pointer hover:shadow-glow hover:scale-[1.02]"
          : "border-border/40"
      }`}
    >
      <div className="p-3 space-y-2 relative">
        {isPlayable && (
          <div className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
        )}
        {/* Equipo A */}
        <div
          className={`flex items-center justify-between gap-2.5 ${
            match.teamA.isWinner === false ? "opacity-35" : ""
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamA.logoSeed)}
              alt=""
              className="h-5 w-5 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground/90">
              {match.teamA.name}
            </span>
          </div>
          {match.teamA.score !== undefined ? (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                match.teamA.isWinner
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "bg-muted text-muted-foreground"
              }`}
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
          className={`flex items-center justify-between gap-2.5 ${
            match.teamB.isWinner === false ? "opacity-35" : ""
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <img
              src={getLogoUrl(match.teamB.logoSeed)}
              alt=""
              className="h-5 w-5 rounded bg-muted flex-shrink-0"
            />
            <span className="text-xs font-semibold truncate text-foreground/90">
              {match.teamB.name}
            </span>
          </div>
          {match.teamB.score !== undefined ? (
            <span
              className={`text-[10px] font-black px-1.5 py-0.5 rounded-md ${
                match.teamB.isWinner
                  ? "bg-primary/15 text-primary border border-primary/25"
                  : "bg-muted text-muted-foreground"
              }`}
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
