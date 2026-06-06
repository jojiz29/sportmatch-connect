const API_URL = import.meta.env.VITE_API_URL || '';

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      return { error };
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
      return fetchApi('/auth/profile', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },

    async verifyToken(token: string) {
      return fetchApi('/auth/verify', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    },
  },

  health: {
    async check() {
      return fetchApi('/health');
    },
  },
};

export default backendApi;