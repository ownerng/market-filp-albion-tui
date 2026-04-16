import React, { useEffect, useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ItemRow } from "../db/schema.js";
import { ALLOWED_TIERS } from "../constants/tiers.js";

interface Props {
  items: ItemRow[];
  lang: "es" | "en";
  focused: boolean;
  onSelect: (item: ItemRow) => void;
  maxRows?: number;
  tierFilter?: number | null;
  onTierChange?: (tier: number | null) => void;
}

const TIER_CYCLE: (number | null)[] = [null, ...ALLOWED_TIERS];

function cycleTier(current: number | null, delta: number): number | null {
  const idx = TIER_CYCLE.indexOf(current);
  const safe = idx === -1 ? 0 : idx;
  const next = (safe + delta + TIER_CYCLE.length) % TIER_CYCLE.length;
  return TIER_CYCLE[next] ?? null;
}

export function ItemList({ items, lang, focused, onSelect, maxRows = 20, tierFilter = null, onTierChange }: Props) {
  const [index, setIndex] = useState(0);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (index >= items.length) setIndex(Math.max(0, items.length - 1));
  }, [items, index]);

  useInput(
    (input, key) => {
      if (key.leftArrow && onTierChange) {
        onTierChange(cycleTier(tierFilter, -1));
        setIndex(0);
        setOffset(0);
        return;
      }
      if (key.rightArrow && onTierChange) {
        onTierChange(cycleTier(tierFilter, +1));
        setIndex(0);
        setOffset(0);
        return;
      }
      if (items.length === 0) return;
      if (key.upArrow) {
        setIndex((i) => {
          const next = Math.max(0, i - 1);
          if (next < offset) setOffset(next);
          return next;
        });
      } else if (key.downArrow) {
        setIndex((i) => {
          const next = Math.min(items.length - 1, i + 1);
          if (next >= offset + maxRows) setOffset(next - maxRows + 1);
          return next;
        });
      } else if (key.pageDown) {
        setIndex((i) => {
          const next = Math.min(items.length - 1, i + maxRows);
          setOffset(Math.max(0, next - maxRows + 1));
          return next;
        });
      } else if (key.pageUp) {
        setIndex((i) => {
          const next = Math.max(0, i - maxRows);
          setOffset(next);
          return next;
        });
      } else if (key.return) {
        const picked = items[index];
        if (picked) onSelect(picked);
      }
    },
    { isActive: focused },
  );

  const visible = items.slice(offset, offset + maxRows);

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor={focused ? "cyan" : "gray"}
      paddingX={1}
      width="100%"
      height={maxRows + 3}
      flexShrink={0}
    >
      <Text color={focused ? "cyan" : "gray"} wrap="truncate">
        {`Tier: ${tierFilter === null ? "Todos" : `T${tierFilter}`} ←→ · Ítems (${items.length})`}
      </Text>
      {items.length === 0 ? (
        <Text dimColor>sin resultados</Text>
      ) : (
        visible.map((it, i) => {
          const actualIndex = offset + i;
          const selected = actualIndex === index;
          const label = lang === "es" ? it.localizedEs : it.localizedEn;
          const suffix = it.enchant > 0 ? ` .${it.enchant}` : "";
          return (
            <Text
              key={it.uniqueName}
              color={selected ? "yellow" : undefined}
              inverse={selected}
              wrap="truncate"
            >
              {`T${it.tier} ${label}${suffix}`}
            </Text>
          );
        })
      )}
    </Box>
  );
}
