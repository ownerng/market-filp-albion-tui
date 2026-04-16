import { useEffect, useState } from "react";
import { searchItems } from "../db/queries/items.js";
import type { ItemRow } from "../db/schema.js";

export function useItems(query: string, tier: number | null = null, debounceMs = 250, limit = 500) {
  const [results, setResults] = useState<ItemRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    const handle = setTimeout(() => {
      try {
        const rows = searchItems(query, limit, tier);
        setResults(rows);
      } finally {
        setLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(handle);
  }, [query, tier, debounceMs, limit]);

  return { results, loading };
}
