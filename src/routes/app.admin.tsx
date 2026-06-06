import { createFileRoute, redirect } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { Court, User } from "@/entities/types";
import { Users, DollarSign, CalendarCheck, Activity, Star, MoreHorizontal } from "lucide-react";
import { useAuthStore } from "@/entities/user/useAuth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { supabase } from "@/shared/api/supabase";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — SportMatch" }] }),
  beforeLoad: () => {
    const user = useAuthStore.getState().user;
    const isAdmin =
      user?.email === "ejuniorfloress@gmail.com" || user?.name === "Edwin Flores" || user?.is_admin;
    if (!isAdmin) {
      throw redirect({ to: "/app" });
    }
  },
  component: Admin,
});

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const COLORS = ["bg-violet", "bg-electric", "bg-neon", "bg-warning", "bg-muted-foreground"];

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

  useEffect(() => {
    let active = true;

    // Try backend first for courts, fallback to Supabase
    backendApi.courts.getAll()
      .then((backendCourts) => {
        if (active) setCourtsList(backendCourts as Court[]);
      })
      .catch(() => {
        apiClient.courts.getAll()
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

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Dashboard administrativo" subtitle="Operación en tiempo real" />

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
                    <td>{p.preferred_sports[0] || "Ninguno"}</td>
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
                  <Star className="h-3 w-3 fill-warning" />
                  {c.rating}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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
