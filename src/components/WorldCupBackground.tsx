import React from "react";

export function WorldCupBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-[#0B132B]">
      {/* Dynamic World Cup 2026 Overlapping Vector Curves & Glows */}
      <svg
        className="absolute w-full h-full opacity-[0.38] blur-[100px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        {/* Deep Night Blue base canvas layer (handled by container but defined here for richness) */}
        <rect width="100%" height="100%" fill="#0B132B" />

        {/* Deep Purple Fluid Vector Path */}
        <path
          d="M -100 300 
             C 400 150, 300 800, 900 500 
             C 1500 200, 1300 900, 1700 700 
             L 1700 1100 L -100 1100 Z"
          fill="rgba(61, 27, 93, 0.75)"
        />

        {/* Vivid Red Fluid Vector Path */}
        <path
          d="M 200 -100 
             C 600 300, 500 -100, 1000 400 
             C 1500 900, 1200 200, 1800 300 
             L 1800 1100 L 200 1100 Z"
          fill="rgba(217, 4, 41, 0.45)"
        />

        {/* Neon Green / Lime Fluid Path (Stroke Accent) */}
        <path
          d="M -200 750 
             C 350 550, 250 950, 850 700 
             C 1450 450, 1250 950, 1750 800"
          fill="none"
          stroke="rgba(57, 255, 20, 0.55)"
          strokeWidth="80"
          strokeLinecap="round"
        />

        {/* Electric Orange Accent Path */}
        <path
          d="M 1200 -50 
             C 900 250, 1100 550, 600 700 
             C 300 800, 100 400, -100 600"
          fill="none"
          stroke="rgba(255, 107, 53, 0.25)"
          strokeWidth="60"
          strokeLinecap="round"
        />
      </svg>
      {/* Fine SVG grid overlay for modern tech aesthetic */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: "radial-gradient(circle, #ffffff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
    </div>
  );
}

export default WorldCupBackground;
