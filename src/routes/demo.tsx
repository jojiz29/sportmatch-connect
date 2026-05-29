import { createFileRoute, redirect } from "@tanstack/react-router";
import { useAuthStore } from "@/entities/user/useAuth";
import { User } from "@/entities/types";

export const Route = createFileRoute("/demo")({
  beforeLoad: () => {
    // 1. Enable Demo Mode
    useAuthStore.setState({ isDemoMode: true });

    // 2. Log in simulated demo user profile
    const demoUser: User = {
      id: "demo-user-id",
      created_at: new Date().toISOString(),
      name: "Edwin (Demo)",
      age: 26,
      city: "Surco, Lima",
      avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=EdwinDemo",
      bio: "Jugador de Pádel nivel intermedio en modo demostración.",
      trust_score: 95,
      fitcoins_balance: 1500,
      level: "Intermedio",
      preferred_sports: ["Pádel", "Tenis"],
      matches_played: 12,
      last_location_lat: -12.14,
      last_location_lng: -76.995,
    };
    useAuthStore.getState().login(demoUser);

    // 3. Programmatically redirect to dashboard
    throw redirect({ to: "/app" });
  },
  component: () => null,
});
