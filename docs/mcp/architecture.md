# FSD Architecture in SportMatch

This project strictly follows Feature-Sliced Design (FSD).

## Layers

1. **app/**: Global app setup, routing context, providers (QueryClient).
2. **pages/**: Route-level components. They should only compose features and widgets, avoiding direct business logic.
3. **features/**: User interactions and business logic (e.g. `matchmaking/`, `wallet/`).
4. **entities/**: Domain logic and strict TypeScript types (`types.ts`). Reflects Supabase schema 1:1.
5. **shared/**: Reusable UI components, generic hooks, and the `apiClient`.

## Constraints

- A layer can only import from layers below it.
- Features cannot import other features directly (use shared or pages to compose).
- NO `any` types allowed.
- Mocks must use the exact same shapes as Supabase data.
