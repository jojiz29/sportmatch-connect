import React, { useEffect } from "react";
import { Swords, Zap, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

interface TeamPlayer {
  name: string;
  avatarSeed: string;
  role: "Titular" | "Rotación";
  position: "GK" | "DEF" | "MID" | "FWD";
}

interface MatchupVersusProps {
  isOpen: boolean;
  onClose: () => void;
  teamAName?: string;
  teamBName?: string;
  format?: string;
}

const TEAM_A_PLAYERS_PRESET: TeamPlayer[] = [
  { name: "Carlos S.", avatarSeed: "Carlos", role: "Titular", position: "GK" },
  { name: "Mateo P.", avatarSeed: "Mateo", role: "Titular", position: "DEF" },
  { name: "Lucía G.", avatarSeed: "Lucia", role: "Titular", position: "MID" },
  { name: "Sofi F.", avatarSeed: "Sofi", role: "Titular", position: "MID" },
  { name: "Juan R.", avatarSeed: "Juan", role: "Titular", position: "FWD" },
  { name: "Pedro S.", avatarSeed: "Pedro", role: "Rotación", position: "DEF" },
  { name: "Ana G.", avatarSeed: "Ana", role: "Rotación", position: "MID" },
];

const TEAM_B_PLAYERS_PRESET: TeamPlayer[] = [
  { name: "Franco V.", avatarSeed: "Franco", role: "Titular", position: "GK" },
  { name: "Diego T.", avatarSeed: "Diego", role: "Titular", position: "DEF" },
  { name: "Leo M.", avatarSeed: "Leo", role: "Titular", position: "MID" },
  { name: "Emma K.", avatarSeed: "Emma", role: "Titular", position: "MID" },
  { name: "Bruno O.", avatarSeed: "Bruno", role: "Titular", position: "FWD" },
  { name: "Piero L.", avatarSeed: "Piero", role: "Rotación", position: "GK" },
  { name: "Emma L.", avatarSeed: "Emma2", role: "Rotación", position: "FWD" },
];

export function MatchupVersus({
  isOpen,
  onClose,
  teamAName = "Escuadra Edwin Flores",
  teamBName = "Real Madrid SportMatch",
  format = "5vs5",
}: MatchupVersusProps) {
  // Sound effect or haptic trigger (Task 2.3)
  useEffect(() => {
    if (isOpen) {
      try {
        if (typeof window !== "undefined" && "vibrate" in navigator) {
          navigator.vibrate([100, 50, 100]);
        }
      } catch {
        // Ignorar si no está soportado
      }
    }
  }, [isOpen]);

  const getLogoUrl = (seed: string) => `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}`;
  const getAvatarUrl = (seed: string) => `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-background/95 border-border/80 shadow-2xl rounded-3xl p-6 relative transition-colors duration-300">
        {/* Glow vector backdrops */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-red-500/10 blur-[80px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-64 h-64 rounded-full bg-[#39FF14]/10 blur-[80px] pointer-events-none" />

        <DialogHeader className="text-center relative z-10 pb-4 border-b border-white/5">
          <DialogTitle className="font-heading text-3xl tracking-wider text-foreground flex items-center justify-center gap-2">
            <Swords className="h-6 w-6 text-red-500 animate-pulse" />
            Alineación del Enfrentamiento
            <Zap className="h-6 w-6 text-[#39FF14] animate-bounce-slow" />
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Formación táctica para el formato {format} de la gran final
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-7 items-center gap-6 py-6 relative z-10">
          {/* TEAM A PANEL */}
          <div className="col-span-3 space-y-4 text-left">
            <div className="flex items-center gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
              <img
                src={getLogoUrl(teamAName)}
                alt=""
                className="h-10 w-10 rounded-xl bg-background border border-border"
              />
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-[#39FF14] truncate">{teamAName}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Local
                </p>
              </div>
            </div>

            {/* List with sliding animations (Task 2.3) */}
            <div className="space-y-2">
              {TEAM_A_PLAYERS_PRESET.map((player, idx) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: -30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-white/5 hover:border-[#39FF14]/30 transition-all"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={getAvatarUrl(player.avatarSeed)}
                      alt=""
                      className="h-8 w-8 rounded-full bg-muted object-cover"
                    />
                    <div className="min-w-0">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {player.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {player.position}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded ${player.role === "Titular" ? "bg-[#39FF14]/15 text-[#39FF14] border border-[#39FF14]/20" : "bg-white/5 text-muted-foreground"}`}
                  >
                    {player.role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* VS CIRCLE */}
          <div className="col-span-1 flex flex-col items-center justify-center">
            <div className="h-14 w-14 rounded-full bg-red-500/10 border-2 border-red-500/30 flex items-center justify-center shadow-lg shadow-red-500/15 relative overflow-hidden group">
              <span className="font-heading text-2xl font-black text-red-500 italic group-hover:scale-110 transition-transform">
                VS
              </span>
            </div>
            <div className="mt-3 text-center hidden lg:block">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">
                Fase
              </span>
              <span className="text-xs font-black text-[#D4AF37] block mt-0.5">FINAL</span>
            </div>
          </div>

          {/* TEAM B PANEL */}
          <div className="col-span-3 space-y-4 text-right">
            <div className="flex items-center justify-between gap-3 bg-white/5 border border-white/10 p-3 rounded-2xl">
              <div className="min-w-0 text-left lg:text-right flex-1">
                <h4 className="font-bold text-sm text-red-400 truncate">{teamBName}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                  Visitante
                </p>
              </div>
              <img
                src={getLogoUrl(teamBName)}
                alt=""
                className="h-10 w-10 rounded-xl bg-background border border-border"
              />
            </div>

            {/* List with sliding animations (Task 2.3) */}
            <div className="space-y-2">
              {TEAM_B_PLAYERS_PRESET.map((player, idx) => (
                <motion.div
                  key={player.name}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.08, duration: 0.3, ease: "easeOut" }}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-background/50 border border-white/5 hover:border-red-500/30 transition-all flex-row-reverse"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-row-reverse">
                    <img
                      src={getAvatarUrl(player.avatarSeed)}
                      alt=""
                      className="h-8 w-8 rounded-full bg-muted object-cover"
                    />
                    <div className="min-w-0 text-right">
                      <span className="text-xs font-semibold text-foreground block truncate">
                        {player.name}
                      </span>
                      <span className="text-[9px] text-muted-foreground font-medium">
                        {player.position}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`text-[8px] font-black px-2 py-0.5 rounded ${player.role === "Titular" ? "bg-red-500/15 text-red-400 border border-red-500/20" : "bg-white/5 text-muted-foreground"}`}
                  >
                    {player.role}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-white/5 pt-4">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-primary text-primary-foreground font-black text-xs tracking-wider cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 shadow-glow"
          >
            <CheckCircle2 className="h-4 w-4" />
            Entendido, ¡A la Cancha!
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default MatchupVersus;
