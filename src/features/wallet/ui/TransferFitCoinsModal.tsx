// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hooks de React para estado local y efectos de carga de jugadores.
import { useState, useEffect } from "react";
// Framer Motion para animaciones del modal y transiciones.
import { motion, AnimatePresence } from "framer-motion";
// Iconos de Lucide para la interfaz de transferencia.
import { X, Send, Search, Coins, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
// Store de wallet para acceder al saldo y actualizar transacciones.
import { useWalletStore } from "@/features/wallet/useWalletStore";
// Store de autenticación para identificar al usuario que envía.
import { useAuthStore } from "@/entities/user/useAuth";
// Hook de formulario estricto con validación.
import { useStrictForm } from "@/shared/hooks/useStrictForm";
// Cliente API para buscar jugadores en el leaderboard.
import { apiClient } from "@/shared/api/apiClient";
// Store de notificaciones para crear notificaciones de transferencia.
import { useNotificationStore } from "@/features/notifications/model/useNotificationStore";
// Tipo User para los jugadores destino.
import type { User } from "@/entities/types";

// === BLOQUE: INTERFAZ DE PROPS ===
interface TransferFitCoinsModalProps {
  open: boolean;
  onClose: () => void;
}

// === BLOQUE: TIPO DEL FORMULARIO ===
type TransferFormValues = {
  recipientSearch: string;
  amount: string;
};

// ─── Lista mock de jugadores para modo offline / demo ──────────────────────────
const MOCK_PLAYERS: Pick<User, "id" | "name" | "avatar_url" | "fitcoins_balance">[] = [
  { id: "mock-1", name: "Carlos Rodríguez", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=carlos", fitcoins_balance: 320 },
  { id: "mock-2", name: "María Gómez", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=maria", fitcoins_balance: 780 },
  { id: "mock-3", name: "Andrés Torres", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=andres", fitcoins_balance: 150 },
  { id: "mock-4", name: "Valentina Cruz", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=valentina", fitcoins_balance: 1200 },
  { id: "mock-5", name: "Diego Sánchez", avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=diego", fitcoins_balance: 480 },
];

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Modal para transferir FitCoins a otro jugador con búsqueda, selección y confirmación.
export function TransferFitCoinsModal({ open, onClose }: TransferFitCoinsModalProps) {
  const currentUser = useAuthStore((s) => s.user);
  const isDemoMode = useAuthStore.getState().isDemoMode || import.meta.env.VITE_USE_MOCKS === "true";

  const balance = useWalletStore((s) => s.balance);
  const addNotification = useNotificationStore((s) => s.addNotification);

  const [players, setPlayers] = useState<Pick<User, "id" | "name" | "avatar_url" | "fitcoins_balance">[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Pick<User, "id" | "name" | "avatar_url" | "fitcoins_balance"> | null>(null);
  const [step, setStep] = useState<"select" | "confirm" | "success">("select");

  // ── Carga de jugadores ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    setStep("select");
    setSelectedPlayer(null);
    if (isDemoMode) { setPlayers(MOCK_PLAYERS); return; }
    setLoadingPlayers(true);
    apiClient.users
      .getLeaderboard()
      .then((users) => {
        const filtered = users.filter((u) => u.id !== currentUser?.id);
        setPlayers(filtered as Pick<User, "id" | "name" | "avatar_url" | "fitcoins_balance">[]);
      })
      .catch(() => setPlayers(MOCK_PLAYERS))
      .finally(() => setLoadingPlayers(false));
  }, [open, isDemoMode, currentUser?.id]);

  // ── Formulario ───────────────────────────────────────────────────────────────
  const { values, handleChange, handleBlur, handleSubmit, errors, isSubmitting, setValues } =
    useStrictForm<TransferFormValues>({
      initialValues: { recipientSearch: "", amount: "" },
      validate: (vals) => {
        const errs: Record<string, string> = {};
        if (!selectedPlayer) errs.recipientSearch = "Selecciona un jugador destinatario.";
        const amountNum = Number(vals.amount);
        if (!vals.amount || isNaN(amountNum) || amountNum <= 0) errs.amount = "El monto debe ser mayor a 0.";
        if (amountNum > balance) errs.amount = `Saldo insuficiente. Tenés ${balance} FC disponibles.`;
        return Object.keys(errs).length > 0 ? errs : null;
      },
      onSubmit: async (vals) => {
        if (!selectedPlayer || !currentUser) return;
        const amount = Number(vals.amount);
        // Actualización optimista del saldo y transacciones.
        useWalletStore.setState((s) => ({
          balance: s.balance - amount,
          transactions: [{
            id: `tx-transfer-${Date.now()}`,
            user_id: currentUser.id,
            amount: -amount,
            description: `Transferencia a ${selectedPlayer.name}`,
            type: "SPEND",
            created_at: new Date().toISOString(),
          }, ...s.transactions],
        }));
        // Notificación para el remitente.
        addNotification({
          id: `notif-transfer-${Date.now()}`,
          user_id: currentUser.id,
          type: "TRANSACTION_SUCCESS",
          title: "Transferencia exitosa 🪙",
          content: `Enviaste ${amount} FC a ${selectedPlayer.name}`,
          link: "/app/wallet/history",
        });
        setStep("success");
      },
      successMessage: undefined,
    });

  // ── Lista filtrada ──────────────────────────────────────────────────────────
  const filteredPlayers = (players || []).filter((p) =>
    p.name?.toLowerCase().includes(values.recipientSearch.toLowerCase()),
  );

  const parsedAmount = Number(values.amount) || 0;
  const amountExceedsBalance = parsedAmount > balance;

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="transfer-modal-overlay">
          {/* Fondo oscuro */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />

          <motion.div initial={{ opacity: 0, scale: 0.95, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 24 }} transition={{ duration: 0.22, ease: "easeOut" }}
            className="relative w-full max-w-md bg-card border border-border rounded-3xl shadow-card overflow-hidden" id="transfer-modal">

            {/* Cabecera */}
            <div className="px-6 pt-6 pb-4 flex items-center justify-between border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-xl bg-gradient-primary grid place-items-center shadow-glow">
                  <Send className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-bold text-foreground text-base leading-tight">Transferir FitCoins</h2>
                  <p className="text-xs text-muted-foreground">Saldo: {balance} FC disponibles</p>
                </div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-xl hover:bg-accent grid place-items-center transition-colors cursor-pointer" aria-label="Cerrar">
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="px-6 py-5">
              {/* ── PASO: éxito ── */}
              {step === "success" && (
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-4 py-6 text-center">
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                    className="h-20 w-20 rounded-full bg-neon/10 border-2 border-neon grid place-items-center">
                    <CheckCircle2 className="h-10 w-10 text-neon" />
                  </motion.div>
                  <div>
                    <p className="text-lg font-bold text-foreground">¡Transferencia enviada!</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Enviaste <span className="text-neon font-bold">{values.amount} FC</span> a{" "}
                      <span className="font-semibold text-foreground">{selectedPlayer?.name}</span>
                    </p>
                  </div>
                  <button onClick={onClose}
                    className="mt-2 px-8 py-2.5 rounded-xl bg-gradient-neon text-neon-foreground font-semibold hover:shadow-neon transition-shadow cursor-pointer" id="transfer-success-close-btn">
                    Listo
                  </button>
                </motion.div>
              )}

              {/* ── PASO: selección + confirmación ── */}
              {step !== "success" && (
                <form onSubmit={handleSubmit} noValidate>
                  {/* Búsqueda de destinatario */}
                  <div className="mb-4">
                    <label className="block text-xs font-semibold text-foreground mb-1.5">Destinatario</label>
                    {selectedPlayer ? (
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-primary/8 border border-primary/30">
                        <img src={selectedPlayer.avatar_url ?? ""} alt={selectedPlayer.name}
                          className="h-9 w-9 rounded-full bg-muted object-cover" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-foreground truncate">{selectedPlayer.name}</div>
                          <div className="text-xs text-muted-foreground">{selectedPlayer.fitcoins_balance ?? "—"} FC</div>
                        </div>
                        <button type="button" onClick={() => { setSelectedPlayer(null); setValues((v) => ({ ...v, recipientSearch: "" })); }}
                          className="h-7 w-7 rounded-lg hover:bg-accent grid place-items-center cursor-pointer">
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        <input id="transfer-recipient-input" name="recipientSearch" type="text"
                          placeholder="Buscar jugador..." value={values.recipientSearch}
                          onChange={handleChange} onBlur={handleBlur} autoComplete="off"
                          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors" />
                      </div>
                    )}
                    {errors.recipientSearch && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.recipientSearch}
                      </p>
                    )}

                    {/* Lista desplegable de jugadores */}
                    {!selectedPlayer && (
                      <AnimatePresence>
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                          className="mt-2 max-h-44 overflow-y-auto rounded-xl border border-border bg-card shadow-lg" id="transfer-player-list">
                          {loadingPlayers ? (
                            <div className="flex items-center justify-center py-6 gap-2 text-muted-foreground text-sm">
                              <Loader2 className="h-4 w-4 animate-spin" /> Cargando jugadores...
                            </div>
                          ) : filteredPlayers.length === 0 ? (
                            <div className="py-6 text-center text-xs text-muted-foreground">No se encontraron jugadores.</div>
                          ) : (
                            filteredPlayers.map((p) => (
                              <button key={p.id} type="button" onClick={() => setSelectedPlayer(p)}
                                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left cursor-pointer first:rounded-t-xl last:rounded-b-xl border-b border-border/40 last:border-b-0"
                                id={`player-option-${p.id}`}>
                                <img src={p.avatar_url ?? ""} alt={p.name}
                                  className="h-8 w-8 rounded-full bg-muted object-cover shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-medium text-foreground truncate">{p.name}</div>
                                  <div className="text-xs text-muted-foreground">{p.fitcoins_balance ?? "—"} FC</div>
                                </div>
                              </button>
                            ))
                          )}
                        </motion.div>
                      </AnimatePresence>
                    )}
                  </div>

                  {/* Campo de monto */}
                  <div className="mb-5">
                    <label htmlFor="transfer-amount-input" className="block text-xs font-semibold text-foreground mb-1.5">Monto a transferir (FC)</label>
                    <div className="relative">
                      <Coins className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                      <input id="transfer-amount-input" name="amount" type="number" min={1} max={balance}
                        placeholder="0" value={values.amount} onChange={handleChange} onBlur={handleBlur}
                        className={`w-full pl-9 pr-20 py-2.5 rounded-xl bg-muted border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-colors ${
                          amountExceedsBalance ? "border-destructive focus:ring-destructive/40" : "border-border focus:ring-primary/50 focus:border-primary"
                        }`} />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                        {[50, 100].map((preset) => (
                          <button key={preset} type="button"
                            onClick={() => setValues((v) => ({ ...v, amount: String(preset) }))}
                            className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-accent hover:bg-primary/15 text-foreground cursor-pointer transition-colors">
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Barra de saldo */}
                    {parsedAmount > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                          <motion.div className={`h-full rounded-full transition-colors ${amountExceedsBalance ? "bg-destructive" : "bg-gradient-neon"}`}
                            initial={{ width: 0 }} animate={{ width: `${Math.min((parsedAmount / balance) * 100, 100)}%` }} transition={{ duration: 0.3 }} />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>0 FC</span>
                          <span className={amountExceedsBalance ? "text-destructive font-semibold" : ""}>
                            {amountExceedsBalance ? "Saldo insuficiente" : `Restante: ${balance - parsedAmount} FC`}
                          </span>
                          <span>{balance} FC</span>
                        </div>
                      </div>
                    )}
                    {errors.amount && (
                      <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {errors.amount}
                      </p>
                    )}
                  </div>

                  {/* Botones de acción */}
                  <div className="flex gap-2">
                    <button type="button" onClick={onClose}
                      className="flex-1 py-2.5 rounded-xl glass border border-border text-sm font-semibold hover:bg-accent transition-colors cursor-pointer" id="transfer-cancel-btn">
                      Cancelar
                    </button>
                    <button type="submit" disabled={isSubmitting || amountExceedsBalance || !selectedPlayer}
                      className="flex-1 py-2.5 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold hover:shadow-glow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                      id="transfer-submit-btn">
                      {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando...</> : <><Send className="h-4 w-4" /> Transferir</>}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
