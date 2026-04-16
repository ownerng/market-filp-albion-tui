import { useEffect, useRef, useState } from "react";
import { readCache } from "../db/queries/prices.js";
import { fetchPrices } from "../api/albion-client.js";
import { CITY_IDS } from "../constants/cities.js";
import type { PriceCacheRow } from "../db/schema.js";
import type { AppSettings } from "../types/settings.js";
import { logger } from "../lib/logger.js";

interface Options {
  itemId: string | null;
  quality: number;
  settings: AppSettings;
  forceRefresh?: number;
}

export function usePrices({ itemId, quality, settings, forceRefresh }: Options) {
  const [rows, setRows] = useState<PriceCacheRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    setError(null);

    if (!itemId) {
      setRows([]);
      setLoading(false);
      return;
    }

    const cities = [...CITY_IDS];
    const cached = readCache(itemId, [quality], cities);
    setRows(cached);

    const now = Date.now();
    const freshMap = new Map(cached.map((r) => [`${r.city}|${r.quality}`, r]));
    const stale =
      forceRefresh !== undefined ||
      cities.some((c) => {
        const key = `${c}|${quality}`;
        const r = freshMap.get(key);
        return !r || now - r.updatedAt > r.ttlSeconds * 1000;
      });

    if (!stale) {
      setLoading(false);
      return;
    }

    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setLoading(true);

    fetchPrices({
      itemIds: [itemId],
      qualities: [quality],
      locations: cities,
      region: settings.serverRegion,
      ttlSeconds: settings.cacheTtlSeconds,
      signal: ctrl.signal,
    })
      .then(() => {
        if (ctrl.signal.aborted) return;
        const next = readCache(itemId, [quality], cities);
        setRows(next);
      })
      .catch((err: Error) => {
        if (ctrl.signal.aborted) return;
        logger.warn({ err: err.message, itemId }, "fetchPrices failed");
        setError(err.message);
      })
      .finally(() => {
        if (ctrl.signal.aborted) return;
        setLoading(false);
      });

    return () => {
      ctrl.abort();
      setLoading(false);
    };
  }, [itemId, quality, settings.serverRegion, settings.cacheTtlSeconds, forceRefresh]);

  return { rows, loading, error };
}
