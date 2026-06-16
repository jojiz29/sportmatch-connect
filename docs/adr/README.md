# Architecture Decision Records (ADR)

Este directorio contiene las **Architecture Decision Records** del proyecto
SportMatch Connect. Cada ADR documenta una decisión técnica importante, su
contexto, alternativas consideradas y consecuencias.

## Formato

Seguimos el formato clásico de Michael Nygard ([adr.github.io](https://adr.github.io/)):

1. **Título** — frase corta, sustantiva.
2. **Estado** — Propuesta | Aceptada | Deprecada | Sustituida.
3. **Fecha** — de la decisión.
4. **Contexto** — el problema y las fuerzas en juego.
5. **Decisión** — la opción elegida.
6. **Consecuencias** — positivas y negativas.
7. **Alternativas consideradas** — y por qué se descartaron.

## Índice

| ID                                         | Título                                          | Estado   | Fecha       | Tag            |
| ------------------------------------------ | ----------------------------------------------- | -------- | ----------- | -------------- |
| [ADR-001](ADR-001-database-persistence.md) | PostgreSQL/Supabase como persistencia principal | Aceptada | 16-jun-2026 | v3.6.0-adr-001 |

## Cómo crear una nueva ADR

1. Copia la plantilla: `cp ADR-000-template.md ADR-002-mi-decision.md` (plantilla a crear).
2. Numera correlativamente. **Nunca** reutilices un número.
3. Cambia el estado a "Aceptada" solo cuando el código en `main` refleje la decisión.
4. Añade la entrada a este índice.
5. Si una ADR sustituye a otra anterior, márcala como "Sustituida por ADR-NNN".

## Cuándo escribir una ADR

Escribe una ADR cuando la decisión:

- Es **arquitectónica** (no una decisión de detalle, ej. indentación).
- Es **difícil de revertir** (ej. elegir DB, framework, hosting, protocolo).
- Tiene **alternativas razonables** que se consideraron en serio.
- Afecta a **más de un componente** del sistema.

**No** escribas una ADR para:

- Decisiones triviales (nombres de variables, formato de código).
- Decisiones que se revierten en horas (cambiar de librería pequeña).
- Workarounds temporales (usa `docs/reports/`).

## Referencias

- [Documentación ADR de GitHub](https://adr.github.io/)
- [Plantilla de Michael Nygard](https://github.com/joelparkerhenderson/architecture_decision_records)
