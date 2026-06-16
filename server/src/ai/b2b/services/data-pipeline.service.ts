// ============================================================
// server/src/ai/b2b/services/data-pipeline.service.ts
// Agregaciones SQL para alimentar los modelos B2B-AI.
// Lee de: bookings, business_ads (via courts.owner_id), usage_metrics.
// Diseñado para queries baratas con select mínimos y agregaciones server-side.
// ============================================================

import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../../../prisma/prisma.service";

/**
 * Slot de 1 hora.alineado al formato time_slot usado en bookings.
 */
export interface HourOccupancy {
  hour: number;
  bookedSlots: number;
  totalSlots: number;
  occupancyRate: number;
}

/**
 * Métricas de anuncios de un negocio en los últimos N días.
 */
export interface AdMetricsSummary {
  totalAds: number;
  totalViews: number;
  totalClicks: number;
  totalContacts: number;
  ctr: number;
  contactRate: number;
  perAd: Array<{
    adId: string;
    title: string;
    views: number;
    clicks: number;
    contacts: number;
    ctr: number;
    lastInteractionAt: string | null;
  }>;
}

/**
 * Métricas de uso agregadas (de usage_metrics) por tipo.
 */
export interface UsageSummary {
  profileViews: number;
  adViews: number;
  adClicks: number;
  mapPinClicks: number;
  venueBookings: number;
  last30dByDay: Array<{ day: string; count: number }>;
}

@Injectable()
export class DataPipelineService {
  private readonly logger = new Logger(DataPipelineService.name);

  constructor(private prisma: PrismaService) {}

  // ============================================================
  // CANCHAS: VALIDEZ + BASELINE
  // ============================================================

  /**
   * Devuelve la cancha SOLO si pertenece al businessId.
   * Lanza 404 si no existe o no es del negocio. Usado como guard
   * de autorización a nivel de servicio (defense in depth).
   */
  async getCourtForBusiness(courtId: string, businessId: string) {
    const court = await this.prisma.courts.findFirst({
      where: { id: courtId, owner_id: businessId },
      select: {
        id: true,
        name: true,
        sport: true,
        price_per_hour: true,
        operating_hours: true,
        district: true,
      },
    });
    if (!court) {
      throw new Error(`Court ${courtId} not found or not owned by business ${businessId}`);
    }
    return court;
  }

  // ============================================================
  // BOOKINGS: OCUPACIÓN POR HORA
  // ============================================================

  /**
   * Calcula la ocupación histórica por hora del día en la cancha,
   * para los últimos `lookbackDays` días.
   * Devuelve 24 entradas (0..23) con totalSlots = lookbackDays (1 slot/hora/día
   * en la simplificación actual; refinable a futuro).
   */
  async getHourlyOccupancy(courtId: string, lookbackDays = 28): Promise<HourOccupancy[]> {
    const since = new Date();
    since.setDate(since.getDate() - lookbackDays);
    const sinceStr = since.toISOString().slice(0, 10);

    // El campo real en la BD es `time` (ver migración 20260529),
    // pero el Prisma client no lo refleja. Usamos $queryRaw para
    // mantener la query portable entre schema y DB real.
    const rows = await this.prisma.$queryRaw<Array<{ time: string }>>`
      SELECT time
      FROM bookings
      WHERE court_id = ${courtId}::uuid
        AND date >= ${sinceStr}
    `;

    // Construye el array 0..23 contando slots por hora.
    const bookedByHour = new Array<number>(24).fill(0);
    for (const b of rows) {
      const hour = this.extractHourFromTimeSlot(b.time);
      if (hour >= 0 && hour < 24) {
        bookedByHour[hour]++;
      }
    }

    return bookedByHour.map((bookedSlots, hour) => {
      const totalSlots = lookbackDays;
      return {
        hour,
        bookedSlots,
        totalSlots,
        occupancyRate: totalSlots > 0 ? bookedSlots / totalSlots : 0,
      };
    });
  }

  /**
   * Extrae la hora de un time_slot con formatos flexibles:
   *   "19:00"           -> 19
   *   "19:00-20:00"     -> 19
   *   "19:00:00"        -> 19
   * Devuelve -1 si no puede parsear.
   */
  private extractHourFromTimeSlot(timeSlot: string): number {
    if (!timeSlot) return -1;
    const match = timeSlot.match(/^(\d{1,2})/);
    if (!match) return -1;
    const h = parseInt(match[1], 10);
    return h >= 0 && h < 24 ? h : -1;
  }

  // ============================================================
  // ADS: MÉTRICAS AGREGADAS POR NEGOCIO
  // ============================================================

  /**
   * Resumen de anuncios del business para alimentar el Ad Optimizer.
   * Lee de business_ads via... ojo: business_ads no está en el schema.prisma
   * actual (es una tabla Supabase gestionada via PostgREST, no Prisma).
   * Para mantener la coherencia con el resto del backend, hacemos la query
   * via Prisma raw como fallback. Si la tabla no existe en Prisma,
   * PrismaService.raw() devolverá un error silencioso que manejamos con try/catch.
   */
  async getAdMetricsForBusiness(businessId: string): Promise<AdMetricsSummary> {
    const empty: AdMetricsSummary = {
      totalAds: 0,
      totalViews: 0,
      totalClicks: 0,
      totalContacts: 0,
      ctr: 0,
      contactRate: 0,
      perAd: [],
    };

    // La tabla business_ads se gestiona via Supabase (RLS), no Prisma.
    // El tracking se hace via RPC increment_ad_metric. Para que el
    // pricing/ads-optimizer funcionen sin acceso directo, agregamos
    // un fallback: si la query falla, devolvemos empty y dejamos que
    // el engine use el sample_size = 0 con confidence = 0.3.
    try {
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          views: number | null;
          clicks: number | null;
          contacts: number | null;
          created_at: Date;
        }>
      >`
        SELECT id, title, views, clicks, contacts, created_at
        FROM business_ads
        WHERE business_id = ${businessId}::uuid
        ORDER BY created_at DESC
        LIMIT 50
      `;

      if (!rows || rows.length === 0) return empty;

      const perAd = rows.map((r: {
        id: string;
        title: string;
        views: number | null;
        clicks: number | null;
        contacts: number | null;
        created_at: Date;
      }) => {
        const views = Number(r.views) || 0;
        const clicks = Number(r.clicks) || 0;
        const contacts = Number(r.contacts) || 0;
        return {
          adId: r.id,
          title: r.title,
          views,
          clicks,
          contacts,
          ctr: views > 0 ? clicks / views : 0,
          lastInteractionAt: r.created_at ? r.created_at.toISOString() : null,
        };
      });

      const totalViews = perAd.reduce<number>((s, a) => s + a.views, 0);
      const totalClicks = perAd.reduce<number>((s, a) => s + a.clicks, 0);
      const totalContacts = perAd.reduce<number>((s, a) => s + a.contacts, 0);

      return {
        totalAds: perAd.length,
        totalViews,
        totalClicks,
        totalContacts,
        ctr: totalViews > 0 ? totalClicks / totalViews : 0,
        contactRate: totalClicks > 0 ? totalContacts / totalClicks : 0,
        perAd,
      };
    } catch (err) {
      this.logger.warn(
        `business_ads query failed (esperado si la tabla aún no está en Prisma): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return empty;
    }
  }

  // ============================================================
  // USAGE METRICS: ENGAGEMENT DEL NEGOCIO
  // ============================================================

  /**
   * Resumen de usage_metrics del business. La tabla usage_metrics es nueva
   * (migración 20260616) y se accede via $queryRaw hasta que se agregue
   * a schema.prisma en una migración posterior.
   */
  async getUsageSummary(businessId: string, lookbackDays = 30): Promise<UsageSummary> {
    const empty: UsageSummary = {
      profileViews: 0,
      adViews: 0,
      adClicks: 0,
      mapPinClicks: 0,
      venueBookings: 0,
      last30dByDay: [],
    };

    try {
      const since = new Date();
      since.setDate(since.getDate() - lookbackDays);

      const rows = await this.prisma.$queryRaw<
        Array<{ metric_type: string; total: bigint | number; day_bucket: Date }>
      >`
        SELECT metric_type::text AS metric_type,
               SUM(value)::bigint AS total,
               day_bucket
        FROM usage_metrics
        WHERE business_id = ${businessId}::uuid
          AND recorded_at >= ${since}::timestamptz
        GROUP BY metric_type, day_bucket
        ORDER BY day_bucket ASC
      `;

      if (!rows || rows.length === 0) return empty;

      const totals: Record<string, number> = {};
      const byDay = new Map<string, number>();

      for (const r of rows) {
        const v = Number(r.total) || 0;
        totals[r.metric_type] = (totals[r.metric_type] || 0) + v;
        const dayKey = r.day_bucket.toISOString().slice(0, 10);
        byDay.set(dayKey, (byDay.get(dayKey) || 0) + v);
      }

      return {
        profileViews: totals["profile_view"] || 0,
        adViews: totals["ad_view"] || 0,
        adClicks: totals["ad_click"] || 0,
        mapPinClicks: totals["map_pin_click"] || 0,
        venueBookings: totals["venue_booking"] || 0,
        last30dByDay: Array.from(byDay.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([day, count]) => ({ day, count })),
      };
    } catch (err) {
      this.logger.warn(
        `usage_metrics query failed (esperado si la migración aún no se aplicó): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
      return empty;
    }
  }
}
