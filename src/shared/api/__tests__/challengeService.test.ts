import { beforeEach, describe, expect, it } from "vitest";
import { useAuthStore } from "@/entities/user/useAuth";
import {
  createPlayerChallenge,
  getPendingChallengesReceived,
  getPendingChallengesSent,
  proposeChallengeChanges,
  respondToChallengeCounterProposal,
  respondToPlayerChallenge,
} from "@/shared/api/challengeService";

describe("challenge service demo persistence", () => {
  beforeEach(() => {
    localStorage.removeItem("sportmatch_demo_player_challenges");
    useAuthStore.setState({ isDemoMode: true });
  });

  it("persists a pending challenge and restores it", async () => {
    await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
      message: "¿Jugamos este sábado?",
    });

    const pending = await getPendingChallengesSent("user-a");

    expect(pending).toHaveLength(1);
    expect(pending[0]).toMatchObject({
      challenged_id: "user-b",
      sport: "Tenis",
      status: "pending",
    });
  });

  it("returns the existing challenge instead of creating a pending duplicate", async () => {
    const first = await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
    });
    const duplicate = await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
    });

    const pending = await getPendingChallengesSent("user-a");

    expect(duplicate.id).toBe(first.id);
    expect(pending).toHaveLength(1);
  });

  it("allows the challenged player to accept and removes the request from pending", async () => {
    const challenge = await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
    });

    const receivedBefore = await getPendingChallengesReceived("user-b");
    const accepted = await respondToPlayerChallenge(challenge.id, "user-b", "accepted");
    const receivedAfter = await getPendingChallengesReceived("user-b");

    expect(receivedBefore).toHaveLength(1);
    expect(accepted.status).toBe("accepted");
    expect(receivedAfter).toHaveLength(0);
  });

  it("does not allow another player to resolve the challenge", async () => {
    const challenge = await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
    });

    await expect(respondToPlayerChallenge(challenge.id, "user-c", "rejected")).rejects.toThrow(
      "El desafío ya no está disponible.",
    );
  });

  it("allows the receiver to propose changes and the creator to accept them", async () => {
    const challenge = await createPlayerChallenge({
      challengerId: "user-a",
      challengedId: "user-b",
      sport: "Tenis",
      scheduledDate: "2026-06-20",
      scheduledTime: "18:00",
    });

    const counterProposal = await proposeChallengeChanges({
      challengeId: challenge.id,
      challengedId: "user-b",
      scheduledDate: "2026-06-21",
      scheduledTime: "19:30",
      location: "Miraflores",
    });
    const accepted = await respondToChallengeCounterProposal(challenge.id, "user-a", "accepted");

    expect(counterProposal).toMatchObject({
      status: "counter_proposed",
      scheduled_date: "2026-06-21",
      scheduled_time: "19:30",
      location: "Miraflores",
    });
    expect(accepted.status).toBe("accepted");
  });
});
