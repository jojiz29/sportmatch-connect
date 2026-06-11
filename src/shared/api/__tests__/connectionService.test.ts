import { beforeEach, describe, expect, it } from "vitest";
import {
  createPlayerConnection,
  getMutualPlayerConnections,
  getPlayerConnections,
} from "@/shared/api/connectionService";
import { useAuthStore } from "@/entities/user/useAuth";

describe("connection service demo persistence", () => {
  beforeEach(() => {
    localStorage.removeItem("sportmatch_demo_player_connections");
    useAuthStore.setState({ isDemoMode: true });
  });

  it("guarda una conexión y la recupera después", async () => {
    await createPlayerConnection({
      userId: "user-a",
      connectedUserId: "user-b",
      sport: "Tenis",
      compatibilityScore: 92,
    });

    const connections = await getPlayerConnections("user-a");

    expect(connections).toHaveLength(1);
    expect(connections[0]).toMatchObject({
      connected_user_id: "user-b",
      sport: "Tenis",
      compatibility_score: 92,
    });
  });

  it("evita duplicar al mismo jugador conectado", async () => {
    await createPlayerConnection({ userId: "user-a", connectedUserId: "user-b" });
    await createPlayerConnection({ userId: "user-a", connectedUserId: "user-b" });

    expect(await getPlayerConnections("user-a")).toHaveLength(1);
  });

  it("confirma match mutuo cuando ambos jugadores conectan", async () => {
    const first = await createPlayerConnection({
      userId: "user-a",
      connectedUserId: "user-b",
    });
    const second = await createPlayerConnection({
      userId: "user-b",
      connectedUserId: "user-a",
    });

    expect(first.isMutualMatch).toBe(false);
    expect(second.isMutualMatch).toBe(true);
    expect(await getMutualPlayerConnections("user-a")).toHaveLength(1);
    expect(await getMutualPlayerConnections("user-b")).toHaveLength(1);
  });
});
