import React, { useEffect } from "react";
import { Joyride, STATUS, ACTIONS, EVENTS, EventData } from "react-joyride";
import { useNavigate } from "@tanstack/react-router";
import { useTourStore } from "@/shared/hooks/useTourStore";

const steps = [
  {
    target: "#badge-engine-tour",
    title: "🏅 Insignias Deportivas",
    content: "Identidad Gamificada: Motor de insignias dinámico basado en habilidades y deportes.",
    disableBeacon: true,
    placement: "bottom" as const,
  },
  {
    target: "#news-feed-dropzone-tour",
    title: "🛡️ Moderación por Inteligencia Artificial",
    content:
      "Edge AI Moderation: Red neuronal TensorFlow.js en el cliente que bloquea contenido sensible con latencia cero.",
    disableBeacon: true,
    placement: "bottom" as const,
  },
  {
    target: "#tournament-hub-tour",
    title: "🏆 Torneos y Llaves Tácticas",
    content:
      "Motor Táctico: Generación de llaves eliminatorias y matchmaking posicional para escuadras de 5vs5 a 11vs11.",
    disableBeacon: true,
    placement: "top" as const,
  },
];

export function JuryTour() {
  const navigate = useNavigate();
  const { run, stepIndex, setRun, setStepIndex, startTour, stopTour } = useTourStore();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "true") {
      if (window.location.pathname !== "/app/profile") {
        navigate({ to: "/app/profile", search: { tour: "true" } });
        const timer = setTimeout(() => {
          startTour();
        }, 500);
        return () => clearTimeout(timer);
      } else {
        startTour();
      }
    }
  }, [navigate, startTour]);

  const handleJoyrideCallback = (data: EventData) => {
    const { action, index, status, type } = data;

    if (type === EVENTS.STEP_AFTER) {
      const isNext = action === ACTIONS.NEXT;
      const isPrev = action === ACTIONS.PREV;

      if (isNext) {
        if (index === 0) {
          setRun(false);
          navigate({ to: "/app/feed", search: { tour: "true" } });
          const timer = setTimeout(() => {
            setStepIndex(1);
            setRun(true);
          }, 450);
          return () => clearTimeout(timer);
        } else if (index === 1) {
          setRun(false);
          navigate({ to: "/app/tournaments", search: { tour: "true" } });
          const timer = setTimeout(() => {
            setStepIndex(2);
            setRun(true);
          }, 450);
          return () => clearTimeout(timer);
        } else if (index === 2) {
          stopTour();
        }
      } else if (isPrev) {
        if (index === 1) {
          setRun(false);
          navigate({ to: "/app/profile", search: { tour: "true" } });
          const timer = setTimeout(() => {
            setStepIndex(0);
            setRun(true);
          }, 450);
          return () => clearTimeout(timer);
        } else if (index === 2) {
          setRun(false);
          navigate({ to: "/app/feed", search: { tour: "true" } });
          const timer = setTimeout(() => {
            setStepIndex(1);
            setRun(true);
          }, 450);
          return () => clearTimeout(timer);
        }
      }
    } else if (
      status === STATUS.FINISHED ||
      status === STATUS.SKIPPED ||
      type === EVENTS.TOUR_END
    ) {
      stopTour();
      const url = new URL(window.location.href);
      url.searchParams.delete("tour");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous={true}
      onEvent={handleJoyrideCallback}
      locale={{
        back: "Atrás",
        close: "Cerrar",
        last: "Finalizar",
        next: "Siguiente",
        skip: "Saltar Tour",
      }}
      options={{
        primaryColor: "#ff5722",
        textColor: "#0f172a",
        backgroundColor: "#ffffff",
        arrowColor: "#ffffff",
        zIndex: 5000,
        showProgress: true,
        buttons: ["back", "close", "primary", "skip"],
      }}
      styles={{
        tooltip: {
          borderRadius: "16px",
          padding: "16px",
          textAlign: "left",
        },
        tooltipContainer: {
          textAlign: "left",
        },
        tooltipTitle: {
          fontWeight: "bold",
          fontSize: "15px",
          color: "#ff5722",
        },
        tooltipContent: {
          fontSize: "13px",
          padding: "10px 0",
          color: "#334155",
        },
        buttonPrimary: {
          backgroundColor: "#ff5722",
          borderRadius: "10px",
          fontSize: "12px",
          fontWeight: "bold",
          padding: "8px 16px",
          cursor: "pointer",
        },
        buttonBack: {
          color: "#64748b",
          fontSize: "12px",
          fontWeight: "bold",
          marginRight: "8px",
          cursor: "pointer",
        },
        buttonSkip: {
          color: "#94a3b8",
          fontSize: "11px",
          cursor: "pointer",
        },
      }}
    />
  );
}

export default JuryTour;
