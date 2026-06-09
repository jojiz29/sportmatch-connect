import React, { useState, useEffect, useRef } from "react";
import { getFeed, createPost } from "@/shared/api/feedService";
import { supabase } from "@/shared/api/supabase";
import { useAuthStore } from "@/entities/user/useAuth";
import { Post, Sport, SportCatalog } from "@/entities/types";
import { toast } from "sonner";
import { apiClient } from "@/shared/api/apiClient";
import { backendApi } from "@/shared/api/backendApi";
import { Send, Loader2, Zap, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PostComments } from "./PostComments";

/**
 * NewsFeed component with post creation, dynamic listing, and real-time updates.
 * Subscribes to Supabase Realtime on the `posts` table to append new posts
 * from followed users without requiring a page refresh.
 */
export function NewsFeed() {
  const currentUser = useAuthStore((state) => state.user);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [content, setContent] = useState<string>(contentPreset || "");
  const [sport, setSport] = useState<Sport | "">("");
  const [sportsList, setSportsList] = useState<string[]>([
    "Pádel",
    "Fútbol",
    "Tenis",
    "Básquet",
    "Vóley",
    "Running",
  ]);

  useEffect(() => {
    // Try backend first for sports, fallback to Supabase
    backendApi.sports
      .getAll()
      .then((res) => {
        const response = res as { data?: SportCatalog[] };
        if (response?.data && response.data.length > 0) {
          setSportsList(response.data.map((s) => s.name));
        }
      })
      .catch(() => {
        apiClient.sports
          .getAll()
          .then((data) => {
            if (data && data.length > 0) {
              setSportsList(data.map((s) => s.name));
            }
          })
          .catch((err) => console.error("Error loading sports in NewsFeed:", err));
      });
  }, []);
  const [postType, setPostType] = useState<Post["type"]>("TEXT");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Track current user ID in a ref so the Realtime callback can reference it
  // without being included in the subscription's dependency array.
  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUser?.id ?? null;

  // ── Initial feed load ───────────────────────────────────────────────────────
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

  // ── Realtime subscription: append new posts as they are inserted ────────────
  useEffect(() => {
    if (!currentUser) return;

    // Key the channel on user ID so re-renders don't create duplicates.
    const channelName = `feed-realtime-${currentUser.id}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts" },
        async (payload) => {
          try {
            const newRow = payload.new as {
              id: string;
              user_id: string;
              content: string;
              type: string;
              created_at: string;
              media_url: string | null;
              sport: string | null;
            };

            // Skip own posts — already added optimistically by handleSubmit
            if (newRow.user_id === currentUserIdRef.current) return;

            // Fetch the author profile for display
            const { data: profile, error } = await supabase
              .from("profiles")
              .select("name, avatar_url")
              .eq("id", newRow.user_id)
              .single();

            if (error) {
              console.error("Error fetching user profile for realtime post:", error);
            }

            const post: Post = {
              id: newRow.id,
              user_id: newRow.user_id,
              content: newRow.content,
              type: newRow.type as Post["type"],
              created_at: newRow.created_at,
              media_url: newRow.media_url || undefined,
              sport: (newRow.sport as Post["sport"]) || undefined,
              user_name: profile?.name || "Deportista",
              user_avatar: profile?.avatar_url || "",
            };

            setPosts((prev) => {
              // Deduplicate: skip if this post is already in state
              if (prev.some((p) => p.id === post.id)) return prev;
              return [post, ...prev];
            });
          } catch (err) {
            console.error("Error processing realtime insert event:", err);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // Only re-subscribe when the user identity changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ── Post submission ─────────────────────────────────────────────────────────
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
        sport || undefined,
      );

      // Optimistic prepend — Realtime will skip it via the user_id guard above
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
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
            <img
              src={currentUser.avatar_url}
              alt=""
              className="h-10 w-10 rounded-full bg-muted object-cover"
            />
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
                onChange={(e) => setPostType(e.target.value as Post["type"])}
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
                onChange={(e) => setSport(e.target.value as Sport | "")}
                className="bg-background/80 border border-border rounded-lg px-2.5 py-1.5 focus:outline-none text-xs"
              >
                <option value="">Deporte (Opcional)</option>
                {sportsList.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
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

      {/* Live indicator */}
      <div className="flex items-center gap-2 text-xs text-neon font-semibold">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>En vivo — Los nuevos posts aparecen automáticamente</span>
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
                const timeAgo = getTimeAgo(post.created_at);

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
                        src={
                          post.user_avatar || "https://api.dicebear.com/7.x/avataaars/svg?seed=User"
                        }
                        alt=""
                        className="h-10 w-10 rounded-full bg-muted object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm truncate">{post.user_name}</span>
                          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {post.sport && (
                            <span className="px-2 py-0.5 rounded-full bg-violet/20 text-violet-foreground border border-violet/30 text-[9px] font-semibold">
                              {post.sport}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              isMatchResult
                                ? "bg-neon/10 text-neon border border-neon/20"
                                : isAnnouncement
                                  ? "bg-electric/10 text-electric border border-electric/20"
                                  : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isMatchResult ? "Resultado" : isAnnouncement ? "Anuncio" : "Comunidad"}
                          </span>
                        </div>

                        <p className="text-sm text-foreground mt-3 whitespace-pre-wrap">
                          {post.content}
                        </p>

                        {post.media_url && (
                          <div className="mt-3 rounded-xl overflow-hidden border border-border/50 max-h-60 bg-muted">
                            <img
                              src={post.media_url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}

                        <button
                          onClick={() =>
                            setExpandedPostId(expandedPostId === post.id ? null : post.id)
                          }
                          className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-neon transition-colors"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          <span>Comentar</span>
                        </button>
                      </div>
                    </div>

                    <AnimatePresence>
                      {expandedPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 198 }}
                          className="overflow-hidden"
                        >
                          <PostComments postId={post.id} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            ) : (
              <div className="p-8 text-center text-muted-foreground glass rounded-2xl border border-border text-sm">
                No hay publicaciones en tu feed todavía. Sigue a otros jugadores en el Matchmaking
                para ver sus publicaciones.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

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

// Support preset content for Playwright E2E bindings
const contentPreset = "";
export default NewsFeed;
