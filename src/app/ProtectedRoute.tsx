import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/entities/user/useAuth";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" });
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null; // Prevenir el render mientras redirige

  return <>{children}</>;
}
