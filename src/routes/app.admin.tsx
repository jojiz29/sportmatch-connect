import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { ADMIN_KPI, PLAYERS, COURTS } from "@/lib/mock";
import { Users, DollarSign, CalendarCheck, Activity, Star, MoreHorizontal } from "lucide-react";

export const Route = createFileRoute("/app/admin")({
  head: () => ({ meta: [{ title: "Admin — SportMatch" }] }),
  component: Admin,
});

const DAYS = ["L", "M", "M", "J", "V", "S", "D"];
const COLORS = ["bg-violet", "bg-electric", "bg-neon", "bg-warning", "bg-muted-foreground"];

function Admin() {
  const total = ADMIN_KPI.sportsShare.reduce((a, b) => a + b.value, 0);

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Dashboard administrativo" subtitle="Operación en tiempo real" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KPI icon={<Users className="h-5 w-5" />} label="Usuarios" value={ADMIN_KPI.users.toLocaleString()} delta="+12%" />
        <KPI icon={<CalendarCheck className="h-5 w-5" />} label="Partidos hoy" value={ADMIN_KPI.matchesToday} delta="+5%" />
        <KPI icon={<DollarSign className="h-5 w-5" />} label="Ingresos" value={`$${ADMIN_KPI.revenue.toLocaleString()}`} delta="+18%" />
        <KPI icon={<Activity className="h-5 w-5" />} label="Ocupación" value={`${ADMIN_KPI.occupancy}%`} delta="+3%" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-gradient-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Reservas semanales</h3>
            <span className="text-xs text-neon">↑ 22% vs semana anterior</span>
          </div>
          <div className="flex items-end gap-3 h-56">
            {ADMIN_KPI.weekly.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div className="text-xs text-muted-foreground">{v}</div>
                <div className="w-full rounded-t-lg bg-gradient-primary hover:opacity-80 transition-all" style={{ height: `${v}%` }} />
                <div className="text-xs text-muted-foreground">{DAYS[i]}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold mb-4">Distribución por deporte</h3>
          <div className="space-y-3">
            {ADMIN_KPI.sportsShare.map((s, i) => (
              <div key={s.sport}>
                <div className="flex justify-between text-sm">
                  <span>{s.sport}</span>
                  <span className="text-muted-foreground">{s.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden">
                  <div className={`h-full ${COLORS[i]}`} style={{ width: `${(s.value / total) * 100}%` }} />
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
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {PLAYERS.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <img src={p.avatar} alt="" className="h-8 w-8 rounded-full bg-muted" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-xs text-muted-foreground">{p.level}</div>
                        </div>
                      </div>
                    </td>
                    <td>{p.sport}</td>
                    <td>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${p.trustScore >= 90 ? "bg-neon/20 text-neon" : "bg-warning/20 text-warning"}`}>
                        {p.trustScore}
                      </span>
                    </td>
                    <td>{p.matches}</td>
                    <td>
                      <button className="p-1 rounded hover:bg-accent"><MoreHorizontal className="h-4 w-4" /></button>
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
            {COURTS.map((c) => (
              <div key={c.id} className="flex items-center gap-3">
                <img src={c.image} alt="" className="h-10 w-10 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold truncate">{c.name}</div>
                  <div className="text-xs text-muted-foreground">{c.reviews} reservas</div>
                </div>
                <div className="text-xs text-warning flex items-center gap-1"><Star className="h-3 w-3 fill-warning" />{c.rating}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ icon, label, value, delta }: { icon: React.ReactNode; label: string; value: string | number; delta: string }) {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="h-10 w-10 rounded-xl bg-gradient-primary grid place-items-center text-white">{icon}</div>
        <span className="text-xs text-neon">{delta}</span>
      </div>
      <div className="text-2xl font-bold mt-3">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
