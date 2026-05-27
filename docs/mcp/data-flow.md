# Data Flow & Persistence

We use a dual-mode data layer: `MOCKS` or `SUPABASE`.

## The Cycle

1. **Component**: A component in `pages/` calls a custom hook from `features/` (e.g. `useWallet()`).
2. **Feature Hook**: The hook uses `@tanstack/react-query` to fetch or mutate data.
3. **API Client**: The queryFn points to `src/shared/api/apiClient.ts`.
4. **Resolution**: `apiClient` checks `import.meta.env.VITE_USE_MOCKS`.
   - If `true`: Resolves using `src/lib/mock.ts`.
   - If `false`: Uses `src/shared/api/supabase.ts` to call the PostgreSQL backend.

## Optimistic Updates

Crucial for `features/matchmaking/` and `features/wallet/`. We mutate the TanStack cache _before_ the server responds to guarantee a snappy 60fps UI. If the server fails, we rollback using the context returned by `onMutate`.
