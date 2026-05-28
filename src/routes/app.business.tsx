import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { useAuthStore } from "@/entities/user/useAuth";
import { useState, useEffect, useMemo } from "react";
import { getCatalogItems, createCatalogItem, deleteCatalogItem } from "@/shared/api/businessService";
import { CatalogItem } from "@/entities/types";
import { useBusinessStore } from "@/features/business/model/useBusinessStore";
import { useSocialStore } from "@/features/social/model/useSocialStore";
import { toast } from "sonner";
import {
  LayoutGrid, Plus, Trash2, TrendingUp, Users, DollarSign,
  Loader2, ShieldAlert, Eye, BarChart3, Target,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";

export const Route = createFileRoute("/app/business")({
  head: () => ({ meta: [{ title: "Mi Negocio — SportMatch" }] }),
  component: BusinessPage,
});

// Generate mock analytics data for the charts
function generateSalesData() {
  const days = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
  return days.map((day) => ({
    day,
    ventas: Math.floor(Math.random() * 400) + 50,
    impresiones: Math.floor(Math.random() * 1200) + 200,
  }));
}

function generateReachData() {
  return [
    { name: "< 1km", value: 35, color: "hsl(var(--neon))" },
    { name: "1-3km", value: 40, color: "hsl(var(--electric))" },
    { name: "3-5km", value: 20, color: "hsl(var(--warning))" },
    { name: "> 5km", value: 5, color: "hsl(var(--muted-foreground))" },
  ];
}

function BusinessPage() {
  const user = useAuthStore((s) => s.user);
  const navigate = useNavigate();
  const sales = useBusinessStore((s) => s.sales);

  const [items, setItems] = useState<CatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"catalog" | "analytics">("catalog");

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [type, setType] = useState<"PRODUCT" | "SERVICE">("PRODUCT");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Analytics data
  const salesData = useMemo(() => generateSalesData(), []);
  const reachData = useMemo(() => generateReachData(), []);

  useEffect(() => {
    if (!user) return;
    if (user.user_role !== "BUSINESS") return;

    const businessId = user.id;

    async function loadCatalog() {
      try {
        setLoading(true);
        const data = await getCatalogItems(businessId);
        setItems(data);
      } catch (err) {
        console.error("Failed to load catalog:", err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, [user]);

  if (!user) return null;

  // Access Control Guard
  if (user.user_role !== "BUSINESS") {
    return (
      <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-warning/10 border border-warning/30 grid place-items-center mb-6 animate-pulse">
          <ShieldAlert className="h-8 w-8 text-warning" />
        </div>
        <h1 className="text-3xl font-extrabold text-white mb-2">Acceso Exclusivo B2B</h1>
        <p className="text-muted-foreground max-w-md mb-8 text-sm">
          Esta sección está reservada para cuentas comerciales y patrocinadores de SportMatch.
        </p>
        <button
          onClick={() => navigate({ to: "/app" })}
          className="px-6 py-3 rounded-xl bg-gradient-primary text-primary-foreground font-semibold shadow-glow hover:scale-105 active:scale-95 transition-transform"
        >
          Volver al Inicio
        </button>
      </div>
    );
  }

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || price === "") return;

    try {
      setSubmitting(true);
      const created = await createCatalogItem({
        id: `item-${Date.now()}`,
        business_id: user.id,
        name,
        description: description || null,
        price: Number(price),
        type,
        image_url: imageUrl || "https://images.unsplash.com/photo-1546429070-1fc422f1d77a",
      });

      setItems((prev) => [created, ...prev]);
      setName("");
      setDescription("");
      setPrice("");
      setImageUrl("");
      toast.success("¡Producto/Servicio añadido al catálogo!");
    } catch (err) {
      console.error(err);
      toast.error("Error al crear el producto");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      await deleteCatalogItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item eliminado de tu catálogo");
    } catch (err) {
      console.error(err);
      toast.error("Error al eliminar el item");
    }
  };

  // Metrics
  const mySales = sales.filter((s) => items.some((i) => i.id === s.catalog_item_id));
  const totalEarned = mySales.reduce((acc, curr) => acc + curr.price, 0);
  const totalSalesCount = mySales.length;

  // Followers from social store
  const followersCount = useSocialStore.getState().getFollowStats(user.id).followersCount;

  // Simulated reach
  const simulatedReach = user.is_sponsored ? 8430 : items.length * 120 + 350;

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Panel de Negocios" subtitle={`Gestiona tu marketplace y analíticas comerciales para ${user.company_name || user.name}`} />

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="FitCoins Recaudados"
          value={`${user.fitcoins_balance} FC`}
          icon={<DollarSign className="h-5 w-5" />}
          accentClass="text-neon bg-neon/10 border-neon/20"
          id="business-balance-display"
        />
        <MetricCard
          label="Ventas Totales"
          value={String(totalSalesCount)}
          icon={<LayoutGrid className="h-5 w-5" />}
          accentClass="text-electric bg-electric/10 border-electric/20"
          id="business-sales-display"
        />
        <MetricCard
          label="Seguidores"
          value={String(followersCount)}
          icon={<Users className="h-5 w-5" />}
          accentClass="text-violet-foreground bg-violet/10 border-violet/30"
          id="business-followers-display"
        />
        <MetricCard
          label="Alcance Geográfico"
          value={`${simulatedReach}`}
          icon={<Eye className="h-5 w-5" />}
          accentClass="text-warning bg-warning/10 border-warning/20"
          extra={user.is_sponsored ? "🔥 Premium" : undefined}
        />
      </div>

      {/* Tab Switch */}
      <div className="flex gap-4 border-b border-border/50 pb-2 mb-6">
        <button
          onClick={() => setActiveTab("catalog")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === "catalog"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="business-tab-catalog"
        >
          📦 Catálogo & Ventas
        </button>
        <button
          onClick={() => setActiveTab("analytics")}
          className={`pb-2 text-sm font-bold border-b-2 transition-all px-1 cursor-pointer ${
            activeTab === "analytics"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          id="business-tab-analytics"
        >
          📊 Business Intelligence
        </button>
      </div>

      {activeTab === "catalog" && (
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Catalog List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                📦 Mi Catálogo de Ventas
              </h3>
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-neon" />
                  <span>Cargando catálogo...</span>
                </div>
              ) : items.length > 0 ? (
                <div className="grid sm:grid-cols-2 gap-4">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className="glass border border-border rounded-2xl p-4 flex gap-4 items-center hover:ring-glow transition-all relative group"
                    >
                      <img
                        src={item.image_url || "https://images.unsplash.com/photo-1546429070-1fc422f1d77a"}
                        alt={item.name}
                        className="h-16 w-16 rounded-xl object-cover bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/20 text-primary-foreground font-semibold">
                          {item.type === "PRODUCT" ? "Producto" : "Servicio"}
                        </span>
                        <h4 className="font-bold text-sm text-foreground mt-1 truncate">{item.name}</h4>
                        <p className="text-xs text-muted-foreground line-clamp-1">{item.description}</p>
                        <span className="text-xs font-bold text-neon block mt-1">{item.price} FC</span>
                      </div>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="h-8 w-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 hover:text-red-400 grid place-items-center opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                        title="Eliminar del catálogo"
                        id={`delete-item-${item.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
                  No has publicado ningún producto o servicio todavía.
                </div>
              )}
            </div>

            {/* Sales History */}
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-4">📈 Registro de Ventas Recientes</h3>
              {mySales.length > 0 ? (
                <div className="space-y-3">
                  {mySales.map((sale) => (
                    <div key={sale.id} className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                      <div>
                        <div className="font-semibold">{sale.item_name}</div>
                        <div className="text-xs text-muted-foreground">Comprador: {sale.buyer_name}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-neon">+{sale.price} FC</div>
                        <div className="text-[10px] text-muted-foreground">
                          {new Date(sale.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground text-xs">
                  No tienes transacciones de venta registradas aún.
                </div>
              )}
            </div>
          </div>

          {/* Add Catalog Item Form */}
          <div>
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card sticky top-8">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <Plus className="h-5 w-5 text-primary" /> Nuevo Item
              </h3>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Nombre del Producto / Servicio</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="Ej. Bebida Deportiva Isotónica"
                    id="catalog-item-name"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block">Descripción</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm resize-none h-16"
                    placeholder="Ej. 500ml sabor limón..."
                    id="catalog-item-desc"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Precio (FitCoins)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={price}
                      onChange={(e) => setPrice(e.target.value === "" ? "" : Number(e.target.value))}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                      placeholder="100"
                      id="catalog-item-price"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold mb-1 block">Tipo</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as "PRODUCT" | "SERVICE")}
                      className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                      id="catalog-item-type"
                    >
                      <option value="PRODUCT">Producto</option>
                      <option value="SERVICE">Servicio</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold mb-1 block">Imagen URL</label>
                  <input
                    type="text"
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-xl focus:ring-1 focus:ring-primary outline-none text-sm"
                    placeholder="https://images.unsplash.com/..."
                    id="catalog-item-image"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-primary hover:scale-[1.02] active:scale-[0.98] text-primary-foreground font-bold rounded-xl shadow-glow transition-all text-sm cursor-pointer"
                  id="catalog-item-submit"
                >
                  {submitting ? "Publicando..." : "Publicar en Marketplace"}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {activeTab === "analytics" && (
        <div className="space-y-6" id="bi-analytics-section">
          {/* Sales & Impressions Chart */}
          <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
            <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-neon" /> Ventas e Impresiones Semanales
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Rendimiento de los últimos 7 días en FitCoins y alcance visual.</p>
            <div className="h-[280px] w-full" id="bi-sales-chart">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--neon))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--neon))" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="impressionsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--electric))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--electric))" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 12,
                      fontSize: 12,
                    }}
                  />
                  <Area type="monotone" dataKey="ventas" stroke="hsl(var(--neon))" fill="url(#salesGrad)" strokeWidth={2} name="Ventas (FC)" />
                  <Area type="monotone" dataKey="impresiones" stroke="hsl(var(--electric))" fill="url(#impressionsGrad)" strokeWidth={2} name="Impresiones" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Geographic Reach Donut */}
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <Target className="h-5 w-5 text-warning" /> Alcance Geográfico
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Distribución de usuarios que vieron tu local en el mapa por distancia.</p>
              <div className="h-[220px] w-full flex items-center justify-center" id="bi-reach-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reachData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                      strokeWidth={0}
                    >
                      {reachData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: 12,
                        fontSize: 12,
                      }}
                      formatter={(value: number) => [`${value}%`, "Usuarios"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-3 justify-center mt-2">
                {reachData.map((d) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} />
                    {d.name} ({d.value}%)
                  </div>
                ))}
              </div>
            </div>

            {/* Engagement KPIs */}
            <div className="bg-gradient-card border border-border rounded-3xl p-6 shadow-card">
              <h3 className="font-semibold text-lg mb-1 flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-electric" /> KPIs de Engagement
              </h3>
              <p className="text-xs text-muted-foreground mb-4">Indicadores clave de rendimiento para tu marca.</p>
              <div className="space-y-4">
                <KpiRow label="Tasa de Conversión" value={totalSalesCount > 0 ? `${((totalSalesCount / simulatedReach) * 100).toFixed(1)}%` : "0%"} barWidth={totalSalesCount > 0 ? Math.min((totalSalesCount / simulatedReach) * 100 * 20, 100) : 2} color="neon" />
                <KpiRow label="Revenue per Impression" value={simulatedReach > 0 ? `${(totalEarned / simulatedReach).toFixed(1)} FC` : "0 FC"} barWidth={Math.min(totalEarned / Math.max(simulatedReach, 1) * 100, 100)} color="electric" />
                <KpiRow label="Retención de Seguidores" value={`${followersCount} activos`} barWidth={Math.min(followersCount * 20, 100)} color="warning" />
                <KpiRow label="Productos en Catálogo" value={`${items.length}`} barWidth={Math.min(items.length * 15, 100)} color="primary" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({
  label, value, icon, accentClass, id, extra,
}: {
  label: string; value: string; icon: React.ReactNode; accentClass: string; id?: string; extra?: string;
}) {
  return (
    <div className="bg-gradient-card border border-border rounded-2xl p-5 shadow-card relative overflow-hidden">
      <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: "currentColor" }} />
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] text-muted-foreground block uppercase tracking-wider">{label}</span>
          <span className="text-xl md:text-2xl font-extrabold flex items-center gap-1" id={id}>
            {value}
          </span>
          {extra && <span className="text-[10px] text-warning font-semibold">{extra}</span>}
        </div>
        <div className={`h-10 w-10 rounded-xl border grid place-items-center shrink-0 ${accentClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function KpiRow({ label, value, barWidth, color }: { label: string; value: string; barWidth: number; color: string }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-bold text-foreground">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full bg-${color} transition-all duration-700`}
          style={{
            width: `${Math.max(barWidth, 2)}%`,
            background: color === "neon" ? "hsl(var(--neon))"
              : color === "electric" ? "hsl(var(--electric))"
              : color === "warning" ? "hsl(var(--warning))"
              : "hsl(var(--primary))",
          }}
        />
      </div>
    </div>
  );
}
