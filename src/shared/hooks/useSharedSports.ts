// ============================================================
// useSharedSports.ts — Carga lista de deportes desde Supabase
// ============================================================

import { useEffect, useState } from "react";
import { supabase } from "@/shared/api/supabase";

export interface Sport {
  id: string;
  name: string;
  icon_slug: string | null;
}

export function useSharedSports() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const { data, error: e } = await supabase
          .from("sports")
          .select("id, name, icon_slug")
          .order("name");
        if (!active) return;
        if (e) {
          setError(e.message);
        } else {
          setSports(data || []);
        }
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Error");
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, []);

  return { sports, loading, error };
}
