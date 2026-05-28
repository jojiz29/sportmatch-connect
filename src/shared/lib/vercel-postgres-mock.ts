// Client-side mock for @vercel/postgres to prevent bundling Node-native dependencies in the browser.

export const createPool = () => {
  return {
    query: async () => {
      throw new Error("Vercel Postgres pool.query is not available in the browser.");
    },
    end: async () => {},
  };
};

export const createClient = () => {
  return {
    connect: async () => {},
    query: async () => {
      throw new Error("Vercel Postgres client.query is not available in the browser.");
    },
    end: async () => {},
  };
};

export const sql = () => {
  throw new Error("Vercel Postgres sql tag is not available in the browser.");
};

export const db = {
  query: async () => {
    throw new Error("Vercel Postgres db.query is not available in the browser.");
  },
};
