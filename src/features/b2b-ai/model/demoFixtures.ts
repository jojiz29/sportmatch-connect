// ============================================================
// src/features/b2b-ai/model/demoFixtures.ts
// Respuestas realistas para los 3 endpoints B2B-AI en modo demo.
// Se usan cuando useAuthStore.isDemoMode === true, igual que el
// resto de features del proyecto (adsService.ts:192, businessService, etc.)
// ============================================================

import type { PricingRecommendation, AdsOptimization, ChurnPrediction } from "@/entities/types";

const DEMO_METADATA = {
  tokens: 312,
  model: "gemini-2.5-flash (demo)",
  latencyMs: 1450,
};

export const DEMO_PRICING: PricingRecommendation = {
  recommendedPrice: 62.5,
  baseline: 50,
  deltaPct: 0.25,
  occupancyRate: 0.85,
  confidence: 0.78,
  sampleSize: 24,
  bestHour: 19,
  drivers: [
    { feature: "Ocupación del slot", contribution: 9.5, value: 0.85, weight: 0.45 },
    { feature: "Hora pico (18-21h)", contribution: 4.2, value: 1, weight: 0.2 },
    { feature: "Fin de semana", contribution: 2.1, value: 1, weight: 0.15 },
    { feature: "Hora valle (8-11h)", contribution: 0, value: 0, weight: 0.1 },
    { feature: "Anticipación de reserva", contribution: -1.3, value: 0.4, weight: 0.1 },
  ],
  narrative:
    "Sube el precio del sábado a las 19h a S/ 62.50. La ocupación histórica del 85% y la hora pico justifican el incremento del 25% sobre el baseline.",
  metadata: DEMO_METADATA,
};

export const DEMO_ADS_OPTIMIZATION: AdsOptimization = {
  variants: [
    {
      variantId: "B",
      title: "¡Únete a la pichanga del sábado!",
      description: "Diversión garantizada con la comunidad más activa de pádel en Lima.",
      style: "emocional",
      score: 0.1366,
      predictedCtr: 0.092,
    },
    {
      variantId: "D",
      title: "¡Últimos 8 cupos para el Torneo Relámpago!",
      description: "Cierra inscripción este viernes. Premios garantizados para los ganadores.",
      style: "urgencia",
      score: 0.1287,
      predictedCtr: 0.0976,
    },
    {
      variantId: "C",
      title: "Torneo Pádel Intermedio - 8 cupos",
      description: "Sábados 19h, S/ 50 por jugador. Nivel intermedio, premios garantizados.",
      style: "racional",
      score: 0.0922,
      predictedCtr: 0.0864,
    },
    {
      variantId: "A",
      title: "Torneo Relámpago Pádel",
      description: "Inscríbete hoy en nuestro torneo relámpago categoría Intermedia.",
      style: "original",
      score: 0,
      predictedCtr: 0.08,
    },
  ],
  recommendation: "B",
  expectedLift: 0.012,
  currentCtr: 0.08,
  sampleSize: 450,
  drivers: [
    { feature: "Estilo de copy (emocional)", contribution: 0.04, value: 1, weight: 0.4 },
    { feature: "Lift sobre baseline", contribution: 0.025, value: 0.012, weight: 0.3 },
    { feature: "Objetivo ctr", contribution: 0.015, value: 1, weight: 0.15 },
    { feature: "Muestra acumulada", contribution: 0.02, value: 0.45, weight: 0.15 },
  ],
  narrative:
    "Cambia a la variante B con copy emocional. El CTR predicho sube de 8.0% a 9.2%, un lift de +1.2 puntos. El tono de comunidad/pasión funciona mejor con tu audiencia.",
  metadata: DEMO_METADATA,
};

export const DEMO_CHURN_PREDICTION: ChurnPrediction = {
  churnScore: 0.42,
  riskLevel: "medium",
  factors: [
    {
      name: "Engagement de usuarios bajo",
      description:
        "Solo 12 interacciones registradas en los últimos 30 días, debajo del mínimo esperado (30).",
      severity: 0.65,
      suggestedAction:
        "Revisa la imagen y copy del perfil comercial. Pedir reseñas a clientes recurrentes para mejorar la tasa de clics.",
    },
    {
      name: "Revenue acumulado bajo",
      description:
        "El revenue del período (S/ 280) está por debajo del umbral mínimo esperado (S/ 500).",
      severity: 0.55,
      suggestedAction:
        "Activar campañas de Ads Optimizer y considerar descuentos en horarios valle para atraer tráfico.",
    },
    {
      name: "Frecuencia de publicaciones",
      description: "Solo 2 anuncios activos cuando el mínimo recomendado es 3 por mes.",
      severity: 0.35,
      suggestedAction:
        "Crear 2-3 anuncios nuevos este mes, idealmente rotando formatos (torneos, descuentos, clases).",
    },
  ],
  daysSinceLastInteraction: 4,
  activeAdsCount: 2,
  totalRevenue: 280,
  totalEngagement: 12,
  drivers: [
    { feature: "Engagement de usuarios", contribution: 0.18, value: 0.65, weight: 0.15 },
    { feature: "Revenue (bookings)", contribution: 0.14, value: 0.55, weight: 0.2 },
    { feature: "Frecuencia de publicaciones", contribution: 0.07, value: 0.35, weight: 0.25 },
    {
      feature: "Recencia (días desde última actividad)",
      contribution: 0.03,
      value: 4,
      weight: 0.4,
    },
  ],
  narrative:
    "Contacta al cliente para activar el Ads Optimizer. El engagement de usuarios y el revenue están debajo del umbral mínimo, pero la recencia aún es saludable. Hay tiempo para revertir el churn.",
  metadata: DEMO_METADATA,
};
