/**
 * ===================================================================
 * ARCHIVO: src/features/ai-security/index.ts
 * PROPÓSITO: Punto de entrada público (Public API) del módulo de
 *            Seguridad Avanzada con IA.
 * 
 * ESTRUCTURA DEL MÓDULO (Feature-Sliced Design):
 * - /types: Interfaces TypeScript del contrato de seguridad (types/index.ts).
 * - /services: Servicios de conexión con la API NestJS (services/aiSecurityService.ts).
 * - /components: Elementos visuales reutilizables de seguridad (futuro).
 * - /hooks: React hooks personalizados para control de bloqueos (futuro).
 * - /utils: Funciones auxiliares locales del feature (futuro).
 * 
 * Regla FSD: Solo se importan elementos a través de este archivo index.ts.
 * ===================================================================
 */

// Exportar tipos
export * from "./types";

// Exportar servicios
export { aiSecurityService } from "./services/aiSecurityService";
