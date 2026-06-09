import React from "react";

export function WorldCupBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B132B]">
      {/* Ambient glow layers */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-[#39FF14]/5 blur-[120px] animate-float" />
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[#FF6B35]/8 blur-[100px] animate-float-reverse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#7C3AED]/5 blur-[150px]" />

      {/* Dynamic Vector Curves */}
      <svg
        className="absolute w-full h-full opacity-[0.3] blur-[80px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="100%" height="100%" fill="#0B132B" />

        <path
          d="M -100 300 C 400 150, 300 800, 900 500 C 1500 200, 1300 900, 1700 700 L 1700 1100 L -100 1100 Z"
          fill="rgba(61, 27, 93, 0.6)"
        />

        <path
          d="M 200 -100 C 600 300, 500 -100, 1000 400 C 1500 900, 1200 200, 1800 300 L 1800 1100 L 200 1100 Z"
          fill="rgba(217, 4, 41, 0.35)"
        />

        <path
          d="M -200 750 C 350 550, 250 950, 850 700 C 1450 450, 1250 950, 1750 800"
          fill="none"
          stroke="rgba(57, 255, 20, 0.45)"
          strokeWidth="80"
          strokeLinecap="round"
        />

        <path
          d="M 1200 -50 C 900 250, 1100 550, 600 700 C 300 800, 100 400, -100 600"
          fill="none"
          stroke="rgba(255, 107, 53, 0.2)"
          strokeWidth="60"
          strokeLinecap="round"
        />
      </svg>

      {/* Decorative floating dots */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: "radial-gradient(circle, #39FF14 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Corner accents */}
      <div className="absolute top-0 left-0 w-40 h-40 border-t-2 border-l-2 border-[#39FF14]/10 rounded-tl-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 border-b-2 border-r-2 border-[#FF6B35]/10 rounded-br-3xl" />
    </div>
  );
}

export default WorldCupBackground;
