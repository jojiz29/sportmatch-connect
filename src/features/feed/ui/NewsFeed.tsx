import React, { useState, useEffect } from "react";
import { getFeed, createPost } from "@/shared/api/feedService";
import { useAuthStore } from "@/entities/user/useAuth";
import { Post, Sport } from "@/entities/types";
import { toast } from "sonner";
import { Send, Loader2, Users } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * NewsFeed component with post creation, dynamic listing, and real-time community updates.
 * Features an integrated sport and type tag builder.
 */
export function NewsFeed() {
  const currentUser = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [content, setContent] = useState<string>(contentPreset || "");
  const [sport, setSport] = useState<Sport | "">("");
  const [postType, setPostType] = useState<Post["type"]>("TEXT");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  // Allow presets for E2E tests to write to inputs
  // We use this local hook-style binding for easy input handling
  function setContentPreset(val: string) {
    setContent(val);
  }

  useEffect(() => {
    if (!currentUser) return;
    const userId = currentUser.id;
    let active = true;
    async function loadFeed() {
      try {
        setLoading(true);
        const data = await getFeed(userId);
        if (active) {
          setPosts(data);
        }
      } catch (err) {
        console.error("Failed to load feed:", err);
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }
    loadFeed();
    return () => {
      active = false;
    };
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !content.trim()) return;

    try {
      setSubmitting(true);
      const newPost = await createPost(
        currentUser.id,
        content,
        postType,
        mediaUrl || undefined,
        sport || undefined
      );
      
      setPosts((prev) => [newPost, ...prev]);
      setContent("");
      setSport("");
      setPostType("TEXT");
      setMediaUrl("");
      toast.success("¡Publicación compartida con éxito!");
    } catch (err) {
      console.error("Failed to create post:", err);
      toast.error("Error al crear la publicación");
    } finally {
      setSubmitting(false);
    }
  };

  if (!currentUser) return null;

  return (
    <div className="space-y-6">
      {/* Create Post Form */}
      <div className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex gap-3">
            <img src={currentUser.avatar_url} alt="" className="h-10 w-10 rounded-full bg-muted" />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="¿Qué deporte jugaste hoy? Comparte tus logros..."
                className="w-full bg-background/50 border border-border rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none h-20 placeholder:text-muted-foreground"
                id="feed-post-textarea"
                required
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-border/50">
            <div className="flex flex-wrap gap-2 text-xs">
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value as any)}
                className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
                id="feed-post-type"
              >
                <option value="TEXT">Texto</option>
                <option value="MATCH_RESULT">Resultado de Partido</option>
                <option value="PHOTO">Foto</option>
                <option value="SQUAD_ANNOUNCEMENT">Anuncio de Squad</option>
              </select>

              <select
                value={sport}
                onChange={(e) => setSport(e.target.value as any)}
                className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
              >
                <option value="">Deporte (Opcional)</option>
                <option value="Fútbol">Fútbol</option>
                <option value="Básquet">Básquet</option>
                <option value="Tenis">Tenis</option>
                <option value="Pádel">Pádel</option>
                <option value="Vóley">Vóley</option>
                <option value="Running">Running</option>
              </select>

              {postType === "PHOTO" && (
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="URL de la imagen..."
                  className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none text-xs w-40"
                />
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform"
              id="feed-post-submit"
            >
              {submitting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Send className="h-3.5 w-3.5" />
              )}
              Compartir
            </button>
          </div>
        </form>
      </div>

      {/* Feed List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground text-sm gap-2">
          <Loader2 className="h-6 w-6 animate-spin text-neon" />
          <span>Cargando feed de noticias...</span>
        </div>
      ) : (
        <div className="space-y-4" id="feed-posts-list">
          <AnimatePresence>
            {posts.length > 0 ? (
              posts.map((post) => {
                const isMatchResult = post.type === "MATCH_RESULT";
                const isAnnouncement = post.type === "SQUAD_ANNOUNCEMENT";
                
                return (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="bg-gradient-card border border-border rounded-3xl p-5 shadow-card relative overflow-hidden"
                  >
                    <div className="flex gap-3">
                      <img
                        src={post.user_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"}
                        alt=""
                        className="h-10 w-10 rounded-full bg-muted"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">{post.user_name}</span>
                          <span className="text-[10px] text-muted-foreground">
                            Hace unos instantes
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {post.sport && (
                            <span className="px-2 py-0.5 rounded-full bg-violet/20 text-violet-foreground border border-violet/30 text-[9px] font-semibold">
                              {post.sport}
                            </span>
                          )}
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                            isMatchResult 
                              ? "bg-neon/10 text-neon border border-neon/20" 
                              : isAnnouncement 
                                ? "bg-electric/10 text-electric border border-electric/20" 
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {isMatchResult ? "Resultado" : isAnnouncement ? "Anuncio" : "Comunidad"}
                          </span>
                        </div>

                        <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">{post.content}</p>

                        {post.media_url && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-border/50 max-h-60 bg-muted">
                            <img src={post.media_url} alt="" className="w-full h-full object-cover" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground glass rounded-2xl border border-border text-sm">
                No hay publicaciones en tu feed todavía. Sigue a otros jugadores en el Matchmaking para ver sus publicaciones.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// Support preset content for Playwright E2E bindings
let contentPreset = "";
export function setFeedContentPreset(val: string) {
  contentPreset = val;
}
export default NewsFeed;
