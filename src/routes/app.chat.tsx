import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/PageHeader";
import { CHATS } from "@/lib/mock";
import { Send, Users } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/app/chat")({
  head: () => ({ meta: [{ title: "Chat — SportMatch" }] }),
  component: Chat,
});

type Msg = { id: string; from: "me" | "them"; text: string; time: string; author?: string };

const INITIAL: Msg[] = [
  { id: "1", from: "them", author: "Camila", text: "¡Hola! Confirmás el partido de hoy 19hs?", time: "14:02" },
  { id: "2", from: "me", text: "¡Sí! Llevo paletas extra por las dudas 🏓", time: "14:05" },
  { id: "3", from: "them", author: "Diego", text: "Yo llego 5 min tarde, salgan calentando", time: "14:10" },
  { id: "4", from: "them", author: "Camila", text: "Perfecto, nos vemos en cancha 2 ⚡", time: "14:11" },
];

function Chat() {
  const [active, setActive] = useState(CHATS[0]);
  const [msgs, setMsgs] = useState<Msg[]>(INITIAL);
  const [text, setText] = useState("");

  const send = () => {
    if (!text.trim()) return;
    setMsgs((m) => [...m, { id: crypto.randomUUID(), from: "me", text, time: "ahora" }]);
    setText("");
  };

  return (
    <div className="container mx-auto px-4 lg:px-8 py-8">
      <PageHeader title="Mensajes" subtitle="Conectá con tus rivales en tiempo real" />

      <div className="grid lg:grid-cols-[320px_1fr] gap-4 h-[600px]">
        <div className="bg-gradient-card border border-border rounded-2xl p-2 overflow-y-auto">
          {CHATS.map((c) => (
            <button
              key={c.id}
              onClick={() => setActive(c)}
              className={`w-full text-left flex items-center gap-3 p-3 rounded-xl transition-all ${
                active.id === c.id ? "bg-accent" : "hover:bg-accent/50"
              }`}
            >
              <div className="relative">
                <img src={c.avatar} alt={c.name} className="h-11 w-11 rounded-full bg-muted" />
                {c.group && (
                  <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-electric grid place-items-center">
                    <Users className="h-3 w-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{c.name}</div>
                <div className="text-xs text-muted-foreground truncate">{c.last}</div>
              </div>
              {c.unread > 0 && (
                <span className="text-[10px] h-5 min-w-5 px-1.5 rounded-full bg-gradient-neon text-neon-foreground font-bold grid place-items-center">{c.unread}</span>
              )}
            </button>
          ))}
        </div>

        <div className="bg-gradient-card border border-border rounded-2xl flex flex-col">
          <div className="flex items-center gap-3 p-4 border-b border-border">
            <img src={active.avatar} alt={active.name} className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold truncate">{active.name}</div>
              <div className="text-xs text-neon flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-neon animate-pulse-ring" /> En línea
              </div>
            </div>
          </div>

          <div className="flex-1 p-4 space-y-3 overflow-y-auto">
            {msgs.map((m) => (
              <div key={m.id} className={`flex ${m.from === "me" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[75%] px-4 py-2 rounded-2xl text-sm ${
                  m.from === "me"
                    ? "bg-gradient-primary text-primary-foreground rounded-br-sm"
                    : "glass rounded-bl-sm"
                }`}>
                  {m.author && m.from === "them" && (
                    <div className="text-xs text-neon font-semibold mb-0.5">{m.author}</div>
                  )}
                  {m.text}
                  <div className={`text-[10px] mt-1 ${m.from === "me" ? "text-white/70" : "text-muted-foreground"}`}>{m.time}</div>
                </div>
              </div>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t border-border flex gap-2"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribí un mensaje…"
              className="flex-1 px-4 py-2.5 rounded-xl bg-input border border-border outline-none text-sm focus:ring-glow"
            />
            <button type="submit" className="px-4 rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
