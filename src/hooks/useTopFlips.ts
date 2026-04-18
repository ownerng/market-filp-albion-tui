import { useCallback, useEffect, useState } from "react";
import {
  computeTopFlips,
  getPopularItemIds,
  getCachedItemIds,
  type FlipRoute,
} from "../db/queries/topFlips.js";
import { fetchPrices } from "../api/albion-client.js";
import { CITY_IDS } from "../constants/cities.js";
import type { AppSettings } from "../types/settings.js";
import { logger } from "../lib/logger.js";

export interface TopFlipsState {
  flips: FlipRoute[];
  loading: boolean;
  scanning: boolean;
  scanProgress: string;
  error: string | null;
  cachedItemCount: number;
}

export function useTopFlips(settings: AppSettings) {
  const [flips, setFlips] = useState<FlipRoute[]>([]);
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  useEffect(() => {
    setLoading(true);
    try {
      const result = computeTopFlips({
        isPremium: settings.premiumStatus,
        setupFeeRate: settings.setupFeeRate,
        topN: 50,
      });
      setFlips(result);
    } catch (e) {
      logger.error({ err: (e as Error).message }, "computeTopFlips failed");
    } finally {
      setLoading(false);
    }
  }, [tick, settings.premiumStatus, settings.setupFeeRate]);

  const scanPopular = useCallback(async () => {
    if (scanning) return;
    setScanning(true);
    setError(null);
    setScanProgress("Obteniendo ítems populares...");

    try {
      const popularIds = getPopularItemIds(80);
      const cachedIds = new Set(getCachedItemIds());
      const toFetch = popularIds.filter((id) => !cachedIds.has(id));
      const ids = toFetch.length > 0 ? toFetch : popularIds.slice(0, 40);

      setScanProgress(`Escaneando ${ids.length} ítems...`);

      await fetchPrices({
        itemIds: ids,
        qualities: [1],
        locations: [...CITY_IDS],
        region: settings.serverRegion,
        ttlSeconds: settings.cacheTtlSeconds,
      });

      setScanProgress("Calculando flips...");
      refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setScanning(false);
      setScanProgress("");
    }
  }, [scanning, settings.serverRegion, settings.cacheTtlSeconds, refresh]);

  const cachedItemCount = getCachedItemIds().length;

  return { flips, loading, scanning, scanProgress, error, scanPopular, refresh, cachedItemCount };
}
