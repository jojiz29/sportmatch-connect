import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/entities/user/useAuth";
import {
  getCommentsByPostId,
  createComment,
  CommentWithReplies,
} from "@/shared/api/commentService";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { CommentTree } from "./CommentTree";

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
          <CommentTree
            comments={displayedComments}
            currentUserId={currentUser.id}
            onReply={(parentId) => setReplyingTo(parentId)}
            onDelete={handleDeleteComment}
          />

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
