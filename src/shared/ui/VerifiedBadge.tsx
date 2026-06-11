import { Check } from "lucide-react";

export interface VerifiedBadgeProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function VerifiedBadge({ className = "", size = "sm" }: VerifiedBadgeProps) {
  const sizeClasses = {
    sm: "h-3.5 w-3.5",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-blue-500 text-white shrink-0 ml-1.5 shadow-[0_0_8px_rgba(59,130,246,0.5)] ${sizeClasses[size]} ${className}`}
      title="Cuenta Verificada"
    >
      <Check className="h-[65%] w-[65%] stroke-[4]" />
    </span>
  );
}
