import React from "react";
import { Box, Text } from "ink";
import { CITIES } from "../constants/cities.js";
import { formatSilver } from "../lib/formatters.js";
import { StalenessIndicator } from "./StalenessIndicator.js";
import type { PriceCacheRow } from "../db/schema.js";

type Mode = "buy" | "sell";

interface Props {
  rows: PriceCacheRow[];
  mode: Mode;
  title?: string;
  focused?: boolean;
}

const COL_CITY = 14;
const COL_PRICE = 12;
const COL_AGE = 8;

export function PriceTable({ rows, mode, title, focused }: Props) {
  const byCity = new Map<string, PriceCacheRow>();
  for (const r of rows) byCity.set(r.city, r);

  const borderColor = focused ? "cyan" : mode === "buy" ? "green" : "yellow";
  const headerTitle = title ?? (mode === "buy" ? "COMPRA (sell_price_min)" : "VENTA (buy_price_max)");

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={borderColor} paddingX={1}>
      <Text bold color={borderColor}>{headerTitle}</Text>
      <Box>
        <Box width={COL_CITY}><Text dimColor>Ciudad</Text></Box>
        <Box width={COL_PRICE}><Text dimColor>{mode === "buy" ? "Mínimo" : "Máximo"}</Text></Box>
        <Box width={COL_PRICE}><Text dimColor>{mode === "buy" ? "Máximo" : "Mínimo"}</Text></Box>
        <Box width={COL_AGE}><Text dimColor>Edad</Text></Box>
      </Box>
      {CITIES.map((c) => {
        const row = byCity.get(c.id);
        const primary = mode === "buy" ? row?.sellMin ?? 0 : row?.buyMax ?? 0;
        const secondary = mode === "buy" ? row?.sellMax ?? 0 : row?.buyMin ?? 0;
        return (
          <Box key={c.id}>
            <Box width={COL_CITY}><Text>{c.label}</Text></Box>
            <Box width={COL_PRICE}><Text>{formatSilver(primary)}</Text></Box>
            <Box width={COL_PRICE}><Text dimColor>{formatSilver(secondary)}</Text></Box>
            <Box width={COL_AGE}>
              <StalenessIndicator updatedAt={row?.updatedAt ?? null} />
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
