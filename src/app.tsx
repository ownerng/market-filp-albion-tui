import React, { useEffect, useState } from "react";
import { Box, Text, useApp, useInput } from "ink";
import Spinner from "ink-spinner";
import { SearchBar } from "./components/SearchBar.js";
import { ItemList } from "./components/ItemList.js";
import { PriceTable } from "./components/PriceTable.js";
import { MarginPanel } from "./components/MarginPanel.js";
import { TopFlips } from "./components/TopFlips.js";
import { SettingsPanel } from "./components/SettingsPanel.js";
import { HelpOverlay } from "./components/HelpOverlay.js";
import { useItems } from "./hooks/useItems.js";
import { usePrices } from "./hooks/usePrices.js";
import { useTerminalSize } from "./hooks/useTerminalSize.js";
import { getDb } from "./db/client.js";
import { isSeedNeeded, seedItems, type SeedResult } from "./db/seed.js";
import { getAllSettings, setSetting } from "./db/queries/settings.js";
import type { ItemRow } from "./db/schema.js";
import type { AppSettings } from "./types/settings.js";
import { logger } from "./lib/logger.js";

type View = "main" | "flips" | "settings";
type Focus = "search" | "list" | "pricesBuy" | "pricesSell" | "margins";
const FOCUS_CYCLE: Focus[] = ["search", "list", "pricesBuy", "pricesSell", "margins"];

function Header({ view, settings }: { view: View; settings: AppSettings }) {
  const fees = settings.premiumStatus ? "2.5% + 4%" : "2.5% + 8%";
  return (
    <Box borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">
        Market Flip{" "}
      </Text>
      <Text>| {settings.serverRegion} | Premium: </Text>
      <Text color={settings.premiumStatus ? "green" : "red"}>
        {settings.premiumStatus ? "ON" : "OFF"}
      </Text>
      <Text>
        {" "}
        | {settings.uiLanguage.toUpperCase()} | Fees: {fees} | Vista:{" "}
      </Text>
      <Text color="yellow">{view}</Text>
    </Box>
  );
}

function Footer() {
  return (
    <Box borderStyle="round" borderColor="gray" paddingX={1}>
      <Text dimColor>
        [1]Main [2]Flips [3]Settings [/]Buscar [Tab]Ciclar foco [←→]Tier [L]Idioma [P]Premium
        [?]Ayuda [Q]Salir
      </Text>
    </Box>
  );
}

function SeedScreen({ onDone }: { onDone: (r: SeedResult) => void }) {
  const [status, setStatus] = useState<string>("Descargando catálogo items.json...");
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await seedItems();
        if (!cancelled) {
          setStatus(`Insertados ${res.inserted} ítems.`);
          onDone(res);
        }
      } catch (e) {
        logger.error({ err: (e as Error).message }, "Seed falló");
        if (!cancelled) setErr((e as Error).message);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [onDone]);

  if (err) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">Error en seed: {err}</Text>
        <Text dimColor>Verificá red y reintentá. Pulsá Q para salir.</Text>
      </Box>
    );
  }

  return (
    <Box padding={1}>
      <Text color="cyan">
        <Spinner type="dots" />
      </Text>
      <Text> {status}</Text>
    </Box>
  );
}

function MainView({
  focus,
  settings,
  selected,
  onSelectItem,
  refreshKey,
  listRows,
  itemListWidth,
  priceVisibleRows,
  marginVisibleRows,
  compact,
}: {
  focus: Focus;
  settings: AppSettings;
  selected: ItemRow | null;
  onSelectItem: (item: ItemRow) => void;
  refreshKey: number;
  listRows: number;
  itemListWidth: number;
  priceVisibleRows: number;
  marginVisibleRows: number;
  compact: boolean;
}) {
  const [query, setQuery] = useState("");
  const [tierFilter, setTierFilter] = useState<number | null>(null);
  const { results, loading } = useItems(query, tierFilter);
  const {
    rows,
    loading: pricesLoading,
    error,
  } = usePrices({
    itemId: selected?.uniqueName ?? null,
    quality: settings.defaultQuality,
    settings,
    forceRefresh: refreshKey,
  });

  const selectedLabel = selected
    ? settings.uiLanguage === "es"
      ? selected.localizedEs
      : selected.localizedEn
    : null;

  return (
    <Box flexDirection="column" flexGrow={1} overflow="hidden">
      <SearchBar
        value={query}
        onChange={setQuery}
        focused={focus === "search"}
        placeholder={loading ? "buscando…" : undefined}
      />
      <Box flexGrow={1} flexDirection="row" overflow="hidden">
        <Box width={itemListWidth} flexDirection="column" flexShrink={0}>
          <ItemList
            items={results}
            lang={settings.uiLanguage}
            focused={focus === "list"}
            onSelect={onSelectItem}
            maxRows={listRows}
            tierFilter={tierFilter}
            onTierChange={setTierFilter}
          />
        </Box>
        <Box flexGrow={1} flexDirection="column" flexShrink={1} overflow="hidden">
          {selected ? (
            <>
              <Box paddingX={1}>
                <Text bold wrap="truncate">
                  {`T${selected.tier} ${selectedLabel}${selected.enchant > 0 ? ` .${selected.enchant}` : ""}`}
                </Text>
                <Text dimColor wrap="truncate">
                  {" "}
                  ({selected.uniqueName})
                </Text>
                {pricesLoading && <Text color="cyan"> — cargando…</Text>}
                {error && <Text color="red"> — {error}</Text>}
              </Box>
              <PriceTable
                rows={rows}
                mode="buy"
                focused={focus === "pricesBuy"}
                visibleRows={priceVisibleRows}
                compact={compact}
              />
              <PriceTable
                rows={rows}
                mode="sell"
                focused={focus === "pricesSell"}
                visibleRows={priceVisibleRows}
                compact={compact}
              />
              <MarginPanel
                rows={rows}
                isPremium={settings.premiumStatus}
                setupFeeRate={settings.setupFeeRate}
                focused={focus === "margins"}
                visibleRows={marginVisibleRows}
                compact={compact}
              />
            </>
          ) : (
            <Box padding={1}>
              <Text dimColor>Seleccioná un ítem (Enter) para ver precios.</Text>
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

function FlipsView({ focused, settings }: { focused: boolean; settings: AppSettings }) {
  return <TopFlips focused={focused} settings={settings} />;
}

function SettingsView({
  settings,
  onChange,
  focused,
}: {
  settings: AppSettings;
  onChange: () => void;
  focused: boolean;
}) {
  return <SettingsPanel settings={settings} onChange={onChange} focused={focused} />;
}

export function App() {
  const { exit } = useApp();
  const [view, setView] = useState<View>("main");
  const [focus, setFocus] = useState<Focus>("search");
  const [seeded, setSeeded] = useState(false);
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [selectedItem, setSelectedItem] = useState<ItemRow | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const { columns, rows } = useTerminalSize();

  useEffect(() => {
    getDb();
    if (!isSeedNeeded()) setSeeded(true);
    setSettings(getAllSettings());
  }, []);

  const refreshSettings = () => setSettings(getAllSettings());

  useInput((input, key) => {
    if (key.ctrl && input === "c") {
      exit();
      return;
    }
    if (showHelp) {
      setShowHelp(false);
      return;
    }
    if (key.tab) {
      setFocus((f) => {
        const idx = FOCUS_CYCLE.indexOf(f);
        return FOCUS_CYCLE[(idx + 1) % FOCUS_CYCLE.length] ?? "search";
      });
      return;
    }
    if (key.escape) {
      setFocus("list");
      return;
    }
    if (focus === "search") return;
    if (input === "q") {
      exit();
      return;
    }
    if (input === "?") {
      setShowHelp(true);
      return;
    }
    if (input === "1") setView("main");
    if (input === "2") setView("flips");
    if (input === "3") setView("settings");
    if (input === "l" || input === "L") {
      if (!settings) return;
      const next = settings.uiLanguage === "es" ? "en" : "es";
      setSetting("ui_language", next);
      refreshSettings();
    }
    if (input === "p" || input === "P") {
      if (!settings) return;
      const next = !settings.premiumStatus;
      setSetting("premium_status", String(next));
      refreshSettings();
    }
    if (input === "/") setFocus("search");
    if ((input === "r" || input === "R") && view === "main") setRefreshKey((k) => k + 1);
  });

  if (columns < 60 || rows < 12) {
    return (
      <Box padding={1} flexDirection="column">
        <Text color="yellow" bold>
          Terminal muy chica
        </Text>
        <Text dimColor>
          Actual: {columns}×{rows} · mínimo 60×12
        </Text>
      </Box>
    );
  }

  if (!settings) {
    return (
      <Box padding={1}>
        <Text color="cyan">
          <Spinner type="dots" />
        </Text>
        <Text> Cargando configuración…</Text>
      </Box>
    );
  }

  if (!seeded) {
    return (
      <Box flexDirection="column" width={columns} height={rows}>
        <Header view={view} settings={settings} />
        <SeedScreen onDone={() => setSeeded(true)} />
        <Footer />
      </Box>
    );
  }

  if (showHelp) {
    return <HelpOverlay onClose={() => setShowHelp(false)} />;
  }

  const compact = columns < 120;
  const itemListWidth = compact ? 28 : 36;

  const headerRows = 3;
  const searchRows = view === "main" ? 3 : 0;
  const footerRows = 3;
  const listInner = Math.max(3, rows - headerRows - searchRows - footerRows - 3);

  // Distribute right panel height across 3 panels (2 price tables + margin)
  const rightContentRows = Math.max(12, rows - headerRows - searchRows - footerRows - 1);
  const rawVR = Math.floor((rightContentRows - 12) / 3);
  const priceVisibleRows = Math.min(8, Math.max(2, rawVR));
  const marginVisibleRows = Math.max(2, rightContentRows - 2 * (priceVisibleRows + 4) - 4);

  return (
    <Box flexDirection="column" width={columns} height={rows}>
      <Header view={view} settings={settings} />
      {view === "main" && (
        <MainView
          focus={focus}
          settings={settings}
          selected={selectedItem}
          onSelectItem={setSelectedItem}
          refreshKey={refreshKey}
          listRows={listInner}
          itemListWidth={itemListWidth}
          priceVisibleRows={priceVisibleRows}
          marginVisibleRows={marginVisibleRows}
          compact={compact}
        />
      )}
      {view === "flips" && <FlipsView focused={view === "flips"} settings={settings} />}
      {view === "settings" && (
        <SettingsView
          settings={settings}
          onChange={refreshSettings}
          focused={view === "settings"}
        />
      )}
      <Footer />
    </Box>
  );
}
