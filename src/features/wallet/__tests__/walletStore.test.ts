import { describe, it, expect, vi, beforeEach } from "vitest";
import { useWalletStore } from "../useWalletStore";
import { useAuthStore } from "@/entities/user/useAuth";
import { apiClient } from "@/shared/api/apiClient";

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

describe("useWalletStore Zustand Store", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with structurally sound initial states", () => {
    const state = useWalletStore.getState();
    expect(state.balance).toBeTypeOf("number");
    expect(Array.isArray(state.transactions)).toBe(true);
    expect(Array.isArray(state.challenges)).toBe(true);
  });

  it("should handle simulated API failures gracefully on initWallet", async () => {
    // Set a mock user
    useAuthStore.setState({
      user: {
        id: "test-user-id",
        created_at: "",
        name: "Test User",
        age: 20,
        city: "Lima",
        avatar_url: "",
        bio: "",
        trust_score: 95,
        fitcoins_balance: 500, // Fallback balance
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 2,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    // Mock API to throw an error
    vi.mocked(apiClient.wallet.getBalance).mockRejectedValue(new Error("API Connection Failed"));
    vi.mocked(apiClient.wallet.getTransactions).mockRejectedValue(
      new Error("API Connection Failed"),
    );

    // Attempt initWallet
    await expect(useWalletStore.getState().initWallet()).resolves.not.toThrow();

    // Verify it fell back to user's fitcoins_balance
    expect(useWalletStore.getState().balance).toBe(500);
  });

  it("should correctly perform balance deductions on redeem in mock/demo mode", async () => {
    useAuthStore.setState({
      isDemoMode: true,
      user: {
        id: "test-user-id",
        created_at: "",
        name: "Test User",
        age: 20,
        city: "Lima",
        avatar_url: "",
        bio: "",
        trust_score: 95,
        fitcoins_balance: 1000,
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 2,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    useWalletStore.setState({ balance: 1000, transactions: [] });

    // Redeem cost 300 FitCoins
    const success = await useWalletStore.getState().redeem(300, "Canje: Bebida Gatorade");
    expect(success).toBe(true);

    // Balance should be 700
    expect(useWalletStore.getState().balance).toBe(700);
    expect(useWalletStore.getState().transactions.length).toBe(1);
    expect(useWalletStore.getState().transactions[0].amount).toBe(-300);
    expect(useWalletStore.getState().transactions[0].type).toBe("SPEND");
  });

  it("should reject redeem if balance is insufficient", async () => {
    useAuthStore.setState({
      isDemoMode: true,
      user: {
        id: "test-user-id",
        created_at: "",
        name: "Test User",
        age: 20,
        city: "Lima",
        avatar_url: "",
        bio: "",
        trust_score: 95,
        fitcoins_balance: 100,
        level: "Intermedio",
        preferred_sports: [],
        matches_played: 2,
        last_location_lat: 0,
        last_location_lng: 0,
      },
    });

    useWalletStore.setState({ balance: 100 });

    // Try to redeem cost 200
    const success = await useWalletStore.getState().redeem(200, "Canje: Polo Oficial");
    expect(success).toBe(false);
    expect(useWalletStore.getState().balance).toBe(100);
  });
});
