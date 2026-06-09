import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import { ReactionType } from "@/entities/types";
import {
  getCommentsByPostId,
  createComment,
  deleteComment,
  addReaction,
  removeReaction,
  CommentWithReplies,
  getUserReactionForComment,
  getReactionsByCommentId,
  buildReactionSummary,
} from "@/shared/api/commentService";
import { Loader2, Heart, Reply, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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

interface CommentItemProps {
  comment: CommentWithReplies;
  currentUserId: string;
  onReply: (parentId: string) => void;
  onDelete: (commentId: string) => void;
  depth?: number;
}

function CommentItem({ comment, currentUserId, onReply, onDelete, depth = 0 }: CommentItemProps) {
  const [userReaction, setUserReaction] = useState<ReactionType | null>(null);
  const [reactionSummary, setReactionSummary] = useState<Record<ReactionType, number>>(
    {} as Record<ReactionType, number>,
  );
  const [showReactions, setShowReactions] = useState(false);
  const [showReplies, setShowReplies] = useState(true);

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

  const handleReaction = async (type: ReactionType) => {
    try {
      if (userReaction === type) {
        await removeReaction(comment.id, currentUserId, type);
        setUserReaction(null);
        setReactionSummary((prev) => ({
          ...prev,
          [type]: Math.max(0, (prev[type] || 0) - 1),
        }));
      } else {
        if (userReaction) {
          await removeReaction(comment.id, currentUserId, userReaction);
          setReactionSummary((prev) => ({
            ...prev,
            [userReaction]: Math.max(0, (prev[userReaction] || 0) - 1),
          }));
        }
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

  return (
    <div className={`flex gap-2 ${depth > 0 ? "ml-8 border-l-2 border-border/30 pl-3" : ""}`}>
      <img
        src={comment.user_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
        alt=""
        className="h-8 w-8 rounded-full bg-muted object-cover flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-xs truncate">{comment.user_name}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">{comment.content}</p>

        <div className="flex items-center gap-3 mt-2">
          <div className="relative">
            <button
              onClick={() => setShowReactions(!showReactions)}
              className={`flex items-center gap-1 text-xs transition-colors ${
                userReaction ? "text-neon" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {userReaction ? (
                <span className="text-base">
                  {REACTION_TYPES.find((r) => r.type === userReaction)?.emoji}
                </span>
              ) : (
                <Heart className="h-3.5 w-3.5" />
              )}
              {totalReactions > 0 && <span>{totalReactions}</span>}
            </button>

            <AnimatePresence>
              {showReactions && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -5 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -5 }}
                  className="absolute bottom-full left-0 mb-1 bg-gradient-card border border-border rounded-xl p-1.5 shadow-lg flex gap-1 z-20"
                >
                  {REACTION_TYPES.map(({ type, emoji }) => (
                    <button
                      key={type}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReaction(type);
                        setShowReactions(false);
                      }}
                      className="p-1 hover:bg-muted rounded-lg transition-colors text-lg"
                      title={REACTION_TYPES.find((r) => r.type === type)?.label}
                    >
                      {emoji}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onReply(comment.id)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Reply className="h-3.5 w-3.5" />
            Responder
          </button>

          {comment.user_id === currentUserId && (
            <button
              onClick={handleDelete}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center gap-1 text-xs text-neon hover:text-neon/80 transition-colors"
            >
              {showReplies ? (
                <ChevronUp className="h-3.5 w-3.5" />
              ) : (
                <ChevronDown className="h-3.5 w-3.5" />
              )}
              {comment.replies.length} {comment.replies.length === 1 ? "respuesta" : "respuestas"}
            </button>

            <AnimatePresence>
              {showReplies && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 mt-3"
                >
                  {comment.replies.map((reply) => (
                    <CommentItem
                      key={reply.id}
                      comment={reply}
                      currentUserId={currentUserId}
                      onReply={onReply}
                      onDelete={onDelete}
                      depth={depth + 1}
                    />
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

interface PostCommentsProps {
  postId: string;
}

export function PostComments({ postId }: PostCommentsProps) {
  const currentUser = useAuthStore((state) => state.user);
  const [comments, setComments] = useState<CommentWithReplies[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);

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

  const handleCreateComment = async (e: React.FormEvent, parentId?: string) => {
    e.preventDefault();
    if (!currentUser || !newComment.trim()) return;

    try {
      setSubmitting(true);
      await createComment(postId, currentUser.id, newComment.trim(), parentId);

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

  const displayedComments = showAllComments ? comments : comments.slice(0, 3);
  const hasMoreComments = comments.length > 3;

  if (!currentUser) return null;

  return (
    <div className="mt-4 pt-4 border-t border-border/30 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold text-foreground">Comentarios</h4>
        {comments.length > 0 && (
          <span className="text-xs text-muted-foreground">{comments.length}</span>
        )}
      </div>

      <form onSubmit={(e) => handleCreateComment(e)} className="flex gap-2">
        <img
          src={currentUser.avatar_url}
          alt=""
          className="h-8 w-8 rounded-full bg-muted object-cover flex-shrink-0"
        />
        <div className="flex-1 flex gap-2">
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
      </form>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-neon" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">Sé el primero en comentar</p>
      ) : (
        <div className="space-y-4">
          {displayedComments.map((comment) => (
            <div key={comment.id}>
              <CommentItem
                comment={comment}
                currentUserId={currentUser.id}
                onReply={(parentId) => setReplyingTo(parentId)}
                onDelete={handleDeleteComment}
              />

              {replyingTo === comment.id && (
                <form
                  onSubmit={(e) => handleCreateComment(e, comment.id)}
                  className="ml-10 mt-3 flex gap-2"
                >
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={`Respuesta a ${comment.user_name}...`}
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
            </div>
          ))}

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

function getTimeAgo(isoDate: string): string {
  const now = Date.now();
  const then = new Date(isoDate).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "Ahora mismo";
  if (diffMin < 60) return `Hace ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Hace ${diffH} h`;
  return `Hace ${Math.floor(diffH / 24)} d`;
}
