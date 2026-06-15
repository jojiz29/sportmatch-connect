import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { Send, Bot, User, Zap, Loader2, AlertTriangle, Sparkles } from "lucide-react";
import { useAiAssistantStore } from "../model/useAiAssistantStore";
import { VoiceControl } from "@/features/voice/ui/VoiceControl";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

// SCRUM-345 — Quick prompts en los 3 idiomas soportados. NO son
// respuestas hardcoded: son sugerencias de UI que el usuario puede
// clickear para iniciar conversación. Cada prompt se envía al LLM
// real de Vertex AI cuando se hace click.
const QUICK_PROMPTS: Record<"es" | "en" | "pt", string[]> = {
  es: [
    "¿Qué canchas hay cerca de mí?",
    "Busco un partido de fútbol 7 para esta semana",
    "¿Cómo funciona el sistema de FitCoins?",
    "Cuéntame sobre la racha semanal",
  ],
  en: [
    "What courts are near me?",
    "I'm looking for a 7-a-side football match this week",
    "How do FitCoins work?",
    "Tell me about the weekly streak",
  ],
  pt: [
    "Quais quadras estão perto de mim?",
    "Procuro uma partida de futebol 7 esta semana",
    "Como funcionam os FitCoins?",
    "Conte-me sobre a sequência semanal",
  ],
};

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  // SCRUM-345 — i18n para textos estáticos de la UI
  const { t } = useTranslation();
  // Suscripción al store (estado de dominio)
  const messages = useAiAssistantStore((s) => s.messages);
  const isTyping = useAiAssistantStore((s) => s.isTyping);
  const sendMessage = useAiAssistantStore((s) => s.sendMessage);
  const loadWelcome = useAiAssistantStore((s) => s.loadWelcome);
  const language = useAiAssistantStore((s) => s.language);
  const quickPrompts = QUICK_PROMPTS[language] ?? QUICK_PROMPTS.es;

  // Estado puramente transitorio de UI (no merece vivir en el store)
  const [input, setInput] = useState("");
  // SCRUM-345 — Para activar TTS del último mensaje del asistente
  const [lastAssistantMsg, setLastAssistantMsg] = useState<{ text: string; id: string } | null>(
    null,
  );
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    // Detectar último mensaje del asistente para TTS
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === "assistant" && lastMsg.id !== lastAssistantMsg?.id) {
      setLastAssistantMsg({ text: lastMsg.text, id: lastMsg.id });
    }
  }, [messages, isTyping, lastAssistantMsg]);

  // SCRUM-345 — Cuando el chat se abre por primera vez, pedir al LLM
  // (Vertex AI) el primer mensaje de bienvenida dinámico. NO quemamos
  // texto en el JSX: el LLM lo genera en el idioma activo del usuario.
  useEffect(() => {
    if (isOpen) {
      void loadWelcome();
    }
  }, [isOpen, loadWelcome]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    // Action Parsing: detectar intents de voz/texto para ejecutar acciones
    if (tryExecuteAction(text)) return;
    await sendMessage(text);
  };

  // SCRUM-37 / FASE 2C — Action Parsing desde chat
  // Detecta intents del usuario y ejecuta acciones sin pasar por el LLM
  function tryExecuteAction(text: string): boolean {
    const lower = text.toLowerCase();
    // Intentar "reservar" + deporte
    if (lower.includes("reservar") || lower.includes("reserva")) {
      // Navegar al mapa de canchas
      window.location.href =
        "/app/map?intent=book&sport=" + encodeURIComponent(extractSport(lower));
      return true;
    }
    if (lower.includes("buscar canchas") || lower.includes("ver canchas")) {
      window.location.href = "/app/map";
      return true;
    }
    if (lower.includes("ver mi racha") || lower.includes("mi actividad")) {
      window.location.href = "/app/iot";
      return true;
    }
    if (lower.includes("abrir chat") || lower.includes("nuevo chat")) {
      window.location.href = "/app/chat";
      return true;
    }
    return false;
  }

  function extractSport(text: string): string {
    const sports: Array<[string, string]> = [
      ["futbol", "Fútbol"],
      ["padel", "Pádel"],
      ["tenis", "Tenis"],
      ["voley", "Vóley"],
      ["basquet", "Básquet"],
      ["basket", "Básquet"],
      ["tenis de mesa", "Tenis de Mesa"],
      ["natacion", "Natación"],
    ];
    for (const [key, value] of sports) {
      if (text.includes(key)) return value;
    }
    return "Fútbol";
  }

  const handleVoiceTranscript = (text: string) => {
    setInput(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 28 }}
          id="sporty-chat-window"
          role="dialog"
          aria-modal="false"
          aria-labelledby="sporty-chat-title"
          className="fixed bottom-24 right-4 md:bottom-28 md:right-6 z-[1050] w-[calc(100vw-2rem)] max-w-[400px] h-[480px] md:h-[540px] flex flex-col rounded-2xl border border-chat-border bg-[color:var(--color-chat-surface)] backdrop-blur-xl shadow-glow overflow-hidden"
        >
          {/* Header temático */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-chat-border bg-[color:var(--color-chat-header-bg)] shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                <Bot className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <div>
                <span
                  id="sporty-chat-title"
                  className="text-sm font-bold text-chat-surface-foreground tracking-tight"
                >
                  Sporty
                </span>
                <span className="text-[10px] text-success block leading-tight font-medium">
                  {t("ai_assistant.online", "En línea")}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Cerrar chat del asistente"
              className="h-7 w-7 rounded-lg bg-[color:var(--color-chat-close-bg)] hover:bg-accent text-chat-surface-foreground/60 hover:text-chat-surface-foreground transition-all grid place-items-center cursor-pointer"
            >
              <span className="text-sm leading-none">&times;</span>
            </button>
          </div>

          {/* Messages */}
          <div ref={listRef} className="flex-1 overflow-y-auto px-3 py-4 space-y-3 scroll-smooth">
            {/* SCRUM-345: Estado vacío SIN texto hardcoded.
                Solo se ve si el LLM aún no respondió (cold start del
                endpoint /welcome). Las sugerencias clicables SON prompts
                que se envían al LLM real cuando se hace click. */}
            {messages.length === 0 && isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center h-full text-center px-4 gap-3"
              >
                <div className="h-12 w-12 rounded-full bg-gradient-primary grid place-items-center shadow-glow">
                  <Loader2 className="h-6 w-6 text-primary-foreground animate-spin" />
                </div>
                <p className="text-xs text-[color:var(--color-chat-typing-text)] font-medium">
                  Conectando con Sporty...
                </p>
              </motion.div>
            )}
            {/* SCRUM-345: Sugerencias rápidas (prompts) para iniciar conversación.
                Se ocultan cuando ya hay un mensaje del LLM en la conversación. */}
            {messages.length === 0 && !isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="flex flex-col h-full px-2 py-4 gap-3"
              >
                <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold text-[color:var(--color-chat-typing-text)]">
                  <Sparkles className="h-3 w-3" />
                  {t("ai_assistant.suggestions", "Sugerencias")}
                </div>
                <div className="flex flex-col gap-2">
                  {quickPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      type="button"
                      onClick={() => {
                        void sendMessage(prompt);
                      }}
                      className="text-left text-xs px-3 py-2.5 rounded-xl bg-[color:var(--color-chat-suggestion-bg)] hover:bg-[color:var(--color-chat-suggestion-hover)] text-[color:var(--color-chat-suggestion-fg)] border border-border/40 transition-all cursor-pointer"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
                <p className="text-[10px] text-[color:var(--color-chat-typing-text)] mt-auto opacity-70">
                  {t("ai_assistant.powered_by", "Respuestas generadas por IA · Vertex AI")}
                </p>
              </motion.div>
            )}
            {messages.map((msg) => {
              const isUser = msg.role === "user";
              const isSystem = msg.role === "system";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`mt-1 h-7 w-7 shrink-0 rounded-full grid place-items-center ${
                      isUser
                        ? "bg-primary/20 border border-primary/30"
                        : isSystem
                          ? "bg-destructive/15 border border-destructive/30"
                          : "bg-gradient-primary"
                    }`}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : isSystem ? (
                      <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-[color:var(--color-chat-bubble-user)] border border-primary/20 text-[color:var(--color-chat-bubble-user-foreground)] rounded-tr-md"
                        : isSystem
                          ? "bg-destructive/10 border border-destructive/30 text-destructive rounded-tl-md"
                          : "bg-[color:var(--color-chat-bubble-ai)] border border-border text-[color:var(--color-chat-bubble-ai-foreground)] rounded-tl-md"
                    }`}
                  >
                    {msg.text}
                  </div>
                </motion.div>
              );
            })}

            {isTyping && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex gap-2.5"
              >
                <div className="mt-1 h-7 w-7 shrink-0 rounded-full bg-gradient-primary grid place-items-center">
                  <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-md bg-[color:var(--color-chat-bubble-ai)] border border-border">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-[color:var(--color-chat-typing-text)] font-medium">
                    Analizando...
                  </span>
                </div>
              </motion.div>
            )}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-chat-border p-3 bg-[color:var(--color-chat-close-bg)]">
            <div className="flex items-center gap-2 bg-[color:var(--color-chat-input-bg)] rounded-xl border border-[color:var(--color-chat-input-border)] pl-3 pr-1.5 py-1.5 focus-within:border-primary/40 transition-colors relative">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={t("ai_assistant.input_placeholder", "Pregúntale a Sporty...")}
                aria-label={t("ai_assistant.input_aria", "Escribe tu mensaje para Sporty")}
                className="flex-1 bg-transparent text-sm text-chat-surface-foreground placeholder:text-muted-foreground outline-none border-none"
              />
              <VoiceControl
                onTranscript={handleVoiceTranscript}
                textToSpeak={lastAssistantMsg?.text ?? ""}
                textKey={lastAssistantMsg?.id ?? "idle"}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                aria-label="Enviar mensaje"
                className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed grid place-items-center transition-all cursor-pointer"
              >
                <Send className="h-4 w-4 text-primary-foreground" />
              </button>
            </div>
            <div className="flex gap-3 mt-2 px-1">
              {messages.length > 0 && (
                <button
                  onClick={() => {
                    useAiAssistantStore.getState().clearMessages();
                    setInput("");
                  }}
                  className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--color-chat-suggestion-fg)] hover:text-primary bg-[color:var(--color-chat-suggestion-bg)] hover:bg-[color:var(--color-chat-suggestion-hover)] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  <Zap className="h-3 w-3" /> {t("ai_assistant.clear_chat", "Limpiar chat")}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
