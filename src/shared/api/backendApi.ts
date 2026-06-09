const API_URL = (import.meta.env.VITE_API_URL || "") + "/api/v1";

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return { error: errorData.message || errorData.error || `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { data };
  } catch (err) {
    return { error: (err as Error).message };
  }
}

export const backendApi = {
  auth: {
    async getProfile(token: string) {
      return fetchApi("/auth/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    async updateProfile(token: string, data: { name?: string; bio?: string; avatar_url?: string }) {
      return fetchApi("/auth/profile", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },

    async verifyToken(token: string) {
      return fetchApi("/auth/verify", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },

  matches: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/matches?sport=${encodeURIComponent(sport)}` : "/matches";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/matches/${id}`);
    },

    async create(
      token: string,
      match: {
        title: string;
        sport: string;
        court_id?: string;
        date: string;
        time: string;
        max_players: number;
        required_level: string;
      },
    ) {
      return fetchApi("/matches", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(match),
      });
    },

    async update(
      token: string,
      id: string,
      data: {
        title?: string;
        sport?: string;
        court_id?: string;
        date?: string;
        time?: string;
        max_players?: number;
        required_level?: string;
        status?: string;
      },
    ) {
      return fetchApi(`/matches/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },

    async delete(token: string, id: string) {
      return fetchApi(`/matches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    async join(token: string, matchId: string) {
      return fetchApi(`/matches/${matchId}/join`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    async leave(token: string, matchId: string) {
      return fetchApi(`/matches/${matchId}/leave`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },

  courts: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/courts?sport=${encodeURIComponent(sport)}` : "/courts";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/courts/${id}`);
    },

    async create(
      token: string,
      court: {
        name: string;
        sport: string;
        price_per_hour: number;
        lat: number;
        lng: number;
        address?: string;
        max_players?: number;
        operating_hours?: string[];
        amenities?: string[];
      },
    ) {
      return fetchApi("/courts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(court),
      });
    },

    async update(
      token: string,
      id: string,
      data: {
        name?: string;
        sport?: string;
        price_per_hour?: number;
        is_available?: boolean;
        amenities?: string[];
      },
    ) {
      return fetchApi(`/courts/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },

    async addReview(
      token: string,
      courtId: string,
      review: {
        rating: number;
        comment?: string;
      },
    ) {
      return fetchApi(`/courts/${courtId}/reviews`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(review),
      });
    },
  },

  profiles: {
    async getById(id: string) {
      return fetchApi(`/profiles/${id}`);
    },

    async update(
      token: string,
      id: string,
      data: {
        name?: string;
        bio?: string;
        avatar_url?: string;
        city?: string;
        preferred_sports?: string[];
        sport_preferences?: Record<string, unknown>;
      },
    ) {
      return fetchApi(`/profiles/${id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },

    async getByUserId(userId: string) {
      return fetchApi(`/profiles/user/${userId}`);
    },
  },

  posts: {
    async getAll(sport?: string) {
      const endpoint = sport ? `/posts?sport=${encodeURIComponent(sport)}` : "/posts";
      return fetchApi(endpoint);
    },

    async getById(id: string) {
      return fetchApi(`/posts/${id}`);
    },

    async create(
      token: string,
      post: {
        content: string;
        type?: string;
        sport?: string;
        media_url?: string;
      },
    ) {
      return fetchApi("/posts", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(post),
      });
    },

    async delete(token: string, id: string) {
      return fetchApi(`/posts/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    async addComment(
      token: string,
      postId: string,
      comment: {
        content: string;
        parent_id?: string;
      },
    ) {
      return fetchApi(`/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(comment),
      });
    },

    async addReaction(
      token: string,
      postId: string,
      reaction: {
        comment_id: string;
        reaction_type: string;
      },
    ) {
      return fetchApi(`/posts/${postId}/reactions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(reaction),
      });
    },
  },

  health: {
    async check() {
      return fetchApi("/health");
    },
  },

  users: {
    async getAll(excludeUserId?: string) {
      const endpoint = excludeUserId ? `/users?excludeUserId=${excludeUserId}` : "/users";
      return fetchApi(endpoint);
    },

    async getLeaderboard() {
      return fetchApi("/users/leaderboard");
    },
  },

  wallet: {
    async getBalance(userId: string) {
      return fetchApi(`/wallet/${userId}/balance`);
    },

    async getTransactions(userId: string) {
      return fetchApi(`/wallet/${userId}/transactions`);
    },

    async createTransaction(
      token: string,
      data: {
        user_id: string;
        amount: number;
        description: string;
        type: "EARN" | "SPEND";
      },
    ) {
      return fetchApi("/wallet/transactions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },
  },

  sports: {
    async getAll() {
      return fetchApi("/sports");
    },
  },

  bookings: {
    async getByCourtAndDate(courtId: string, date: string) {
      return fetchApi(`/bookings?courtId=${courtId}&date=${date}`);
    },

    async create(
      token: string,
      data: {
        court_id: string;
        date: string;
        time: string;
        user_id: string;
      },
    ) {
      return fetchApi("/bookings", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
    },
  },
};

export default backendApi;
