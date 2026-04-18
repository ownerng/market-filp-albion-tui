import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import { CITIES } from "../constants/cities.js";
import { formatSilver, formatAge } from "../lib/formatters.js";
import { StalenessIndicator } from "./StalenessIndicator.js";
import type { PriceCacheRow } from "../db/schema.js";

type Mode = "buy" | "sell";

interface Props {
  rows: PriceCacheRow[];
  mode: Mode;
  title?: string;
  focused?: boolean;
  visibleRows?: number;
  compact?: boolean;
}

const MAX_AGE_MS = 60 * 60_000;

export function PriceTable({ rows, mode, title, focused = false, visibleRows = 8, compact = false }: Props) {
  const [offset, setOffset] = useState(0);

  const COL_CITY = compact ? 12 : 14;
  const COL_PRICE = compact ? 9 : 12;
  const COL_AGE = compact ? 6 : 8;

  const byCity = new Map<string, PriceCacheRow>();
  for (const r of rows) byCity.set(r.city, r);

  const borderColor = focused ? "cyan" : mode === "buy" ? "green" : "yellow";
  const headerTitle = title ?? (mode === "buy" ? "COMPRA (sell_price_min)" : "VENTA (buy_price_max)");

  const totalCities = CITIES.length;
  const canScroll = totalCities > visibleRows;
  const maxOffset = Math.max(0, totalCities - visibleRows);
  const visibleCities = CITIES.slice(offset, offset + visibleRows);

  const scrollInfo = canScroll
    ? ` · ${offset + 1}-${Math.min(offset + visibleRows, totalCities)}/${totalCities}`
    : "";

  useInput(
    (_input, key) => {
      if (!canScroll) return;
      if (key.upArrow) setOffset((o) => Math.max(0, o - 1));
      else if (key.downArrow) setOffset((o) => Math.min(maxOffset, o + 1));
    },
    { isActive: focused },
  );

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={borderColor}
      paddingX={1}
      height={visibleRows + 4}
      flexShrink={0}
    >
      <Text bold color={borderColor} wrap="truncate">
        {headerTitle}{scrollInfo}{focused && canScroll ? " · ↑↓" : ""}
      </Text>
      <Box>
        <Box width={COL_CITY}><Text dimColor wrap="truncate">Ciudad</Text></Box>
        <Box width={COL_PRICE}><Text dimColor wrap="truncate">{mode === "buy" ? "Mínimo" : "Máximo"}</Text></Box>
        <Box width={COL_PRICE}><Text dimColor wrap="truncate">{mode === "buy" ? "Máximo" : "Mínimo"}</Text></Box>
        <Box width={COL_AGE}><Text dimColor wrap="truncate">Edad</Text></Box>
      </Box>
      {visibleCities.map((c) => {
        const row = byCity.get(c.id);
        const primaryDate = mode === "buy" ? row?.sellMinDate : row?.buyMaxDate;
        const isStale = primaryDate ? Date.now() - primaryDate > MAX_AGE_MS : false;
        const primary = isStale ? 0 : (mode === "buy" ? row?.sellMin ?? 0 : row?.buyMax ?? 0);
        const secondary = mode === "buy" ? row?.sellMax ?? 0 : row?.buyMin ?? 0;
        return (
          <Box key={c.id}>
            <Box width={COL_CITY}><Text wrap="truncate">{c.label}</Text></Box>
            <Box width={COL_PRICE}><Text wrap="truncate">{isStale ? "—" : formatSilver(primary)}</Text></Box>
            <Box width={COL_PRICE}><Text dimColor wrap="truncate">{formatSilver(secondary)}</Text></Box>
            <Box width={COL_AGE}>
              <StalenessIndicator updatedAt={primaryDate ?? row?.updatedAt ?? null} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
