// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hook de estado para controlar el paso actual del formulario multi-paso.
import { useState } from "react";
// Framer Motion para animaciones de transición entre pasos y aparición del modal.
import { motion, AnimatePresence } from "framer-motion";
// Iconos de Lucide para los campos del formulario y acciones.
import {
  MapPin,
  Calendar,
  Clock,
  Users,
  Trophy,
  ChevronRight,
  X,
  Loader2,
  Check,
} from "lucide-react";
// Store de partidos públicos para crear el partido en Supabase/API.
import { usePublicMatchStore } from "@/features/matchmaking/usePublicMatchStore";
// Hook personalizado para manejo estricto de formularios con validación.
import { useStrictForm } from "@/shared/hooks/useStrictForm";
// Tipos compartidos: Sport (deporte) y Level (nivel de juego).
import type { Sport, Level } from "@/entities/types";
// Notificaciones toast para errores de validación y feedback al usuario.
import { toast } from "sonner";

// === BLOQUE: INTERFAZ DE PROPS ===
interface CreateMatchModalProps {
  open: boolean;
  onClose: () => void;
}

// === BLOQUE: TIPO DEL FORMULARIO ===
// Define los campos del formulario multi-paso para crear un partido.
type CreateMatchForm = {
  title: string;
  sport: string;
  level: string;
  courtName: string;
  address: string;
  date: string;
  time: string;
  maxPlayers: string;
};

// === BLOQUE: CONSTANTES ===
// Catálogo de deportes disponibles con su emoji representativo.
const SPORTS: { name: Sport; emoji: string }[] = [
  { name: "Fútbol", emoji: "⚽" },
  { name: "Básquet", emoji: "🏀" },
  { name: "Tenis", emoji: "🎾" },
  { name: "Pádel", emoji: "🏓" },
  { name: "Vóley", emoji: "🏐" },
  { name: "Running", emoji: "🏃" },
  { name: "Rugby", emoji: "🏉" },
  { name: "Natación", emoji: "🏊" },
  { name: "Gimnasio", emoji: "💪" },
  { name: "Tenis de Mesa", emoji: "🏓" },
  { name: "Boxeo / MMA", emoji: "🥊" },
  { name: "Ciclismo", emoji: "🚴" },
];

// Niveles de juego disponibles.
const LEVELS: Level[] = ["Principiante", "Intermedio", "Avanzado", "Elite"];
// Colores asociados a cada nivel para las etiquetas visuales.
const LEVEL_COLORS: Record<Level, string> = {
  Principiante: "border-neon/40 text-neon bg-neon/10",
  Intermedio: "border-electric/40 text-electric bg-electric/10",
  Avanzado: "border-warning/40 text-warning bg-warning/10",
  Elite: "border-destructive/40 text-destructive bg-destructive/10",
};

// Pasos del formulario multi-paso.
const STEPS = ["Deporte & Nivel", "Lugar & Fecha", "Configuración"];

// Fecha de hoy en formato ISO (YYYY-MM-DD) para el atributo min del input date.
const today = new Date().toISOString().split("T")[0];

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Modal multi-paso para crear un nuevo partido público con deporte, lugar y configuración.
export function CreateMatchModal({ open, onClose }: CreateMatchModalProps) {
  const [step, setStep] = useState(0);
  const createMatch = usePublicMatchStore((s) => s.createMatch);

  // Hook de formulario estricto con validación en submit.
  const { values, handleChange, handleBlur, setValues, isSubmitting } =
    useStrictForm<CreateMatchForm>({
      initialValues: {
        title: "",
        sport: "Fútbol",
        level: "Intermedio",
        courtName: "",
        address: "",
        date: "",
        time: "",
        maxPlayers: "10",
      },
      onSubmit: async (vals) => {
        if (
          !vals.sport ||
          !vals.level ||
          !vals.courtName ||
          !vals.address ||
          !vals.date ||
          !vals.time ||
          !vals.title
        ) {
          toast.error("Completa todos los campos obligatorios.");
          return;
        }
        const maxP = Number(vals.maxPlayers);
        if (isNaN(maxP) || maxP < 2 || maxP > 22) {
          toast.error("El máximo de jugadores debe ser entre 2 y 22.");
          return;
        }
        createMatch({
          title: vals.title,
          sport: vals.sport as Sport,
          level: vals.level as Level,
          courtName: vals.courtName,
          address: vals.address,
          lat: -12.046374 + Math.random() * 0.05 - 0.025,
          lng: -77.042793 + Math.random() * 0.05 - 0.025,
          date: vals.date,
          time: vals.time,
          maxPlayers: maxP,
        });
        setStep(0);
        onClose();
      },
    });

  // Título auto-generado a partir del deporte y nombre de cancha.
  const autoTitle =
    values.sport && values.courtName
      ? `${values.sport} · ${values.courtName}`
      : values.sport
        ? `Partido de ${values.sport}`
        : "";

  // Avanza al siguiente paso con validación del paso actual.
  const handleNext = () => {
    if (step === 0 && (!values.sport || !values.level)) {
      toast.error("Selecciona un deporte y nivel.");
      return;
    }
    if (step === 1 && (!values.courtName || !values.address || !values.date || !values.time)) {
      toast.error("Completa todos los campos de lugar y fecha.");
      return;
    }
    if (step === 1 && !values.title) {
      setValues((v) => ({ ...v, title: autoTitle }));
    }
    setStep((s) => s + 1);
  };

  // Reinicia el paso al cerrar el modal.
  const handleClose = () => {
    setStep(0);
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          id="create-match-overlay"
        >
          {/* Fondo oscuro con blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Panel del modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-lg bg-card border border-border rounded-3xl shadow-card overflow-hidden"
            id="create-match-modal"
          >
            {/* Cabecera */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-neon grid place-items-center shadow-neon">
                  <Trophy className="h-4 w-4 text-neon-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base leading-tight">
                    Crear Partido Público
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Paso {step + 1} de {STEPS.length}
                  </p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="h-8 w-8 rounded-xl hover:bg-accent grid place-items-center transition-colors cursor-pointer"
                aria-label="Cerrar"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Indicador de progreso por pasos */}
            <div className="px-6 py-3 flex items-center gap-2">
              {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-2 flex-1 last:flex-none">
                  <div className="flex items-center gap-1.5">
                    <motion.div
                      animate={{ scale: i === step ? 1.1 : 1 }}
                      className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                        i < step
                          ? "bg-neon text-neon-foreground"
                          : i === step
                            ? "bg-gradient-primary text-primary-foreground shadow-glow"
                            : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {i < step ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </motion.div>
                    <span
                      className={`text-xs font-medium hidden sm:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`flex-1 h-0.5 rounded-full mx-1 ${i < step ? "bg-neon" : "bg-muted"}`}
                    />
                  )}
                </div>
              ))}
            </div>

            {/* Cuerpo del formulario por pasos */}
            <div className="px-6 pb-6 min-h-[320px] flex flex-col">
              <AnimatePresence mode="wait">
                {/* ── PASO 0: Deporte y Nivel ── */}
                {step === 0 && (
                  <motion.div
                    key="step0"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col gap-4"
                  >
                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Deporte
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {SPORTS.map(({ name, emoji }) => (
                          <button
                            key={name}
                            type="button"
                            onClick={() => setValues((v) => ({ ...v, sport: name }))}
                            className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                              values.sport === name
                                ? "bg-primary/15 border-primary ring-1 ring-primary text-foreground"
                                : "bg-muted border-transparent text-muted-foreground hover:bg-accent hover:text-foreground"
                            }`}
                            id={`sport-card-${name.replace(/\s/g, "-")}`}
                          >
                            <span className="text-xl">{emoji}</span>
                            <span className="text-[9px] font-semibold leading-tight">{name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-foreground mb-2">
                        Nivel requerido
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {LEVELS.map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => setValues((v) => ({ ...v, level: lvl }))}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              values.level === lvl
                                ? LEVEL_COLORS[lvl]
                                : "bg-muted border-border text-muted-foreground hover:bg-accent"
                            }`}
                            id={`level-btn-${lvl}`}
                          >
                            {lvl}
                          </button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── PASO 1: Lugar y Fecha ── */}
                {step === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col gap-3"
                  >
                    <div>
                      <label
                        htmlFor="courtName"
                        className="block text-xs font-semibold text-foreground mb-1.5"
                      >
                        Nombre de la cancha / lugar
                      </label>
                      <div className="relative">
                        <Trophy className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          id="courtName"
                          name="courtName"
                          type="text"
                          placeholder="Ej: Cancha SportMatch Norte"
                          value={values.courtName}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        htmlFor="address"
                        className="block text-xs font-semibold text-foreground mb-1.5"
                      >
                        Dirección
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input
                          id="address"
                          name="address"
                          type="text"
                          placeholder="Ej: Av. Universitaria 1200, Lima"
                          value={values.address}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label
                          htmlFor="date"
                          className="block text-xs font-semibold text-foreground mb-1.5"
                        >
                          <Calendar className="inline h-3.5 w-3.5 mr-1" />
                          Fecha
                        </label>
                        <input
                          id="date"
                          name="date"
                          type="date"
                          min={today}
                          value={values.date}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                      </div>
                      <div>
                        <label
                          htmlFor="time"
                          className="block text-xs font-semibold text-foreground mb-1.5"
                        >
                          <Clock className="inline h-3.5 w-3.5 mr-1" />
                          Hora
                        </label>
                        <input
                          id="time"
                          name="time"
                          type="time"
                          value={values.time}
                          onChange={handleChange}
                          className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── PASO 2: Configuración ── */}
                {step === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 flex flex-col gap-4"
                  >
                    {/* Resumen visual de lo seleccionado */}
                    <div className="flex flex-wrap gap-2">
                      <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary font-medium">
                        {values.sport}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                        {values.level}
                      </span>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground">
                        {values.date} {values.time}
                      </span>
                    </div>

                    <div>
                      <label
                        htmlFor="title"
                        className="block text-xs font-semibold text-foreground mb-1.5"
                      >
                        Título del partido
                      </label>
                      <input
                        id="title"
                        name="title"
                        type="text"
                        placeholder={autoTitle || "Ej: Fútbol 5vs5 · Cancha Norte"}
                        value={values.title || autoTitle}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        className="w-full px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">
                        Sugerencia auto-generada, puedes editarla.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="maxPlayers"
                        className="block text-xs font-semibold text-foreground mb-1.5"
                      >
                        <Users className="inline h-3.5 w-3.5 mr-1" />
                        Máximo de jugadores
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          id="maxPlayers"
                          name="maxPlayers"
                          type="number"
                          min={2}
                          max={22}
                          value={values.maxPlayers}
                          onChange={handleChange}
                          className="w-24 px-3 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
                        />
                        <span className="text-xs text-muted-foreground">
                          Entre 2 y 22 jugadores
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Botones de navegación: Atrás / Siguiente / Crear */}
              <div className="flex gap-2 mt-6">
                {step > 0 && (
                  <button
                    type="button"
                    onClick={() => setStep((s) => s - 1)}
                    className="flex-1 py-2.5 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors cursor-pointer"
                    id="create-match-back-btn"
                  >
                    Atrás
                  </button>
                )}

                {step < STEPS.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:shadow-glow transition-shadow flex items-center justify-center gap-2 cursor-pointer"
                    id="create-match-next-btn"
                  >
                    Siguiente
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const finalTitle = values.title || autoTitle;
                      setValues((v) => ({ ...v, title: finalTitle }));
                      const maxP = Number(values.maxPlayers);
                      if (
                        !finalTitle ||
                        !values.courtName ||
                        !values.address ||
                        !values.date ||
                        !values.time
                      ) {
                        toast.error("Completa todos los campos obligatorios.");
                        return;
                      }
                      if (isNaN(maxP) || maxP < 2 || maxP > 22) {
                        toast.error("El máximo de jugadores debe ser entre 2 y 22.");
                        return;
                      }
                      createMatch({
                        title: finalTitle,
                        sport: values.sport as Sport,
                        level: values.level as Level,
                        courtName: values.courtName,
                        address: values.address,
                        lat: -12.046374 + Math.random() * 0.05 - 0.025,
                        lng: -77.042793 + Math.random() * 0.05 - 0.025,
                        date: values.date,
                        time: values.time,
                        maxPlayers: maxP,
                      });
                      setStep(0);
                      onClose();
                    }}
                    disabled={isSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-neon text-neon-foreground text-sm font-semibold hover:shadow-neon transition-shadow disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                    id="create-match-submit-btn"
                  >
                    {isSubmitting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Crear Partido
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
