import { motion, AnimatePresence } from "framer-motion";
import { Bot, X } from "lucide-react";
import { ChatInterface } from "./ChatInterface";
import { useAiAssistantStore } from "../model/useAiAssistantStore";

export function AIAvatarButton() {
  // Suscripción al store: visibilidad y acción de toggle
  const isOpen = useAiAssistantStore((s) => s.isOpen);
  const toggleChat = useAiAssistantStore((s) => s.toggleChat);
  const closeChat = useAiAssistantStore((s) => s.closeChat);

  return (
    <>
      {/* Botón flotante del avatar — usa gradiente y ring del tema activo */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        aria-label={isOpen ? "Cerrar asistente deportivo" : "Abrir asistente deportivo Sporty"}
        aria-expanded={isOpen}
        aria-controls="sporty-chat-window"
        className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-[1050] h-14 w-14 md:h-16 md:w-16 rounded-full bg-gradient-primary shadow-glow border border-primary/40 grid place-items-center cursor-pointer group"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X className="h-6 w-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <motion.div
              key="bot"
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="relative"
            >
              <Bot className="h-7 w-7 md:h-8 md:w-8 text-primary-foreground drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]" />
              <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-success border-2 border-primary animate-pulse" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Anillo de pulso temático */}
        <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-75 pointer-events-none" />
      </motion.button>

      {/* Ventana de chat */}
      <ChatInterface isOpen={isOpen} onClose={closeChat} />
    </>
  );
}
