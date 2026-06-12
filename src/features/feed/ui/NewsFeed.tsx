// === BLOQUE: IMPORTACIÓN DE DEPENDENCIAS ===
// Hooks de React: useState para estado local, useEffect para efectos secundarios,
// useRef para referencias mutables sin re-renderizado.
import React, { useState, useEffect, useRef } from "react";
// Servicios de API: getFeed obtiene el feed del usuario, createPost crea una nueva publicación.
import { getFeed, createPost } from "@/shared/api/feedService";
// Cliente de Supabase para suscripciones Realtime y consultas directas.
import { supabase } from "@/shared/api/supabase";
// Store de autenticación para identificar al usuario actual.
import { useAuthStore } from "@/entities/user/useAuth";
// Tipos compartidos: Post, Sport, SportCatalog (catálogo de deportes).
import { Post, Sport, SportCatalog } from "@/entities/types";
// Notificaciones toast para feedback visual al usuario.
import { toast } from "sonner";
// Cliente API unificado con soporte de mocks y failover.
import { apiClient } from "@/shared/api/apiClient";
// Cliente del backend NestJS para operaciones que requieren lógica de servidor.
import { backendApi } from "@/shared/api/backendApi";
// Iconos de Lucide para la interfaz del feed.
import { Send, Loader2, Zap, MessageCircle, AlertTriangle, ShieldAlert, Image } from "lucide-react";
// Framer Motion para animaciones de entrada/salida de posts y comentarios.
import { motion, AnimatePresence } from "framer-motion";
// Componente de comentarios anidados dentro de cada publicación.
import { PostComments } from "./PostComments";
// Modal de reporte para denunciar contenido inapropiado.
import { ReportModal } from "@/components/ReportModal";
// Skeleton loader para estado de carga del feed.
import { SkeletonLoader } from "@/components/SkeletonLoader";
// Hook de moderación AI para analizar imágenes NSFW en el cliente.
import { useNSFWJS } from "@/shared/hooks/useNSFWJS";

// === BLOQUE: MAPA DE EMOJIS POR DEPORTE ===
// Asocia nombres de deportes a emojis para mostrar en los pills de selección.
const SPORT_EMOJIS: Record<string, string> = {
  Pádel: "🏓",
  Fútbol: "⚽",
  Tenis: "🎾",
  Básquet: "🏀",
  Vóley: "🏐",
  Running: "🏃",
  Gimnasio: "🏋️",
  Calistenia: "🤸",
  Natación: "🏊",
  Ciclismo: "🚴",
  "Boxeo / MMA": "🥊",
  Béisbol: "⚾",
  Golf: "⛳",
};

// === BLOQUE: COMPONENTE PRINCIPAL ===
// Componente de feed de noticias con creación de posts, listado dinámico
// y actualizaciones en tiempo real vía Supabase Realtime.
export function NewsFeed() {
  // Usuario autenticado actualmente.
  const currentUser = useAuthStore((state) => state.user);
  // Lista de publicaciones del feed.
  const [posts, setPosts] = useState<Post[]>([]);
  // Indicador de carga inicial del feed.
  const [loading, setLoading] = useState<boolean>(true);
  // Contenido del texto del nuevo post (textarea).
  const [content, setContent] = useState<string>(contentPreset || "");
  // Deporte seleccionado para el nuevo post (filtro/etiqueta).
  const [sport, setSport] = useState<Sport | "">("");
  // Lista de nombres de deportes obtenida del backend o Supabase.
  const [sportsList, setSportsList] = useState<string[]>([
    "Pádel",
    "Fútbol",
    "Tenis",
    "Básquet",
    "Vóley",
    "Running",
  ]);

  // === BLOQUE: CARGA DEL CATÁLOGO DE DEPORTES ===
  // Intenta obtener la lista del backend NestJS primero; si falla, usa Supabase.
  useEffect(() => {
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
  // Estado para mostrar/ocultar el área de subida de imágenes.
  const [showImageDropzone, setShowImageDropzone] = useState<boolean>(false);
  // URL de la imagen previsualizada (puede ser blob: o URL remota).
  const [mediaUrl, setMediaUrl] = useState<string>("");
  // Indicador de envío en curso (para deshabilitar el botón y mostrar spinner).
  const [submitting, setSubmitting] = useState<boolean>(false);
  // ID del post expandido actualmente (para mostrar comentarios).
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);

  // Estados para drag-and-drop de imágenes y moderación de contenido.
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // Referencia al input file oculto para disparar el diálogo de selección.
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Archivo de imagen seleccionado (File) para subir al servidor.
  const [imageFile, setImageFile] = useState<File | null>(null);
  // Registro de posts cuyo contenido sensible ha sido revelado por el usuario.
  const [revealedPosts, setRevealedPosts] = useState<Record<string, boolean>>({});
  // Estado del modal de reporte.
  const [isReportOpen, setIsReportOpen] = useState(false);
  // Objeto destino del reporte: puede ser un post o un comentario.
  const [reportTarget, setReportTarget] = useState<{ id: string; type: "post" | "comment" } | null>(
    null,
  );

  // Hook de moderación AI para analizar imágenes antes de subirlas.
  const { analyzeImage } = useNSFWJS();
  const [isAnalyzingImage, setIsAnalyzingImage] = useState<boolean>(false);

  // === BLOQUE: EFECTO DEL TOUR DE DEMOSTRACIÓN ===
  // Si la URL contiene ?tour=true, abre la zona de subida automáticamente
  // para facilitar la demostración frente al jurado (Capstone Jury Tour).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("tour") === "true") {
      setShowImageDropzone(true);
    }
  }, []);

  // === BLOQUE: LIMPIEZA DE MEMORIA (BLOB URLS) ===
  // Revoca las URLs de tipo blob: al desmontar o cambiar la URL para evitar
  // fugas de memoria (SEC-04, Task 2.4).
  useEffect(() => {
    return () => {
      if (mediaUrl && mediaUrl.startsWith("blob:")) {
        URL.revokeObjectURL(mediaUrl);
      }
    };
  }, [mediaUrl]);

  // === BLOQUE: MANEJADOR DE ARCHIVO DE IMAGEN ===
  // Valida el archivo (tamaño, tipo), crea una vista previa local y
  // ejecuta el análisis NSFWJS para moderación automática.
  const handleImageFile = async (file: File) => {
    if (isAnalyzingImage) {
      toast.error("Ya hay un análisis de imagen en curso. Por favor, espere.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("El archivo supera el límite de 5MB");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Por favor, selecciona un archivo de imagen válido");
      return;
    }

    // Crea una URL local temporal para la previsualización inmediata.
    const localUrl = URL.createObjectURL(file);
    setMediaUrl(localUrl);
    setImageFile(file);
    setIsAnalyzingImage(true);

    try {
      // Ejecuta el modelo NSFWJS en el navegador para detectar contenido sensible.
      const isSafe = await analyzeImage(file);
      if (!isSafe) {
        // Imagen bloqueada: revoca la URL y muestra error.
        setImageFile(null);
        setMediaUrl("");
        URL.revokeObjectURL(localUrl);
        toast.error(
          "Contenido Bloqueado: Esta imagen no cumple con nuestras políticas de seguridad.",
          {
            className: "bg-red-500 text-white border-red-600",
          },
        );
      } else {
        toast.success("Imagen cargada correctamente");
      }
    } catch (error) {
      console.error("Error checking image safety:", error);
      // Si el análisis falla (ej. modelo no cargado), se acepta la imagen como segura.
      toast.success("Imagen cargada correctamente");
    } finally {
      setIsAnalyzingImage(false);
    }
  };

  // Ref mutable para el ID del usuario actual, usado dentro del callback Realtime
  // sin depender del closure del estado (evita re-suscripciones).
  const currentUserIdRef = useRef<string | null>(null);
  currentUserIdRef.current = currentUser?.id ?? null;

  // ── Carga inicial del feed ─────────────────────────────────────────────────────
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

  // ── Suscripción Realtime: agrega nuevos posts sin recargar ────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // El nombre del canal incluye el ID del usuario para evitar duplicados en re-renderizados.
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

            // Salta los posts propios porque ya se agregaron optimistamente en handleSubmit.
            if (newRow.user_id === currentUserIdRef.current) return;

            // Obtiene el perfil del autor para mostrar nombre y avatar.
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
              // Deduplicación: evita agregar un post que ya existe en el estado.
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
    // Solo se re-suscribe cuando cambia la identidad del usuario.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  // ── Envío de nueva publicación ───────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !content.trim() || isAnalyzingImage) return;

    try {
      setSubmitting(true);

      // Detecta automáticamente el tipo de post según si hay imagen adjunta (Task 2.1).
      const inferredPostType = imageFile ? "PHOTO" : "TEXT";

      const newPost = await createPost(
        currentUser.id,
        content,
        inferredPostType,
        mediaUrl || undefined,
        sport || undefined,
        imageFile || undefined,
      );

      // Inserta optimistamente el nuevo post al inicio del feed.
      // Realtime lo omitirá gracias al guard de user_id.
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [newPost, ...prev];
      });
      setContent("");
      setSport("");
      setMediaUrl("");
      setImageFile(null);
      setShowImageDropzone(false);
      toast.success("¡Publicación compartida con éxito!");
    } catch (err) {
      console.error("Failed to create post:", err);
      toast.error("Error al crear la publicación");
    } finally {
      setSubmitting(false);
    }
  };

  // Si no hay usuario autenticado, no renderiza nada.
  if (!currentUser) return null;

  // === BLOQUE: RENDERIZADO PRINCIPAL ===
  return (
    <div className="space-y-6">
      {/* ── Formulario de creación de post ── */}
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

          {/* ── Pills de selección de deporte con emojis (Sprint 3.6) ── */}
          <div className="space-y-1.5 pt-2 border-t border-border/20">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide block mb-1">
              ¿De qué deporte vas a postear?
            </span>
            <div className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
              {sportsList.map((sportName) => {
                const emoji = SPORT_EMOJIS[sportName] || "🏆";
                const isSelected = sport === sportName;
                return (
                  <button
                    key={sportName}
                    type="button"
                    onClick={() => setSport(isSelected ? "" : (sportName as Sport))}
                    className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                      isSelected
                        ? "bg-gradient-neon text-neon-foreground shadow-neon border-transparent font-black"
                        : "bg-muted border-border/45 text-foreground hover:bg-accent"
                    }`}
                  >
                    <span className="text-sm">{emoji}</span>
                    <span>{sportName}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-border/30">
            {/* ── Botón de Foto/Video y botón de Compartir ── */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowImageDropzone(!showImageDropzone)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                    showImageDropzone || mediaUrl
                      ? "bg-primary/10 text-primary border-primary/30 shadow-neon"
                      : "bg-muted border-border/45 text-foreground hover:bg-accent"
                  }`}
                >
                  <Image className="h-4 w-4 shrink-0" />
                  <span>Foto / Video</span>
                </button>
              </div>

              <button
                type="submit"
                disabled={submitting || isAnalyzingImage || !content.trim()}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-primary text-primary-foreground font-semibold text-xs shadow-glow disabled:opacity-50 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
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

            {/* ── Zona de drag-and-drop colapsable ── */}
            {(showImageDropzone || mediaUrl) && (
              <div className="w-full animate-slide-up" id="news-feed-dropzone-tour">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleImageFile(file);
                  }}
                  accept="image/*"
                  className="hidden"
                />
                {mediaUrl ? (
                  <div className="relative mt-2 rounded-xl overflow-hidden border border-border/50 max-h-48 bg-muted group animate-scale-in">
                    <img src={mediaUrl} alt="Preview" className="w-full h-full object-cover" />
                    {isAnalyzingImage && (
                      <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-md flex flex-col items-center justify-center gap-2 z-10 border-2 rounded-xl"
                        style={{ animation: "pulseBorder 2s infinite ease-in-out" }}
                      >
                        <style>{`
                          @keyframes pulseBorder {
                            0% { border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                            50% { border-color: rgba(239, 68, 68, 0.9); box-shadow: 0 0 15px 4px rgba(239, 68, 68, 0.5); }
                            100% { border-color: rgba(255, 255, 255, 0.8); box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.4); }
                          }
                        `}</style>
                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                        <span className="text-xs font-black text-white tracking-wide uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                          🛡️ Escaneando contenido...
                        </span>
                      </div>
                    )}
                    {!isAnalyzingImage && (
                      <button
                        type="button"
                        onClick={() => {
                          setMediaUrl("");
                          setImageFile(null);
                        }}
                        className="absolute top-2 right-2 px-2.5 py-1 text-xs font-bold rounded-lg bg-red-500/80 text-white hover:bg-red-600 transition-colors cursor-pointer"
                      >
                        Quitar foto
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) handleImageFile(file);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`mt-2 border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1 ${
                      isDragging
                        ? "border-primary bg-primary/5 text-primary"
                        : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span className="text-xs md:text-sm font-semibold">
                      Arrastra y suelta tu imagen aquí
                    </span>
                    <span className="text-[10px] md:text-xs">
                      O haz clic para explorar (máximo 5MB)
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Indicador de que el feed está en vivo con Realtime */}
      <div className="flex items-center gap-2 text-xs text-neon font-semibold">
        <Zap className="h-3 w-3 animate-pulse" />
        <span>En vivo — Los nuevos posts aparecen automáticamente</span>
      </div>

      {/* ── Lista de publicaciones del feed ── */}
      {loading ? (
        <div className="space-y-4">
          <SkeletonLoader type="post-feed" count={2} />
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

                        {/* ── Filtro de contenido sensible (Task 2.2) ── */}
                        {!!(post.sensitive || post.flagged) && !revealedPosts[post.id] ? (
                          <div className="relative mt-3 p-4 rounded-2xl bg-destructive/10 border border-destructive/20 overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-scale-in">
                            <div className="flex items-start gap-2 text-xs md:text-sm text-red-500 font-semibold leading-normal">
                              <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
                              <div>
                                <p className="font-bold">Contenido Sensible</p>
                                <p className="text-[11px] text-red-400 font-medium mt-0.5">
                                  Esta publicación ha sido identificada como potencialmente delicada
                                  o inapropiada.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setRevealedPosts((prev) => ({ ...prev, [post.id]: true }))
                              }
                              className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-red-500 text-white hover:bg-red-600 transition-all shadow-glow shadow-red-500/10 shrink-0 cursor-pointer"
                            >
                              Mostrar Contenido
                            </button>
                          </div>
                        ) : (
                          <>
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
                          </>
                        )}

                        {/* ── Acciones del post: comentar y reportar ── */}
                        <div className="flex gap-4 items-center mt-3">
                          <button
                            onClick={() =>
                              setExpandedPostId(expandedPostId === post.id ? null : post.id)
                            }
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                          >
                            <MessageCircle className="h-3.5 w-3.5" />
                            <span>Comentar</span>
                          </button>

                          <button
                            onClick={() => {
                              setReportTarget({ id: post.id, type: "post" });
                              setIsReportOpen(true);
                            }}
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 transition-colors cursor-pointer"
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Reportar</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Sección expandible de comentarios ── */}
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

      {/* ── Modal de reporte ── */}
      {reportTarget && (
        <ReportModal
          isOpen={isReportOpen}
          onClose={() => {
            setIsReportOpen(false);
            setReportTarget(null);
          }}
          targetId={reportTarget.id}
          targetType={reportTarget.type}
        />
      )}
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────────

// Calcula el tiempo transcurrido desde una fecha ISO hasta ahora, en formato legible.
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

// Contenido predeterminado vacío para enlaces de pruebas E2E con Playwright.
const contentPreset = "";
export default NewsFeed;
