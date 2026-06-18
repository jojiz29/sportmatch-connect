import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, Trophy, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PublicMatch } from "@/features/matchmaking/usePublicMatchStore";

interface MiniCalendarProps {
  match: PublicMatch;
  onClose: () => void;
}

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

function parseMatchDate(date: string): Date {
  const parsed = new Date(`${date}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
}

function buildMonthGrid(targetDate: Date): Date[] {
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const mondayOffset = (firstOfMonth.getDay() + 6) % 7;
  const gridStart = new Date(year, month, 1 - mondayOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatMonth(date: Date): string {
  return new Intl.DateTimeFormat("es-PE", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function MiniCalendar({ match, onClose }: MiniCalendarProps) {
  const matchDate = parseMatchDate(match.date);
  const days = buildMonthGrid(matchDate);
  const participants = match.participants ?? [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={`mini-calendar-title-${match.id}`}
      id={`mini-calendar-overlay-${match.id}`}
    >
      <button
        type="button"
        aria-label="Cerrar calendario"
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.section
        initial={{ y: 32, scale: 0.98 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 32, scale: 0.98 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative max-h-[92vh] w-full overflow-y-auto rounded-t-3xl border border-border bg-card shadow-card sm:max-w-3xl sm:rounded-3xl"
        id={`mini-calendar-${match.id}`}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border/50 px-4 py-4 sm:px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
              <CalendarDays className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h3
                id={`mini-calendar-title-${match.id}`}
                className="truncate text-base font-bold text-foreground"
              >
                {match.title}
              </h3>
              <p className="text-xs font-medium text-muted-foreground">{formatMonth(matchDate)}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>

        <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_280px] sm:p-5">
          <section className="rounded-2xl border border-border/60 bg-background/60 p-3">
            <div className="mb-3 grid grid-cols-7 gap-1 text-center text-[11px] font-bold uppercase text-muted-foreground">
              {WEEKDAYS.map((weekday, index) => (
                <span key={`${weekday}-${index}`}>{weekday}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {days.map((day) => {
                const isMatchDay = isSameDay(day, matchDate);
                const isOutsideMonth = day.getMonth() !== matchDate.getMonth();

                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "grid aspect-square min-h-9 place-items-center rounded-xl border text-sm font-semibold transition-colors",
                      isMatchDay
                        ? "border-primary bg-primary text-primary-foreground shadow-glow"
                        : "border-transparent bg-muted/30 text-foreground",
                      isOutsideMonth && !isMatchDay && "text-muted-foreground/45",
                    )}
                    aria-label={isMatchDay ? "Fecha del partido" : undefined}
                  >
                    {day.getDate()}
                  </div>
                );
              })}
            </div>
          </section>

          <aside className="space-y-3">
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
              <p className="text-xs font-semibold uppercase text-primary">Fecha del partido</p>
              <p className="mt-1 text-sm font-bold capitalize text-foreground">
                {formatDate(matchDate)}
              </p>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">{match.time}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                <Trophy className="h-4 w-4 text-primary" />
                <span className="min-w-0 truncate font-medium text-foreground">{match.sport}</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-background/60 p-3">
                <MapPin className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 truncate font-medium text-foreground">
                  {match.courtName}
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-border/60 bg-background/60 p-3">
              <div className="mb-3 flex items-center justify-between gap-2">
                <span className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Participantes
                </span>
                <span className="text-xs font-bold text-muted-foreground">
                  {participants.length}/{match.maxPlayers}
                </span>
              </div>
              <div className="max-h-40 space-y-2 overflow-y-auto pr-1">
                {participants.map((participant) => (
                  <div key={participant.userId} className="flex items-center gap-2">
                    <img
                      src={
                        participant.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.userId}`
                      }
                      alt={participant.name}
                      className="h-7 w-7 rounded-full border border-border bg-muted object-cover"
                    />
                    <span className="min-w-0 truncate text-xs font-medium text-foreground">
                      {participant.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </motion.section>
    </motion.div>
  );
}
