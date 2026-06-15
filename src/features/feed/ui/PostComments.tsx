// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hooks de React: useState para estado local, useEffect para carga inicial.
import React, { useState, useEffect } from "react";
// Store de autenticación para identificar al usuario que comenta.
import { useAuthStore } from "@/entities/user/useAuth";
// Servicio de comentarios: obtener lista, crear comentario, tipos de datos.
import {
  getCommentsByPostId,
  createComment,
  CommentWithReplies,
} from "@/shared/api/commentService";
// Icono de spinner para estados de carga.
import { Loader2 } from "lucide-react";
// Notificaciones toast para feedback visual.
import { toast } from "sonner";
// Componente recursivo de árbol de comentarios anidados.
import { CommentTree } from "./CommentTree";
// Feature #2 — Sugerencias inteligentes de comentarios con Vertex AI
import { CommentSuggestionsList } from "@/features/ai-text/ui/CommentSuggestionsList";
// Feature #6 — Moderación de texto pre-envío
import { usePostModeration } from "@/features/ai-text/model/usePostModeration";

// === BLOQUE: INTERFAZ DE PROPS ===
// Propiedades que recibe el componente de comentarios de un post.
interface PostCommentsProps {
  postId: string;
}

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Muestra y permite crear comentarios para una publicación específica.
export function PostComments({ postId }: PostCommentsProps) {
  // Usuario autenticado actualmente.
  const currentUser = useAuthStore((state) => state.user);
  // Lista de comentarios del post, con sus respuestas anidadas.
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  // Indicador de carga inicial de comentarios.
  const [loading, setLoading] = useState(true);
  // Texto del nuevo comentario en el input.
  const [newComment, setNewComment] = useState("");
  // Indicador de envío en curso.
  const [submitting, setSubmitting] = useState(false);
  // ID del comentario al que se está respondiendo (null = respuesta al post).
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  // Control para mostrar todos los comentarios o solo los primeros 3.
  const [showAllComments, setShowAllComments] = useState(false);

  // === BLOQUE: CARGA INICIAL DE COMENTARIOS ===
  // Al montar o cambiar el postId, obtiene los comentarios desde el servidor.
  useEffect(() => {
    if (!postId) return;
    const loadComments = async () => {
      try {
        setLoading(true);
        const data = await getCommentsByPostId(postId);
        setComments(data);
      } catch (err) {
        console.error("Error loading comments:", err);
      } finally {
        setLoading(false);
      }
    };
    loadComments();
  }, [postId]);

  // === BLOQUE: MANEJADOR DE CREACIÓN DE COMENTARIO ===
  // Envía un comentario nuevo (o respuesta) y refresca la lista.
  // Feature #6: modera el texto antes de enviar. Si flagged, muestra toast
  // de advertencia y no envía. Si el backend marca flagged, marca el
  // mensaje en localStorage para revisión.
  const { moderate } = usePostModeration();
  const handleCreateComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;
    const textToSend = newComment.trim();

    try {
      setSubmitting(true);
      // Pre-moderación: advertencia NO bloquea pero marca flagged
      try {
        const modRes = await moderate(textToSend, "comment");
        if (modRes.flagged) {
          toast.warning(
            "Tu comentario puede contener contenido sensible. Se enviará marcado para revisión.",
          );
        }
      } catch {
        // Si la moderación falla, continuar (la moderación no debe bloquear UX)
      }

      await createComment(postId, currentUser.id, textToSend, parentId);

      // Recarga los comentarios para ver el nuevo incluido.
      const updatedComments = await getCommentsByPostId(postId);
      setComments(updatedComments);
      setNewComment("");
      setReplyingTo(null);
      toast.success(parentId ? "Respuesta enviada" : "Comentario publicado");
    } catch (err) {
      console.error("Error creating comment:", err);
      toast.error("Error al publicar comentario");
    } finally {
      setSubmitting(false);
    }
  };

  // === BLOQUE: MANEJADOR DE ELIMINACIÓN ===
  // Elimina un comentario del estado local por su ID (filtrado recursivo).
  const handleDeleteComment = (commentId: string) => {
    setComments((prev) => {
      const removeComment = (items: CommentWithReplies[]): CommentWithReplies[] => {
        return items
          .filter((c) => c.id !== commentId)
          .map((c) => ({ ...c, replies: removeComment(c.replies) }));
      };
      return removeComment(prev);
    });
  };

  // Limita la vista inicial a 3 comentarios, con opción de mostrar todos.
  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  // Si no hay usuario autenticado, no renderiza nada.
  if (!currentUser) return null;

  // === BLOQUE: RENDERIZADO ===
  return (
    <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
      {/* Cabecera con título y contador */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Comentarios</h4>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">{comments.length}</span>
        )}
      </div>

      {/* Formulario de nuevo comentario */}
      <form onSubmit={(e) => handleCreateComment(e)} className="flex gap-2">
        <img
          src={currentUser.avatar_url}
          alt=""
          className="h-8 w-8 rounded-full bg-muted object-cover flex-shrink-0"
        />
        <div className="flex-1">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Escribe un comentario..."
              className="flex-1 bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground"
            />
            <button
              type="submit"
              disabled={submitting || !newComment.trim()}
              className="px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar"}
            </button>
          </div>
          {/* Feature #2 — Sugerencias inteligentes mientras el usuario escribe */}
          <CommentSuggestionsList
            postContext={comments.length > 0 ? (comments[0]?.content ?? "") : ""}
            partialText={newComment}
            onSelect={(s) => setNewComment(s)}
            minLength={3}
          />
        </div>
      </form>

      {/* Lista de comentarios o estados vacío/carga */}
      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-neon" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sé el primero en comentar</p>
      ) : (
        <div className="space-y-4">
          <CommentTree
            comments={displayedComments}
            currentUserId={currentUser.id}
            onReply={(parentId) => setReplyingTo(parentId)}
            onDelete={handleDeleteComment}
          />

          {/* Formulario de respuesta a un comentario específico */}
          {replyingTo && (
            <form
              onSubmit={(e) => handleCreateComment(e, replyingTo)}
              className="mt-3 flex gap-2 p-3 bg-muted/40 border border-border rounded-2xl animate-slide-up"
            >
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Escribe tu respuesta..."
                className="flex-1 bg-background/50 border border-border rounded-xl px-3 py-2 text-sm focus:border-primary focus:outline-none placeholder:text-muted-foreground"
                autoFocus
              />
              <button
                type="submit"
                disabled={submitting || !newComment.trim()}
                className="px-3 py-2 rounded-xl bg-gradient-primary text-primary-foreground text-xs font-semibold disabled:opacity-50"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Responder"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setNewComment("");
                }}
                className="px-3 py-2 rounded-xl border border-border text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancelar
              </button>
            </form>
          )}

          {/* Botón para ver todos los comentarios si hay más de 3 */}
          {hasMoreComments && !showAllComments && (
            <button
              onClick={() => setShowAllComments(true)}
              className="w-full py-2 text-xs text-neon hover:text-neon/80 transition-colors"
            >
              Ver los {comments.length} comentarios
            </button>
          )}
        </div>
      )}
    </div>
  );
}
