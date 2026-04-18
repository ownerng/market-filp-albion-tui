import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { useTopFlips } from "../hooks/useTopFlips.js";
import { formatSilver, formatPercent, formatAge } from "../lib/formatters.js";
import type { FlipRoute } from "../db/queries/topFlips.js";
import type { AppSettings } from "../types/settings.js";

interface Props {
  focused: boolean;
  settings: AppSettings;
}

function shorten(name: string, max: number): string {
  if (name.length <= max) return name;
  return name.slice(0, max - 1) + "…";
}

export function TopFlips({ focused, settings }: Props) {
  const { flips, scanning, scanProgress, error, scanPopular, refresh, cachedItemCount } =
    useTopFlips(settings);
  const [offset, setOffset] = useState(0);
  const visibleRows = 18;

  useEffect(() => {
    const maxOffset = Math.max(0, flips.length - visibleRows);
    if (offset > maxOffset) setOffset(maxOffset);
  }, [flips.length, offset]);

  useInput(
    (input) => {
      if ((input === "s" || input === "S") && !scanning) {
        scanPopular();
      }
      if (input === "r" || input === "R") {
        refresh();
      }
    },
    { isActive: focused },
  );

  useInput(
    (_input, key) => {
      if (flips.length === 0) return;
      const maxOffset = Math.max(0, flips.length - visibleRows);
      if (key.upArrow) setOffset((o) => Math.max(0, o - 1));
      else if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1));
      else if (key.pageUp) setOffset((o) => Math.max(0, o - visibleRows));
      else if (key.pageDown) setOffset((o) => Math.min(maxOffset, o + visibleRows));
    },
    { isActive: focused },
  );

  const visible = flips.slice(offset, offset + visibleRows);
  const scrollInfo =
    flips.length > visibleRows
      ? ` · ${offset + 1}-${Math.min(offset + visibleRows, flips.length)}/${flips.length}`
      : "";

  const feesLabel = settings.premiumStatus ? "2.5% + 4%" : "2.5% + 8%";

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="magenta" paddingX={1}>
      <Text bold color="magenta">
        TOP FLIPS — {flips.length} oportunidades{scrollInfo} · Cache: {cachedItemCount} ítems ·
        Fees: {feesLabel}
      </Text>

      {scanning && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> {scanProgress}</Text>
        </Box>
      )}

      {error && <Text color="red">Error: {error}</Text>}

      {flips.length > 0 && (
        <>
          <Box>
            <Box width={4}>
              <Text dimColor>#</Text>
            </Box>
            <Box width={16}>
              <Text dimColor>Ítem</Text>
            </Box>
            <Box width={18}>
              <Text dimColor>Ruta</Text>
            </Box>
            <Box width={10}>
              <Text dimColor>Compra</Text>
            </Box>
            <Box width={10}>
              <Text dimColor>Venta</Text>
            </Box>
            <Box width={10}>
              <Text dimColor>Neto/u</Text>
            </Box>
            <Box width={8}>
              <Text dimColor>ROI</Text>
            </Box>
            <Box width={6}>
              <Text dimColor>Edad</Text>
            </Box>
          </Box>
          {visible.map((r, i) => {
            const rank = offset + i + 1;
            const isTop3 = rank <= 3;
            return (
              <Box key={`${r.itemId}-${r.buyCity}-${r.sellCity}-${i}`}>
                <Box width={4}>
                  <Text color={isTop3 ? "yellow" : undefined} bold={isTop3}>
                    {rank}.
                  </Text>
                </Box>
                <Box width={16}>
                  <Text wrap="truncate" bold={isTop3}>
                    {shorten(r.itemName, 16)}
                  </Text>
                </Box>
                <Box width={18}>
                  <Text wrap="truncate">{`${shorten(r.buyCity, 7)} → ${shorten(r.sellCity, 7)}`}</Text>
                </Box>
                <Box width={10}>
                  <Text wrap="truncate">{formatSilver(r.buyPrice)}</Text>
                </Box>
                <Box width={10}>
                  <Text wrap="truncate">{formatSilver(r.sellPrice)}</Text>
                </Box>
                <Box width={10}>
                  <Text color={r.profitPerUnit > 0 ? "green" : "red"} wrap="truncate">
                    {r.profitPerUnit > 0 ? "+" : ""}
                    {formatSilver(Math.round(r.profitPerUnit))}
                  </Text>
                </Box>
                <Box width={8}>
                  <Text
                    color={r.roiPct >= 20 ? "green" : r.roiPct >= 5 ? "yellow" : "red"}
                    wrap="truncate"
                  >
                    {formatPercent(r.roiPct)}
                  </Text>
                </Box>
                <Box width={6}>
                  <Text dimColor>{formatAge(Date.now() - r.ageMs)}</Text>
                </Box>
              </Box>
            );
          })}
        </>
      )}

      {!scanning && flips.length === 0 && (
        <Box flexDirection="column">
          <Text dimColor>No hay datos cacheados para calcular flips.</Text>
          <Text dimColor>
            Pulsá [S] para escanear ítems populares o buscá ítems en la vista Main.
          </Text>
        </Box>
      )}

      <Text dimColor>[S]Escanear ítems [R]Refrescar ↑↓ PgUp/PgDn navegar</Text>
    </Box>
  );
}
