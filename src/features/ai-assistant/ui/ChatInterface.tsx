import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Zap, MapPin, Loader2 } from "lucide-react";
import { useAiAssistantStore } from "../model/useAiAssistantStore";

interface ChatInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChatInterface({ isOpen, onClose }: ChatInterfaceProps) {
  // Suscripción al store (estado de dominio)
  const messages = useAiAssistantStore((s) => s.messages);
  const isTyping = useAiAssistantStore((s) => s.isTyping);
  const sendMessage = useAiAssistantStore((s) => s.sendMessage);

  // Estado puramente transitorio de UI (no merece vivir en el store)
  const [input, setInput] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendMessage(text);
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
                  En línea
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
            {messages.map((msg) => {
              const isUser = msg.role === "user";
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
                      isUser ? "bg-primary/20 border border-primary/30" : "bg-gradient-primary"
                    }`}
                  >
                    {isUser ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-primary-foreground" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                      isUser
                        ? "bg-[color:var(--color-chat-bubble-user)] border border-primary/20 text-[color:var(--color-chat-bubble-user-foreground)] rounded-tr-md"
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
            <div className="flex items-center gap-2 bg-[color:var(--color-chat-input-bg)] rounded-xl border border-[color:var(--color-chat-input-border)] pl-3 pr-1.5 py-1.5 focus-within:border-primary/40 transition-colors">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntale a Sporty..."
                aria-label="Escribe tu mensaje para Sporty"
                className="flex-1 bg-transparent text-sm text-chat-surface-foreground placeholder:text-muted-foreground outline-none border-none"
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
              <button
                onClick={() => setInput("Buscar canchas cerca")}
                className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--color-chat-suggestion-fg)] hover:text-primary bg-[color:var(--color-chat-suggestion-bg)] hover:bg-[color:var(--color-chat-suggestion-hover)] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <MapPin className="h-3 w-3" /> Canchas cerca
              </button>
              <button
                onClick={() => setInput("Recomiéndame un deporte")}
                className="flex items-center gap-1 text-[10px] font-semibold text-[color:var(--color-chat-suggestion-fg)] hover:text-primary bg-[color:var(--color-chat-suggestion-bg)] hover:bg-[color:var(--color-chat-suggestion-hover)] px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <Zap className="h-3 w-3" /> Recomiéndame
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
