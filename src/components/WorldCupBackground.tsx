// === BLOQUE: IMPORTACIONES ===
// Dependencia mínima: solo React para el renderizado del fondo decorativo
import React from "react";

// === BLOQUE: COMPONENTE DE FONDO AMBIENTAL ===
// Renderiza un fondo fijo con capas de brillo (glow), curvas SVG abstractas, puntos decorativos y acentos de esquina
// Diseñado para ser un backdrop estético no interactivo (pointer-events-none) que se adapta al tema claro/oscuro
export function WorldCupBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 bg-background transition-colors duration-300">
      {/* === BLOQUE: CAPAS DE BRILLO AMBIENTAL === */}
      {/* Brillo verde neón flotante en la esquina superior izquierda */}
      <div className="absolute top-1/4 -left-32 w-[500px] h-[500px] rounded-full bg-[#00e676]/3 dark:bg-[#00e676]/5 blur-[120px] animate-float" />
      {/* Brillo azul flotante inverso en la esquina inferior derecha */}
      <div className="absolute bottom-1/4 -right-32 w-[400px] h-[400px] rounded-full bg-[#3b82f6]/4 dark:bg-[#3b82f6]/6 blur-[100px] animate-float-reverse" />
      {/* Brillo central difuso para suavizar el centro de la pantalla */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-slate-500/3 blur-[150px]" />

      {/* === BLOQUE: CURVAS VECTORIALES DINÁMICAS === */}
      {/* SVG de fondo con paths Bezier que forman ondas abstractas, con opacidad reducida y desenfoque */}
      <svg
        className="absolute w-full h-full opacity-[0.2] dark:opacity-[0.3] blur-[80px]"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1440 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <rect width="100%" height="100%" fill="currentColor" className="text-background" />
        {/* Onda inferior grande de color slate */}
        <path
          d="M -100 300 C 400 150, 300 800, 900 500 C 1500 200, 1300 900, 1700 700 L 1700 1100 L -100 1100 Z"
          fill="rgba(15, 23, 42, 0.25)"
        />
        {/* Onda superior de color slate más oscuro */}
        <path
          d="M 200 -100 C 600 300, 500 -100, 1000 400 C 1500 900, 1200 200, 1800 300 L 1800 1100 L 200 1100 Z"
          fill="rgba(11, 19, 43, 0.2)"
        />
        {/* Trazo curvo verde neón decorativo */}
        <path
          d="M -200 750 C 350 550, 250 950, 850 700 C 1450 450, 1250 950, 1750 800"
          fill="none"
          stroke="rgba(57, 255, 20, 0.15)"
          strokeWidth="80"
          strokeLinecap="round"
        />
        {/* Trazo curvo azul decorativo complementario */}
        <path
          d="M 1200 -50 C 900 250, 1100 550, 600 700 C 300 800, 100 400, -100 600"
          fill="none"
          stroke="rgba(59, 130, 246, 0.1)"
          strokeWidth="60"
          strokeLinecap="round"
        />
      </svg>

      {/* === BLOQUE: PUNTOS DECORATIVOS FLOTANTES === */}
      {/* Patrón de puntos radiales verdes sutiles para texturizar el fondo */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage: "radial-gradient(circle, #39FF14 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* === BLOQUE: ACENTOS DE ESQUINA === */}
      {/* Bordes decorativos en las esquinas superior izquierda e inferior derecha */}
      <div className="absolute top-0 left-0 w-40 h-40 border-t-2 border-l-2 border-[#39FF14]/5 rounded-tl-3xl" />
      <div className="absolute bottom-0 right-0 w-40 h-40 border-b-2 border-r-2 border-[#39FF14]/5 rounded-br-3xl" />
    </div>
  );
}

export default WorldCupBackground;
