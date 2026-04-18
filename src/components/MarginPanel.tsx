import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { PriceCacheRow } from "../db/schema.js";
import { computeBestRoutes, type Route } from "../lib/margin.js";
import { formatSilver, formatPercent, formatAge } from "../lib/formatters.js";

interface Props {
  rows: PriceCacheRow[];
  isPremium: boolean;
  setupFeeRate: number;
  focused?: boolean;
  visibleRows?: number;
  compact?: boolean;
}

type Entry = { kind: "row"; data: Route; loss: boolean } | { kind: "sep"; label: string };

export function MarginPanel({ rows, isPremium, setupFeeRate, focused = false, visibleRows = 6, compact = false }: Props) {
  const [offset, setOffset] = useState(0);
  const allRoutes = computeBestRoutes(rows, { isPremium, setupFeeRate, topN: 9999 });
  const profitable = allRoutes.filter((r) => r.profitPerUnit > 0).slice(0, 5);
  const losses = allRoutes.filter((r) => r.profitPerUnit <= 0).slice(-5).reverse();
  const feesLabel = isPremium ? "2.5% + 4%" : "2.5% + 8%";

  const entries: Entry[] = [];
  if (profitable.length === 0) {
    entries.push({ kind: "sep", label: "— sin rutas rentables —" });
  } else {
    for (const r of profitable) entries.push({ kind: "row", data: r, loss: false });
  }
  if (losses.length > 0) {
    entries.push({ kind: "sep", label: `— pérdidas (peores ${losses.length}) —` });
    for (const r of losses) entries.push({ kind: "row", data: r, loss: true });
  }

  useEffect(() => {
    const maxOffset = Math.max(0, entries.length - visibleRows);
    if (offset > maxOffset) setOffset(maxOffset);
  }, [entries.length, visibleRows, offset]);

  useInput(
    (_input, key) => {
      if (entries.length <= visibleRows) return;
      const maxOffset = entries.length - visibleRows;
      if (key.upArrow) setOffset((o) => Math.max(0, o - 1));
      else if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1));
      else if (key.pageUp) setOffset((o) => Math.max(0, o - visibleRows));
      else if (key.pageDown) setOffset((o) => Math.min(maxOffset, o + visibleRows));
    },
    { isActive: focused },
  );

  const visible = entries.slice(offset, offset + visibleRows);
  const scrollInfo =
    entries.length > visibleRows
      ? ` · ${offset + 1}-${Math.min(offset + visibleRows, entries.length)}/${entries.length}`
      : "";

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? "magenta" : "gray"}
      paddingX={1}
      height={visibleRows + 4}
      flexShrink={0}
    >
      <Text bold color={focused ? "magenta" : "gray"} wrap="truncate">
        {`MÁRGENES (fees ${feesLabel})${scrollInfo}${focused ? " · ↑↓" : ""}`}
      </Text>
      {allRoutes.length === 0 ? (
        <Text dimColor>sin data fresca para calcular rutas</Text>
      ) : (
        <>
          <Box>
            <Box width={compact ? 4 : 6}><Text dimColor wrap="truncate">Tip</Text></Box>
            <Box width={compact ? 14 : 24}><Text dimColor wrap="truncate">Ruta</Text></Box>
            <Box width={compact ? 8 : 10}><Text dimColor wrap="truncate">Buy</Text></Box>
            <Box width={compact ? 8 : 10}><Text dimColor wrap="truncate">Sell</Text></Box>
            <Box width={compact ? 7 : 10}><Text dimColor wrap="truncate">Neto</Text></Box>
            <Box width={compact ? 6 : 9}><Text dimColor wrap="truncate">ROI</Text></Box>
            {!compact && <Box width={8}><Text dimColor>Edad</Text></Box>}
          </Box>
          {visible.map((e, i) =>
            e.kind === "sep" ? (
              <Box key={`sep-${offset + i}`} width="100%">
                <Text dimColor wrap="truncate">{e.label}</Text>
              </Box>
            ) : (
              <Box key={`row-${offset + i}`}>
                <Box width={compact ? 4 : 6}>
                  <Text color={e.loss ? "red" : "green"} wrap="truncate">{e.loss ? "LOSS" : "OK"}</Text>
                </Box>
                <Box width={compact ? 14 : 24}>
                  <Text wrap="truncate">{`${e.data.buyCity} → ${e.data.sellCity}`}</Text>
                </Box>
                <Box width={compact ? 8 : 10}><Text wrap="truncate">{formatSilver(e.data.buyPrice)}</Text></Box>
                <Box width={compact ? 8 : 10}><Text wrap="truncate">{formatSilver(e.data.sellPrice)}</Text></Box>
                <Box width={compact ? 7 : 10}>
                  <Text color={e.data.profitPerUnit > 0 ? "green" : "red"} wrap="truncate">
                    {e.data.profitPerUnit > 0 ? "+" : ""}
                    {formatSilver(Math.round(e.data.profitPerUnit))}
                  </Text>
                </Box>
                <Box width={compact ? 6 : 9}>
                  <Text color={e.data.roiPct >= 20 ? "green" : e.data.roiPct >= 0 ? "yellow" : "red"} wrap="truncate">
                    {formatPercent(e.data.roiPct)}
                  </Text>
                </Box>
                {!compact && (
                  <Box width={8}>
                    <Text dimColor>{formatAge(Date.now() - e.data.ageMs)}</Text>
                  </Box>
                )}
              </Box>
            ),
          )}
        </>
      )}
    </Box>
  );
}
