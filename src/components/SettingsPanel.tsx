import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import Spinner from "ink-spinner";
import { setSetting } from "../db/queries/settings.js";
import { clearItems } from "../db/queries/items.js";
import { flushPriceCache } from "../db/queries/prices.js";
import { seedItems } from "../db/seed.js";
import { PATHS } from "../lib/paths.js";
import type { AppSettings } from "../types/settings.js";

interface Props {
  settings: AppSettings;
  onChange: () => void;
  focused: boolean;
}

type ActionState = "idle" | "confirming-reseed" | "reseeding" | "confirming-flush";

export function SettingsPanel({ settings, onChange, focused }: Props) {
  const [state, setState] = useState<ActionState>("idle");
  const [msg, setMsg] = useState<string | null>(null);

  useInput(
    (input, key) => {
      if (state === "reseeding") return;
      if (state === "confirming-reseed") {
        if (input === "y" || input === "Y") {
          setState("reseeding");
          (async () => {
            try {
              clearItems();
              const res = await seedItems();
              setMsg(`Reseed OK: ${res.inserted} ítems`);
            } catch (e) {
              setMsg(`Reseed falló: ${(e as Error).message}`);
            } finally {
              setState("idle");
              onChange();
            }
          })();
        } else if (input === "n" || input === "N" || key.escape) {
          setState("idle");
        }
        return;
      }
      if (state === "confirming-flush") {
        if (input === "y" || input === "Y") {
          flushPriceCache();
          setMsg("Cache de precios vaciada");
          setState("idle");
        } else if (input === "n" || input === "N" || key.escape) {
          setState("idle");
        }
        return;
      }
      if (!focused) return;
      if (input === "r" || input === "R") setState("confirming-reseed");
      if (input === "x" || input === "X") setState("confirming-flush");
      if (input === "+") {
        const next = Math.min(5, settings.defaultQuality + 1);
        setSetting("default_quality", String(next));
        onChange();
      }
      if (input === "-") {
        const next = Math.max(1, settings.defaultQuality - 1);
        setSetting("default_quality", String(next));
        onChange();
      }
    },
    { isActive: focused || state !== "idle" },
  );

  return (
    <Box flexGrow={1} flexDirection="column" borderStyle="round" borderColor="green" padding={1}>
      <Text bold color="green">Configuración</Text>
      <Box marginTop={1}>
        <Text>Idioma UI: </Text>
        <Text color="yellow">{settings.uiLanguage}</Text>
        <Text dimColor> (L para toggle)</Text>
      </Box>
      <Box>
        <Text>Premium: </Text>
        <Text color={settings.premiumStatus ? "green" : "red"}>
          {settings.premiumStatus ? "ON" : "OFF"}
        </Text>
        <Text dimColor> (P para toggle) · Sales Tax {settings.premiumStatus ? "4%" : "8%"}</Text>
      </Box>
      <Box>
        <Text>Setup Fee: </Text>
        <Text>{(settings.setupFeeRate * 100).toFixed(1)}%</Text>
      </Box>
      <Box>
        <Text>Quality default: </Text>
        <Text color="yellow">{settings.defaultQuality}</Text>
        <Text dimColor> (+/- ajustar)</Text>
      </Box>
      <Box>
        <Text>Región: </Text>
        <Text color="yellow">{settings.serverRegion}</Text>
        <Text dimColor> (read-only en v0.1)</Text>
      </Box>
      <Box>
        <Text>Cache TTL: </Text>
        <Text>{settings.cacheTtlSeconds}s</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Rutas</Text>
        <Text dimColor>DB: {PATHS.db}</Text>
        <Text dimColor>Log: {PATHS.log}</Text>
      </Box>
      <Box marginTop={1} flexDirection="column">
        <Text bold>Acciones</Text>
        <Text dimColor>[R] Re-sembrar catálogo · [X] Vaciar price cache</Text>
      </Box>
      {state === "confirming-reseed" && (
        <Text color="yellow">¿Re-sembrar items.json? Esto borra la tabla items. (Y/N)</Text>
      )}
      {state === "confirming-flush" && (
        <Text color="yellow">¿Vaciar price_cache? (Y/N)</Text>
      )}
      {state === "reseeding" && (
        <Box>
          <Text color="cyan">
            <Spinner type="dots" />
          </Text>
          <Text> Re-sembrando…</Text>
        </Box>
      )}
      {msg && <Text dimColor>— {msg}</Text>}
    </Box>
  );
}
