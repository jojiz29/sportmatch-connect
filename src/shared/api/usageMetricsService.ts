// ============================================================
// src/shared/api/usageMetricsService.ts
// Servicio de tracking de usage_metrics para B2B-AI.
// Espejo del enum b2b_metric_type definido en la migración 20260616.
//
// Modo dual:
//   - Demo (useAuthStore.isDemoMode): persiste en localStorage
//   - Real: insert via RPC `track_b2b_metric` (Supabase PostgREST)
//
// El endpoint de la RPC devuelve void, así que el cliente no obtiene
// el id del row — está bien porque solo nos importa el evento.
// ============================================================

import { supabase } from "./supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import type { UsageMetric, UsageMetricType } from "@/entities/types";

// ============================================================
// DEMO MODE: localStorage
// ============================================================

const STORAGE_KEY = "sportmatch_demo_usage_metrics";

function getDemoMetrics(): UsageMetric[] {
  if (typeof window === "undefined") return [];
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    const seed: UsageMetric[] = [
      {
        id: "metric-seed-1",
        business_id: "user-puka-power",
        metric_type: "profile_view",
        value: 1,
        recorded_at: new Date().toISOString(),
      },
    ];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
    return seed;
  }
  try {
    return JSON.parse(stored) as UsageMetric[];
  } catch {
    return [];
  }
}

function saveDemoMetrics(metrics: UsageMetric[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(metrics));
}

// ============================================================
// SERVICIO EXPORTADO
// ============================================================

export const usageMetricsService = {
  /**
   * Registra un evento de uso para un business.
   * Fire-and-forget: no bloquea UI; el error se loguea pero no se propaga.
   */
  async track(businessId: string, metricType: UsageMetricType, value = 1): Promise<void> {
    // Demo mode
    if (useAuthStore.getState().isDemoMode) {
      const metrics = getDemoMetrics();
      metrics.push({
        id: `metric-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        business_id: businessId,
        metric_type: metricType,
        value,
        recorded_at: new Date().toISOString(),
      });
      saveDemoMetrics(metrics);
      return;
    }

    // Real mode: usa la RPC de Supabase (server-side insert, RLS-secured)
    try {
      const { error } = await supabase.rpc("track_b2b_metric", {
        p_business_id: businessId,
        p_metric_type: metricType,
        p_value: value,
      });

      if (error) {
        if (import.meta.env.DEV) {
          console.error(`[usageMetrics] track(${metricType}) failed:`, error);
        }
        // No propagamos el error: el tracking nunca debe romper la UI
      }
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error("[usageMetrics] RPC error:", err);
      }
    }
  },

  /**
   * Obtiene métricas recientes de un business.
   * Usado por dashboards y debug. En modo demo filtra por businessId.
   */
  async getRecent(businessId: string, limit = 50): Promise<UsageMetric[]> {
    if (useAuthStore.getState().isDemoMode) {
      const all = getDemoMetrics();
      return all
        .filter((m) => m.business_id === businessId)
        .sort((a, b) => b.recorded_at.localeCompare(a.recorded_at))
        .slice(0, limit);
    }

    try {
      const { data, error } = await supabase
        .from("usage_metrics")
        .select("*")
        .eq("business_id", businessId)
        .order("recorded_at", { ascending: false })
        .limit(limit);

      if (error) {
        if (import.meta.env.DEV) console.error("[usageMetrics] getRecent failed:", error);
        return [];
      }
      return (data || []) as UsageMetric[];
    } catch (err) {
      if (import.meta.env.DEV) console.error("[usageMetrics] getRecent error:", err);
      return [];
    }
  },

  /**
   * Suma de métricas agrupadas por tipo para un business.
   * Útil para resúmenes rápidos.
   */
  async getSummary(businessId: string): Promise<Record<UsageMetricType, number>> {
    const empty: Record<UsageMetricType, number> = {
      profile_view: 0,
      ad_view: 0,
      ad_click: 0,
      ad_contact: 0,
      map_pin_click: 0,
      venue_booking: 0,
    };

    const recent = await this.getRecent(businessId, 500);
    for (const m of recent) {
      empty[m.metric_type] = (empty[m.metric_type] || 0) + m.value;
    }
    return empty;
  },
};
