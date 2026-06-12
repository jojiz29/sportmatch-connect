// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hooks de React para estado local y efectos.
import React, { useState, useEffect } from "react";
// Tipo CommentWithReplies para el árbol de comentarios anidados.
import { CommentWithReplies } from "@/shared/api/commentService";
// Tipo ReactionType para las reacciones emoji.
import { ReactionType } from "@/entities/types";
// Iconos de Lucide para acciones del comentario.
import { Heart, Reply, Trash2, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
// Framer Motion para animaciones del panel de reacciones y respuestas.
import { motion, AnimatePresence } from "framer-motion";
// Notificaciones toast para feedback visual.
import { toast } from "sonner";
// Servicios de reacciones y eliminación de comentarios.
import {
  getUserReactionForComment,
  getReactionsByCommentId,
  buildReactionSummary,
  removeReaction,
  addReaction,
  deleteComment,
} from "@/shared/api/commentService";

// === BLOQUE: CATÁLOGO DE REACCIONES ===
// Define los tipos de reacción disponibles, su emoji y etiqueta en español.
const REACTION_TYPES: { type: ReactionType; emoji: string; label: string }[] = [
  { type: "LIKE", emoji: "👍", label: "Me gusta" },
  { type: "DISLIKE", emoji: "👎", label: "No me gusta" },
  { type: "❤️", emoji: "❤️", label: "Me encanta" },
  { type: "🔥", emoji: "🔥", label: "Caliente" },
  { type: "👏", emoji: "👏", label: "Aplaudir" },
  { type: "😂", emoji: "😂", label: "Divertido" },
  { type: "😢", emoji: "😢", label: "Triste" },
  { type: "🎉", emoji: "🎉", label: "Celebrar" },
];

// === BLOQUE: INTERFAZ DE PROPS DEL ÁRBOL ===
// Props del componente recursivo que renderiza comentarios anidados.
interface CommentTreeProps {
  comments: CommentWithReplies[];
  currentUserId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number; // Profundidad actual en el árbol (para indentación visual).
  maxDepth?: number; // Límite de profundidad recursiva para prevenir desbordamiento.
  onReport?: (commentId: string, type: "comment") => void;
}

// === BLOQUE: COMPONENTE PRINCIPAL DEL ÁRBOL ===
// Renderiza recursivamente la lista de comentarios, cada uno con sus respuestas.
// Incluye condición de salida para evitar profundidad excesiva (QA Gate 1).
export function CommentTree({
  comments,
  currentUserId,
  onReply,
  onDelete,
  depth = 0,
  maxDepth = 6,
  onReport,
}: CommentTreeProps) {
  // Condición de salida: si se supera la profundidad máxima, deja de renderizar.
  if (depth > maxDepth || !comments || comments.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <CommentItemNode
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onReply={onReply}
          onDelete={onDelete}
          depth={depth}
          maxDepth={maxDepth}
          onReport={onReport}
        />
      ))}
    </div>
  );
}

// === BLOQUE: INTERFAZ DE PROPS DEL NODO DE COMENTARIO ===
// Props para cada nodo individual del árbol de comentarios.
interface CommentItemNodeProps {
  comment: CommentWithReplies;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  depth: number;
  maxDepth: number;
  onReport?: (commentId: string, type: "comment") => void;
}

// === BLOQUE: COMPONENTE DE NODO DE COMENTARIO ===
// Renderiza un comentario individual con avatar, contenido, reacciones y acciones.
function CommentItemNode({
  comment,
  currentUserId,
  onReply,
  onDelete,
  depth,
  maxDepth,
  onReport,
}: CommentItemNodeProps) {
  // Reacción del usuario actual a este comentario (null si no ha reaccionado).
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  // Resumen de todas las reacciones (tipo -> cantidad).
  const [reactionSummary, setReactionSummary] = useState<Record<ReactionType, number>>(
    {} as Record<ReactionType, number>,
  );
  // Controla la visibilidad del panel de selección de reacciones.
  const [showReactions, setShowReactions] = useState(false);
  // Controla la visibilidad de las respuestas anidadas.
  const [showReplies, setShowReplies] = useState(true);
  // Controla si se ha revelado contenido sensible.
  const [showSensitiveContent, setShowSensitiveContent] = useState(false);

  // Determina si el comentario está marcado como sensible o reportado.
  const isSensitive = !!(comment.sensitive || comment.flagged);

  // === BLOQUE: CARGA DE REACCIONES ===
  // Al montar, carga la reacción del usuario y el resumen general.
  useEffect(() => {
    if (!comment.id) return;
    const loadReaction = async () => {
      try {
        const reaction = await getUserReactionForComment(comment.id, currentUserId);
        setUserReaction(reaction);
        const reactions = await getReactionsByCommentId(comment.id);
        setReactionSummary(buildReactionSummary(reactions));
      } catch (err) {
        console.error("Error loading reaction:", err);
      }
    };
    loadReaction();
  }, [comment.id, currentUserId]);

  // === BLOQUE: MANEJADOR DE REACCIONES ===
  // Agrega o quita una reacción con toggle. Si ya hay otra, la reemplaza.
  const handleReaction = async (type: ReactionType) => {
    try {
      if (userReaction === type) {
        // Si ya tiene esta reacción, la quita.
        await removeReaction(comment.id, currentUserId, type);
        setUserReaction(null);
        setReactionSummary((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) - 1),
        }));
      } else {
        // Si tenía otra reacción diferente, la quita primero.
        if (userReaction) {
          await removeReaction(comment.id, currentUserId, userReaction);
          setReactionSummary((prev) => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
          }));
        }
        // Agrega la nueva reacción.
        await addReaction(comment.id, currentUserId, type);
        setUserReaction(type);
        setReactionSummary((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + 1,
        }));
      }
    } catch (err) {
      console.error("Error handling reaction:", err);
      toast.error("Error al reaccionar");
    }
  };

  // === BLOQUE: MANEJADOR DE ELIMINACIÓN ===
  // Elimina el comentario en el servidor y notifica al padre.
  const handleDelete = async () => {
    try {
      await deleteComment(comment.id, currentUserId);
      onDelete(comment.id);
      toast.success("Comentario eliminado");
    } catch (err) {
      console.error("Error deleting comment:", err);
      toast.error("Error al eliminar comentario");
    }
  };

  const timeAgo = getTimeAgo(comment.created_at);
  const totalReactions = Object.values(reactionSummary).reduce((a, b) => a + b, 0);

  // === BLOQUE: RENDERIZADO DEL NODO ===
  return (
    <div
      className={`flex flex-col gap-1 ${depth > 0 ? "ml-4 md:ml-6 pl-3 border-l border-border/40" : ""}`}
    >
      <div className="flex gap-2.5 items-start">
        <img
          src={comment.user_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
          alt=""
          className="h-7 w-7 rounded-full bg-muted object-cover flex-shrink-0 mt-0.5"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs truncate text-foreground">
                {comment.user_name}
              </span>
              <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
            </div>
            {onReport && (
              <button
                onClick={() => onReport(comment.id, "comment")}
                className="text-[10px] text-muted-foreground hover:text-red-500 transition-colors"
                title="Reportar comentario"
              >
                Reportar
              </button>
            )}
          </div>

          {/* ── Filtro de contenido sensible ── */}
          {isSensitive && !showSensitiveContent ? (
            <div className="mt-1.5 p-2 rounded-xl bg-destructive/10 border border-destructive/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs text-red-500 font-medium">
                <AlertTriangle className="h-3.5 w-3.5" />
                <span>Este comentario fue marcado como delicado o inapropiado</span>
              </div>
              <button
                onClick={() => setShowSensitiveContent(true)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-all font-semibold"
              >
                Ver contenido
              </button>
            </div>
          ) : (
            <p className="text-xs md:text-sm text-foreground/90 mt-1 whitespace-pre-wrap leading-relaxed">
              {comment.content}
            </p>
          )}

          {/* ── Acciones: reacciones, responder, eliminar ── */}
          <div className="flex items-center gap-4 mt-2">
            {/* Botón de reacción y panel flotante */}
            <div className="relative">
              <button
                onClick={() => setShowReactions(!showReactions)}
                className={`flex items-center gap-1 text-[11px] font-medium transition-colors ${
                  userReaction ? "text-primary" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {userReaction ? (
                  <span className="text-sm">
                    {REACTION_TYPES.find((r) => r.type === userReaction)?.emoji}
                  </span>
                ) : (
                  <Heart className="h-3 w-3" />
                )}
                {totalReactions > 0 && <span className="text-[10px]">{totalReactions}</span>}
              </button>

              {/* Panel flotante de selección de reacción */}
              <AnimatePresence>
                {showReactions && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    className="absolute bottom-full left-0 mb-1 bg-gradient-card border border-border rounded-xl p-1 shadow-lg flex gap-0.5 z-20"
                  >
                    {REACTION_TYPES.map(({ type, emoji, label }) => (
                      <button
                        key={type}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleReaction(type);
                          setShowReactions(false);
                        }}
                        className="p-1 hover:bg-muted rounded-lg transition-colors text-base"
                        title={label}
                      >
                        {emoji}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Botón de responder */}
            <button
              onClick={() => onReply(comment.id)}
              className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              <Reply className="h-3 w-3" />
              Responder
            </button>

            {/* Botón de eliminar (solo visible para el autor) */}
            {comment.user_id === currentUserId && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-red-400 transition-colors"
                title="Eliminar"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Respuestas anidadas (renderizado recursivo) ── */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-1">
          <button
            onClick={() => setShowReplies(!showReplies)}
            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:text-primary/80 transition-colors ml-9"
          >
            {showReplies ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {comment.replies.length} {comment.replies.length === 1 ? "respuesta" : "respuestas"}
          </button>

          <AnimatePresence>
            {showReplies && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden space-y-3 mt-3 ml-4"
              >
                <CommentTree
                  comments={comment.replies}
                  currentUserId={currentUserId}
                  onReply={onReply}
                  onDelete={onDelete}
                  depth={depth + 1}
                  maxDepth={maxDepth}
                  onReport={onReport}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

// Calcula el tiempo transcurrido desde una fecha ISO hasta ahora, en formato breve.
function getTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return `Hace ${Math.floor(diffH / 24)} d`;
}
