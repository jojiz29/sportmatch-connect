// === BLOQUE: Ruta de Panel de Administración ===
// Dashboard administrativo con KPIs de plataforma (usuarios, partidos,
// ingresos, ocupación), gráficos de reservas semanales y distribución
// por deporte, tabla de usuarios recientes con toggle de permisos admin,
// y lista de canchas top. Acceso restringido al administrador principal.
import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Court, User } from "@/entities/types";
import {
  Users,
  DollarSign,
  CalendarCheck,
  Activity,
  Star,
  MoreHorizontal,
  Plus,
  Edit3,
  Trash2,
} from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — SportMatch" }] }),
  // === BLOQUE: Guardia de acceso ===
  // Solo el administrador principal (email o nombre específico) puede
  // acceder a esta ruta. Cualquier otro usuario es redirigido a /app.
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAdmin =
      user?.email === "ejuniorfloress@gmail.com" || user?.name === "Edwin Flores" || user?.is_admin;
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  component: Admin,
});

// === BLOQUE: Constantes de UI ===
const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const COLORS = ["bg-violet", "bg-electric", "bg-neon", "bg-warning", "bg-muted-foreground"];

// === BLOQUE: KPIs mock para el dashboard ===
const ADMIN_KPI = {
  users: 12450,
  matchesToday: 342,
  revenue: 8450,
  occupancy: 82,
  weekly: [40, 55, 45, 60, 85, 100, 90],
  sportsShare: [
    { sport: "Pádel", value: 45 },
    { sport: "Fútbol", value: 35 },
    { sport: "Tenis", value: 15 },
    { sport: "Otros", value: 5 },
  ],
};

function Admin() {
  const [usersList, setUsersList] = useState<User[]>([]);
  const [courtsList, setCourtsList] = useState<Court[]>([]);
  const [showCourtForm, setShowCourtForm] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [courtForm, setCourtForm] = useState({
    name: "",
    sport: "",
    address: "",
    price_per_hour: 0,
  });
  const [savingCourt, setSavingCourt] = useState(false);

  // === BLOQUE: Carga de datos ===
  // Obtiene lista de canchas (backend → fallback Supabase) y
  // lista de usuarios desde apiClient.
  useEffect(() => {
    let active = true;

    backendApi.courts
      .getAll()
      .then((backendCourts) => {
        if (active) setCourtsList(backendCourts as Court[]);
      })
      .catch(() => {
        apiClient.courts
          .getAll()
          .then((courts) => {
            if (active) setCourtsList(courts);
          })
          .catch((err) => console.error("Error loading courts for admin:", err));
      });

    apiClient.users
      .getMatches()
      .then((users) => {
        if (active) setUsersList(users);
      })
      .catch((err) => console.error("Error loading users for admin:", err));

    return () => {
      active = false;
    };
  }, []);

  // === BLOQUE: toggleAdmin ===
  // Concede o revoca permisos de administrador a un usuario.
  // No permite modificar al administrador principal.
  const toggleAdmin = async (userId: string) => {
    const targetUser = usersList.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.email === "ejuniorfloress@gmail.com" || targetUser.name === "Edwin Flores") {
      toast.error("No se puede revocar el acceso del administrador principal.");
      return;
    }

    const updatedIsAdmin = !targetUser.is_admin;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_admin: updatedIsAdmin })
        .eq("id", userId);
      if (error) throw error;
      setUsersList(
        usersList.map((u) => (u.id === userId ? { ...u, is_admin: updatedIsAdmin } : u)),
      );
      toast.success(
        `Acceso de administrador ${updatedIsAdmin ? "otorgado" : "revocado"} para ${targetUser.name}`,
      );
    } catch (e) {
      console.error("Error updating admin role in Supabase:", e);
      toast.error("Error al actualizar permisos");
    }
  };

  const total = ADMIN_KPI.sportsShare.reduce(
    (a: number, b: { sport: string; value: number }) => a + b.value,
    0,
  );

  const openAddCourt = () => {
    setEditingCourt(null);
    setCourtForm({ name: "", sport: "", address: "", price_per_hour: 0 });
    setShowCourtForm(true);
  };

  const openEditCourt = (court: Court) => {
    setEditingCourt(court);
    setCourtForm({
      name: court.name,
      sport: court.sport,
      address: court.address || "",
      price_per_hour: court.price_per_hour || 0,
    });
    setShowCourtForm(true);
  };

  const saveCourt = async () => {
    if (!courtForm.name.trim() || !courtForm.sport.trim()) {
      toast.error("Nombre y deporte son obligatorios");
      return;
    }
    setSavingCourt(true);
    try {
      if (editingCourt) {
        const { error } = await supabase
          .from("courts")
          .update({
            name: courtForm.name,
            sport: courtForm.sport,
            address: courtForm.address,
            price_per_hour: courtForm.price_per_hour,
          })
          .eq("id", editingCourt.id);
        if (error) throw error;
        setCourtsList(
          courtsList.map((c) => (c.id === editingCourt.id ? { ...c, ...courtForm } : c)),
        );
        toast.success("Cancha actualizada");
      } else {
        const { data, error } = await supabase
          .from("courts")
          .insert([
            {
              name: courtForm.name,
              sport: courtForm.sport,
              address: courtForm.address,
              price_per_hour: courtForm.price_per_hour,
            },
          ])
          .select()
          .single();
        if (error) throw error;
        setCourtsList([...courtsList, data as unknown as Court]);
        toast.success("Cancha creada");
      }
      setShowCourtForm(false);
      setEditingCourt(null);
    } catch (e) {
      console.error("Error saving court:", e);
      toast.error("Error al guardar cancha");
    } finally {
      setSavingCourt(false);
    }
  };

  const deleteCourt = async (courtId: string) => {
    if (!confirm("¿Eliminar esta cancha?")) return;
    try {
      const { error } = await supabase.from("courts").delete().eq("id", courtId);
      if (error) throw error;
      setCourtsList(courtsList.filter((c) => c.id !== courtId));
      toast.success("Cancha eliminada");
    } catch (e) {
      console.error("Error deleting court:", e);
      toast.error("Error al eliminar cancha");
    }
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Dashboard administrativo" subtitle="Operación en tiempo real" />

      {/* === BLOQUE: KPIs principales === */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI
          icon={<Users className="h-5 w-5" />}
          label="Usuarios"
          value={ADMIN_KPI.users.toLocaleString()}
          delta="+12%"
        />
        <KPI
          icon={<CalendarCheck className="h-5 w-5" />}
          label="Partidos hoy"
          value={ADMIN_KPI.matchesToday}
          delta="+5%"
        />
        <KPI
          icon={<DollarSign className="h-5 w-5" />}
          label="Ingresos"
          value={`$${ADMIN_KPI.revenue.toLocaleString()}`}
          delta="+18%"
        />
        <KPI
          icon={<Activity className="h-5 w-5" />}
          label="Ocupación"
          value={`${ADMIN_KPI.occupancy}%`}
          delta="+3%"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* === BLOQUE: Gráfico de reservas semanales === */}
        <div className="lg:col-span-2 bg-gradient-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Reservas semanales</h3>
            <span className="text-xs text-neon">↑ 22% vs semana anterior</span>
          </div>
          <div className="flex items-end gap-3 h-56">
            {ADMIN_KPI.weekly.map((v: number, i: number) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-muted-foreground">{v}</div>
                <div
                  className="w-full rounded-t-lg bg-gradient-primary hover:opacity-80 transition-all"
                  style={{ height: `${v}%` }}
                />
                <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        {/* === BLOQUE: Distribución por deporte === */}
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Distribución por deporte</h3>
          <div className="space-y-3">
            {ADMIN_KPI.sportsShare.map((s: { sport: string; value: number }, i: number) => (
              <div key={s.sport}>
                <div className="flex justify-between text-sm">
                  <span>{s.sport}</span>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
                  <div
                    className={`h-full ${COLORS[i]}`}
                    style={{ width: `${(s.value / total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* === BLOQUE: Tabla de usuarios recientes === */}
        <div className="lg:col-span-2 bg-gradient-card border border-border rounded-2xl p-5 overflow-hidden">
          <h3 className="font-semibold mb-4">Usuarios recientes</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground text-left">
                  <th className="py-2">Jugador</th>
                  <th>Deporte</th>
                  <th>Trust</th>
                  <th>Partidos</th>
                  <th>Acceso Admin</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {usersList.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={p.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full bg-muted object-cover"
                        />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.level}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.preferred_sports?.[0] || "Ninguno"}</td>
                    <td>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full ${(p.trust_score || 0) >= 90 ? "bg-neon/20 text-neon" : "bg-warning/20 text-warning"}`}
                      >
                        {p.trust_score}%
                      </span>
                    </td>
                    <td>10</td>
                    <td>
                      <button
                        onClick={() => toggleAdmin(p.id)}
                        disabled={
                          p.email === "ejuniorfloress@gmail.com" || p.name === "Edwin Flores"
                        }
                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          p.is_admin ||
                          p.email === "ejuniorfloress@gmail.com" ||
                          p.name === "Edwin Flores"
                            ? "bg-neon text-neon-foreground hover:shadow-neon"
                            : "bg-muted text-muted-foreground hover:bg-accent"
                        }`}
                      >
                        {p.is_admin ||
                        p.email === "ejuniorfloress@gmail.com" ||
                        p.name === "Edwin Flores"
                          ? "Admin"
                          : "Hacer Admin"}
                      </button>
                    </td>
                    <td>
                      <button className="p-1 rounded hover:bg-accent">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* === BLOQUE: Top canchas === */}
        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Top canchas</h3>
          <div className="space-y-3">
            {courtsList.map((c: Court) => (
              <div key={c.id} className="flex items-center gap-3">
                <img src={c.image_url} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.reviews_count} reservas</div>
                </div>
                <div className="text-xs text-warning flex items-center gap-1">
                  <Star className="h-3 w-3 fill-warning" /> {c.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* === BLOQUE: Gestión de canchas === */}
      <div className="mt-8 bg-gradient-card border border-border rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Gestión de canchas</h3>
          <button
            onClick={openAddCourt}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:scale-105 transition-transform cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" /> Agregar
          </button>
        </div>

        {showCourtForm && (
          <div className="mb-4 p-4 bg-muted/50 rounded-xl border border-border space-y-3">
            <input
              value={courtForm.name}
              onChange={(e) => setCourtForm({ ...courtForm, name: e.target.value })}
              placeholder="Nombre de la cancha"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
            <div className="flex gap-3">
              <input
                value={courtForm.sport}
                onChange={(e) => setCourtForm({ ...courtForm, sport: e.target.value })}
                placeholder="Deporte"
                className="flex-1 px-3 py-2 rounded-lg bg-background border border-border text-sm"
              />
              <input
                value={courtForm.price_per_hour}
                onChange={(e) =>
                  setCourtForm({ ...courtForm, price_per_hour: Number(e.target.value) })
                }
                placeholder="Precio/h (FC)"
                type="number"
                className="w-32 px-3 py-2 rounded-lg bg-background border border-border text-sm"
              />
            </div>
            <input
              value={courtForm.address}
              onChange={(e) => setCourtForm({ ...courtForm, address: e.target.value })}
              placeholder="Dirección (opcional)"
              className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowCourtForm(false);
                  setEditingCourt(null);
                }}
                className="px-3 py-1.5 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={saveCourt}
                disabled={savingCourt}
                className="px-3 py-1.5 rounded-lg bg-gradient-primary text-primary-foreground text-xs font-semibold hover:scale-105 transition-transform disabled:opacity-50 cursor-pointer"
              >
                {savingCourt ? "Guardando..." : editingCourt ? "Actualizar" : "Crear"}
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-muted-foreground text-left">
                <th className="py-2">Cancha</th>
                <th>Deporte</th>
                <th>Precio/h</th>
                <th>Dirección</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {courtsList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-muted-foreground text-xs">
                    No hay canchas registradas
                  </td>
                </tr>
              ) : (
                courtsList.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={c.image_url}
                          alt=""
                          className="h-8 w-8 rounded-lg object-cover bg-muted"
                        />
                        <span className="font-medium">{c.name}</span>
                      </div>
                    </td>
                    <td>{c.sport}</td>
                    <td>{c.price_per_hour} FC</td>
                    <td className="text-muted-foreground max-w-[200px] truncate">
                      {c.address || "—"}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditCourt(c)}
                          className="p-1.5 rounded-lg hover:bg-accent transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => deleteCourt(c.id)}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors cursor-pointer"
                          title="Eliminar"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// === BLOQUE: KPI ===
// Componente reutilizable para indicador de métrica con ícono y delta.
function KPI({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  delta: string;
}) {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-white">
          {icon}
        </div>
        <span className="text-xs text-neon">{delta}</span>
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
