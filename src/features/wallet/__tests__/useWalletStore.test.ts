/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWalletStore } from "../useWalletStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { supabase } from "@/shared/api/supabase";

vi.mock("@/shared/api/supabase", () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn(),
  },
}));

vi.mock("@/shared/api/apiClient", () => ({
  apiClient: {
    wallet: {
      getBalance: vi.fn(),
      getTransactions: vi.fn(),
      updateBalance: vi.fn(),
      saveTransaction: vi.fn(),
    },
  },
}));

describe("useWalletStore - Challenges & Real Mode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({
      user: {
        id: "user-123",
        created_at: "",
        name: "Edwin",
        age: 25,
        city: "Lima",
        avatar_url: "",
        bio: "",
        trust_score: 95,
        fitcoins_balance: 100,
        level: "Elite",
        preferred_sports: [],
        matches_played: 1,
        followers_count: 2,
        last_location_lat: 0,
        last_location_lng: 0,
      },
      isDemoMode: false,
    });
  });

  it("debe progresar un reto y reclamarlo si se completa", async () => {
    useWalletStore.setState({
      balance: 100,
      transactions: [], // Initialize transactions to avoid "TypeError: state.transactions is not iterable"
      challenges: [
        { id: "ch1", name: "Challenge 1", progress: 0, total: 2, reward: 50, claimed: false },
      ],
    });

    useAuthStore.setState({ isDemoMode: true });

    // Progress 1/2
    await useWalletStore.getState().progressChallenge("ch1");
    let state = useWalletStore.getState();
    expect(state.challenges[0].progress).toBe(1);
    expect(state.challenges[0].claimed).toBe(false);
    expect(state.balance).toBe(100);

    // Progress 2/2 -> auto claims in demo mode
    await useWalletStore.getState().progressChallenge("ch1");
    state = useWalletStore.getState();
    expect(state.challenges[0].progress).toBe(2);
    expect(state.challenges[0].claimed).toBe(true);
    expect(state.balance).toBe(150);
  });

  it("debe soportar la reclamación de retos en modo real persistiendo en Supabase", async () => {
    useWalletStore.setState({
      balance: 100,
      transactions: [], // Initialize transactions
      challenges: [
        { id: "ch2", name: "Challenge 2", progress: 1, total: 1, reward: 80, claimed: false },
      ],
    });

    const mockInsertedTx = {
      id: "real-tx-1",
      user_id: "user-123",
      amount: 80,
      description: "Reto",
      type: "EARN",
    };
    vi.mocked((supabase as any).single).mockResolvedValue({
      data: mockInsertedTx,
      error: null,
    } as any);

    await useWalletStore.getState().claimChallenge("ch2");

    const state = useWalletStore.getState();
    expect(state.balance).toBe(180);
    expect(state.challenges[0].claimed).toBe(true);
    expect(state.transactions[0]).toEqual(mockInsertedTx);
  });

  it("debe revertir el estado (rollback) en modo real si falla la base de datos al reclamar reto", async () => {
    const originalChallenges = [
      { id: "ch2", name: "Challenge 2", progress: 1, total: 1, reward: 80, claimed: false },
    ];
    useWalletStore.setState({
      balance: 100,
      transactions: [],
      challenges: originalChallenges,
    });

    vi.mocked((supabase as any).single).mockResolvedValue({
      data: null,
      error: { message: "DB Connection Failed" },
    } as any);

    await useWalletStore.getState().claimChallenge("ch2");

    // Revertido a original
    const state = useWalletStore.getState();
    expect(state.balance).toBe(100);
    expect(state.challenges[0].claimed).toBe(false);
  });
});
