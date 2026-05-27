# IoT Telemetry Standard

Telemetry data (Heart Rate, GPS, Pace) streams continuously and must NOT trigger global React re-renders.

## Zustand Approach

- **Store**: `src/features/iot/store.ts` manages the connection state and holds the `currentData` and a short `history` buffer (max 100 points).
- **Selectors**: Components MUST use shallow selectors when subscribing to the store to avoid unnecessary re-renders.

  ```typescript
  // CORRECT:
  const heartRate = useIoTStore((state) => state.currentData?.heartRate);

  // INCORRECT (Triggers re-render on any property change):
  const { currentData } = useIoTStore();
  ```

## Supabase Sync

We do NOT send every heartbeat to Supabase. The Zustand store should buffer the data locally and sync with Supabase (via `apiClient.telemetry.sync()`) only every 30 seconds or at the end of a session.
