import React from "react";
import {
  Phone,
  Video,
  MoreVertical,
  Send,
  Image as ImageIcon,
  Plus,
  Loader2,
  Check,
} from "lucide-react";
import { User, Match, Squad } from "@/entities/types";
import { useChatStore } from "@/features/chat/useChatStore";

interface SquadInviteCardProps {
  squadId: string;
  squadName: string;
  onJoinSquad: (squadId: string, squadName: string) => Promise<void>;
  isJoiningMap: Record<string, boolean>;
  joinedMap: Record<string, boolean>;
}

export function SquadInviteCard({
  squadId,
  squadName,
  onJoinSquad,
  isJoiningMap,
  joinedMap,
}: SquadInviteCardProps) {
  const joined = joinedMap[squadId] || false;
  const isJoining = isJoiningMap[squadId] || false;

  return (
    <div className="mt-2 p-4 bg-background border border-border/80 rounded-2xl flex flex-col gap-3 shadow-md max-w-xs text-foreground">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center text-lg">
          👥
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Invitación a Squad
          </div>
          <div className="font-bold text-xs truncate">{squadName}</div>
        </div>
      </div>
      <button
        onClick={() => onJoinSquad(squadId, squadName)}
        disabled={joined || isJoining}
        className="w-full py-2 rounded-xl text-[10px] font-bold bg-neon text-neon-foreground hover:shadow-neon disabled:opacity-75 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        {isJoining ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : joined ? (
          <>
            <Check className="h-3.5 w-3.5" /> MIEMBRO
          </>
        ) : (
          "UNIRSE AL SQUAD"
        )}
      </button>
    </div>
  );
}

interface MatchProposalCardProps {
  matchTitle: string;
  courtName: string;
  price: number;
  courtId: string;
  onPlay: (courtId: string) => void;
}

export function MatchProposalCard({
  matchTitle,
  courtName,
  price,
  courtId,
  onPlay,
}: MatchProposalCardProps) {
  return (
    <div className="mt-2 p-4 bg-background border border-border/80 rounded-2xl flex flex-col gap-3 shadow-md max-w-xs text-foreground">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 bg-gradient-primary rounded-xl flex items-center justify-center text-lg">
          🎾
        </div>
        <div>
          <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
            Propuesta de Partido
          </div>
          <div className="font-bold text-xs truncate">{matchTitle}</div>
          <div className="text-[10px] text-muted-foreground truncate">
            {courtName} · S/ {price}/h
          </div>
        </div>
      </div>
      <button
        onClick={() => onPlay(courtId)}
        className="w-full py-2 rounded-xl text-[10px] font-bold bg-gradient-primary text-primary-foreground hover:shadow-glow transition-all flex items-center justify-center gap-1.5 cursor-pointer"
      >
        JUGAR PARTIDO
      </button>
    </div>
  );
}

interface ChatWindowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activeChat: any;
  currentUser: User | null;
  registeredUsers: User[];
  areProfilesLoading: boolean;
  text: string;
  setText: (t: string) => void;
  handleSend: () => void;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  selectedImageBase64: string | null;
  setSelectedImageBase64: (s: string | null) => void;
  isAttachmentMenuOpen: boolean;
  setIsAttachmentMenuOpen: (b: boolean) => void;
  userSquads: Squad[];
  systemMatches: Match[];
  sendSquadInviteCard: (squad: Squad) => void;
  sendMatchProposalCard: (match: Match) => void;
  handlePlayCheckout: (courtId: string) => void;
  onJoinSquad: (squadId: string, squadName: string) => Promise<void>;
  isJoiningMap: Record<string, boolean>;
  joinedMap: Record<string, boolean>;
  endRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  t: any;
}

export function ChatWindow({
  activeChat,
  currentUser,
  registeredUsers,
  areProfilesLoading,
  text,
  setText,
  handleSend,
  handleFileChange,
  selectedImageBase64,
  setSelectedImageBase64,
  isAttachmentMenuOpen,
  setIsAttachmentMenuOpen,
  userSquads,
  systemMatches,
  sendSquadInviteCard,
  sendMatchProposalCard,
  handlePlayCheckout,
  onJoinSquad,
  isJoiningMap,
  joinedMap,
  endRef,
  fileInputRef,
  t,
}: ChatWindowProps) {
  const sendTypingStatus = useChatStore((s) => s.sendTypingStatus);
  const typingUsers = useChatStore((s) => s.typingUsers);

  const typingTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const isTypingRef = React.useRef(false);

  React.useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  const handleTyping = () => {
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      sendTypingStatus(true);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      sendTypingStatus(false);
    }, 1500);
  };

  const onSend = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    isTypingRef.current = false;
    sendTypingStatus(false);
    handleSend();
  };

  if (!activeChat) {
    return (
      <div className="flex-1 grid place-items-center text-muted-foreground flex-col">
        {t("chat.empty", "Selecciona una conversación para chatear")}
      </div>
    );
  }

  return (
    <>
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card/50">
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10">
            {activeChat.avatar.startsWith("http") ? (
              <img
                src={activeChat.avatar}
                alt=""
                className="h-10 w-10 rounded-full bg-muted object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-gradient-primary grid place-items-center text-lg">
                🎾
              </div>
            )}
          </div>
          <div>
            <div className="font-semibold">{activeChat.name}</div>
            <div className="text-xs text-neon">
              {activeChat.current_players.length} {t("chat.online", "participantes en línea")}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-4 text-muted-foreground">
          <button className="hover:text-foreground cursor-pointer">
            <Phone className="h-5 w-5" />
          </button>
          <button className="hover:text-foreground cursor-pointer">
            <Video className="h-5 w-5" />
          </button>
          <button className="hover:text-foreground cursor-pointer">
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-6 overflow-y-auto space-y-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {activeChat.messages.map((msg: any) => {
          const isSystem = msg.sender_id === "system";
          if (isSystem) {
            return (
              <div key={msg.id} className="flex justify-center my-4 w-full">
                <div className="bg-accent/40 border border-border/60 text-muted-foreground text-xs px-4 py-2 rounded-full max-w-[90%] text-center shadow-sm">
                  {msg.text}
                </div>
              </div>
            );
          }

          const isMe = msg.sender_id === currentUser?.id;
          const sender = registeredUsers.find((u) => u.id === msg.sender_id);
          const time = new Date(msg.created_at).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[80%] ${isMe ? "ml-auto flex-row-reverse" : ""}`}
            >
              {isMe ? (
                <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-white text-[10px] font-bold shrink-0">
                  {t("chat.me", "YO")}
                </div>
              ) : (
                <>
                  {sender?.avatar_url ? (
                    <img
                      src={sender.avatar_url}
                      alt=""
                      className="h-8 w-8 rounded-full bg-muted shrink-0 object-cover"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-muted animate-pulse shrink-0" />
                  )}
                </>
              )}
              <div>
                {!isMe && (
                  <div className="text-xs text-muted-foreground mb-1 ml-1">
                    {sender?.name || (areProfilesLoading ? "Cargando remitente..." : "Usuario")}
                  </div>
                )}
                <div
                  className={`p-3 text-sm flex flex-col ${isMe ? "bg-gradient-primary text-primary-foreground rounded-2xl rounded-tr-none shadow-glow" : "bg-accent rounded-2xl rounded-tl-none"}`}
                >
                  {/* Rich attachment image rendering */}
                  {msg.media_url && (
                    <img
                      src={msg.media_url}
                      alt="Chat attachment"
                      className="max-w-[200px] max-h-[160px] object-cover rounded-xl mb-2 border border-border/60"
                    />
                  )}

                  <span>{msg.text}</span>

                  {/* Actionable cards integration */}
                  {msg.metadata?.type === "squad_invite" && (
                    <SquadInviteCard
                      squadId={msg.metadata.squad_id}
                      squadName={msg.metadata.squad_name}
                      onJoinSquad={onJoinSquad}
                      isJoiningMap={isJoiningMap}
                      joinedMap={joinedMap}
                    />
                  )}

                  {msg.metadata?.type === "match_proposal" && (
                    <MatchProposalCard
                      matchTitle={msg.metadata.match_title}
                      courtName={msg.metadata.court_name}
                      price={msg.metadata.price}
                      courtId={msg.metadata.court_id}
                      onPlay={handlePlayCheckout}
                    />
                  )}
                </div>
                <div
                  className={`text-[10px] mt-1 flex items-center justify-end gap-1 ${isMe ? "text-primary/75 mr-1" : "text-muted-foreground ml-1"}`}
                >
                  <span>{time}</span>
                  {isMe &&
                    (msg.metadata?.delivery_status === "sending" ? (
                      <span className="text-primary-foreground/45 text-xs" title="Enviando mensaje">
                        ·
                      </span>
                    ) : msg.metadata?.seen ? (
                      <span className="text-neon font-bold text-xs" title="Visto">
                        ✓✓
                      </span>
                    ) : (
                      <span
                        className="text-primary-foreground/60 text-xs"
                        title="Enviado, todavía no visto"
                      >
                        ✓
                      </span>
                    ))}
                </div>
              </div>
            </div>
          );
        })}

        {/* Real-time Typing Indicators */}
        {Object.keys(typingUsers).map((userId) => {
          if (userId === currentUser?.id) return null;
          const typingUser = registeredUsers.find((u) => u.id === userId) || {
            name: "Alguien",
            avatar_url: "/placeholder.png",
          };
          return (
            <div key={userId} className="flex gap-3 max-w-[80%] items-center animate-pulse">
              {typingUser.avatar_url && typingUser.avatar_url.startsWith("http") ? (
                <img
                  src={typingUser.avatar_url}
                  alt=""
                  className="h-8 w-8 rounded-full bg-muted shrink-0 object-cover"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gradient-primary grid place-items-center text-white text-[10px] font-bold shrink-0">
                  🎾
                </div>
              )}
              <div className="bg-accent rounded-2xl rounded-tl-none p-3 text-xs text-muted-foreground flex items-center gap-1.5">
                <span>{typingUser.name} está escribiendo</span>
                <span className="flex gap-0.5">
                  <span
                    className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "0ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "150ms" }}
                  />
                  <span
                    className="h-1.5 w-1.5 bg-muted-foreground rounded-full animate-bounce"
                    style={{ animationDelay: "300ms" }}
                  />
                </span>
              </div>
            </div>
          );
        })}

        <div ref={endRef} />
      </div>

      <div className="p-4 bg-card/50 border-t border-border space-y-3 relative">
        {/* File Attachment & Card menu drawer */}
        {isAttachmentMenuOpen && (
          <div className="absolute bottom-20 left-4 right-4 bg-background border border-border p-4 rounded-2xl shadow-card z-10 flex flex-col gap-3 animate-slide-up">
            <div className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">
              Compartir e Invitar
            </div>
            <div className="grid grid-cols-2 gap-3">
              {/* Invite to Squad selector list */}
              <div className="border border-border/60 rounded-xl p-2.5 space-y-2 max-h-[140px] overflow-y-auto">
                <div className="text-[10px] font-bold text-primary">MIS SQUADS</div>
                {userSquads.length === 0 ? (
                  <div className="text-[9px] text-muted-foreground">
                    No eres miembro de ningún squad
                  </div>
                ) : (
                  userSquads.map((sq) => (
                    <button
                      key={sq.id}
                      onClick={() => sendSquadInviteCard(sq)}
                      className="w-full text-left p-1 text-[10px] truncate hover:text-neon transition-colors cursor-pointer"
                    >
                      👥 {sq.name}
                    </button>
                  ))
                )}
              </div>

              {/* Propose Active Match selector list */}
              <div className="border border-border/60 rounded-xl p-2.5 space-y-2 max-h-[140px] overflow-y-auto">
                <div className="text-[10px] font-bold text-electric">PARTIDOS ACTIVOS</div>
                {systemMatches.length === 0 ? (
                  <div className="text-[9px] text-muted-foreground">No hay partidos activos</div>
                ) : (
                  systemMatches.slice(0, 5).map((match) => (
                    <button
                      key={match.id}
                      onClick={() => sendMatchProposalCard(match)}
                      className="w-full text-left p-1 text-[10px] truncate hover:text-neon transition-colors cursor-pointer"
                    >
                      🎾 {match.title}
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Selected File Attachment Preview */}
        {selectedImageBase64 && (
          <div className="relative inline-block p-1 bg-accent/40 rounded-xl border border-border">
            <img src={selectedImageBase64} className="h-16 w-16 object-cover rounded-lg" />
            <button
              onClick={() => setSelectedImageBase64(null)}
              className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white rounded-full grid place-items-center text-[10px] font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        <div className="flex items-center gap-2 bg-background border border-border rounded-full px-4 py-2">
          <button
            onClick={() => setIsAttachmentMenuOpen(!isAttachmentMenuOpen)}
            className="text-muted-foreground hover:text-neon cursor-pointer"
            title="Menu de Adjuntos"
          >
            <Plus
              className={`h-5 w-5 transition-transform ${isAttachmentMenuOpen ? "rotate-45" : ""}`}
            />
          </button>

          <input
            type="text"
            placeholder={t("chat.placeholder", "Escribe un mensaje...")}
            className="flex-1 bg-transparent border-none focus:outline-none text-sm px-2 text-foreground"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => e.key === "Enter" && onSend()}
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="text-muted-foreground hover:text-neon cursor-pointer"
            title="Adjuntar Imagen"
          >
            <ImageIcon className="h-5 w-5" />
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden"
          />

          <button
            onClick={onSend}
            disabled={!text.trim() && !selectedImageBase64}
            className="h-8 w-8 rounded-full bg-neon text-neon-foreground grid place-items-center shadow-neon ml-2 cursor-pointer border-0 disabled:opacity-40 disabled:shadow-none disabled:pointer-events-none"
          >
            <Send className="h-4 w-4 ml-0.5" />
          </button>
        </div>
      </div>
    </>
  );
}
