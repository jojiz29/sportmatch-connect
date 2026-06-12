/**
 * ===================================================================
 * ARCHIVO: src/shared/api/useBackendPosts.ts
 * PROPÓSITO: Hooks de TanStack Query para operaciones CRUD de posts
 *            contra el backend NestJS.
 * INCLUYE: Consulta, creación, eliminación, comentarios y reacciones.
 * ===================================================================
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { backendApi } from "@/shared/api/backendApi";
import { Post } from "@/entities/types";
import { toast } from "sonner";

/**
 * useGetPostByIdQuery(): Hook para obtener un post por ID
 */
export function useGetPostByIdQuery(id: string) {
  return useQuery({
    queryKey: ["backendPost", id],
    queryFn: async () => {
      const { data, error } = await backendApi.posts.getById(id);
      if (error) throw new Error(error);
      return data as Post;
    },
  });
}

/**
 * useBackendPosts(): Hook principal de gestión de posts
 * ------------------------------------------------------------------
 * Provee:
 *   - posts:       Lista de posts
 *   - createPost:  Crear nuevo post
 *   - deletePost:  Eliminar post
 *   - addComment:  Agregar comentario a un post
 *   - addReaction: Reaccionar a un comentario
 *
 * Cada mutación invalida "backendPosts" al completarse para
 * refrescar automáticamente el feed.
 */
export function useBackendPosts() {
  const queryClient = useQueryClient();

  const postsQuery = useQuery({
    queryKey: ["backendPosts"],
    queryFn: async () => {
      const { data, error } = await backendApi.posts.getAll();
      if (error) throw new Error(error);
      return data as Post[];
    },
  });

  const createPostMutation = useMutation({
    mutationFn: async (post: {
      content: string;
      type?: string;
      sport?: string;
      media_url?: string;
    }) => {
      const { data, error } = await backendApi.posts.create("", post);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendPosts"] });
      toast.success("Post publicado");
    },
    onError: (err: Error) => {
      toast.error("Error al publicar", { description: err.message });
    },
  });

  const deletePostMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await backendApi.posts.delete("", id);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendPosts"] });
      toast.info("Post eliminado");
    },
    onError: (err: Error) => {
      toast.error("Error al eliminar", { description: err.message });
    },
  });

  const addCommentMutation = useMutation({
    mutationFn: async ({
      postId,
      comment,
    }: {
      postId: string;
      comment: { content: string; parent_id?: string };
    }) => {
      const { data, error } = await backendApi.posts.addComment("", postId, comment);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["backendPosts"] });
      toast.success("Comentario agregado");
    },
    onError: (err: Error) => {
      toast.error("Error al agregar comentario", { description: err.message });
    },
  });

  const addReactionMutation = useMutation({
    mutationFn: async ({
      postId,
      reaction,
    }: {
      postId: string;
      reaction: { comment_id: string; reaction_type: string };
    }) => {
      const { data, error } = await backendApi.posts.addReaction("", postId, reaction);
      if (error) throw new Error(error);
      return data;
    },
    onSuccess: () => {
      toast.success("Reacción agregada");
    },
    onError: (err: Error) => {
      toast.error("Error al agregar reacción", { description: err.message });
    },
  });

  return {
    posts: postsQuery.data || [],
    isLoading: postsQuery.isLoading,
    error: postsQuery.error,
    createPost: createPostMutation.mutate,
    deletePost: deletePostMutation.mutate,
    addComment: addCommentMutation.mutate,
    addReaction: addReactionMutation.mutate,
    isCreating: createPostMutation.isPending,
    isDeleting: deletePostMutation.isPending,
    isCommenting: addCommentMutation.isPending,
    isReacting: addReactionMutation.isPending,
  };
}
