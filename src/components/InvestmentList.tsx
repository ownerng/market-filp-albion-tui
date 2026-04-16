import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { useInvestments } from "../hooks/useInvestments.js";
import { InvestmentForm } from "./InvestmentForm.js";
import { formatSilver, formatPercent } from "../lib/formatters.js";
import type { InvestmentRow } from "../db/schema.js";

function computeRoi(r: InvestmentRow): number {
  const target = r.sellPriceActual ?? r.expectedSellPrice;
  if (!target || r.buyPricePerUnit <= 0) return 0;
  return ((target - r.buyPricePerUnit) / r.buyPricePerUnit) * 100;
}

interface Props {
  focused: boolean;
}

type Mode = "list" | "new" | "close";

export function InvestmentList({ focused }: Props) {
  const { rows, stats, add, remove, closePosition } = useInvestments();
  const [mode, setMode] = useState<Mode>("list");
  const [cursor, setCursor] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
  const [closePriceInput, setClosePriceInput] = useState("");

  useInput(
    (input, key) => {
      if (mode !== "list") return;
      if (rows.length > 0) {
        if (key.upArrow) setCursor((c) => Math.max(0, c - 1));
        if (key.downArrow) setCursor((c) => Math.min(rows.length - 1, c + 1));
      }
      if (input === "i" || input === "I") setMode("new");
      if ((input === "d" || input === "D") && rows[cursor]) {
        setConfirmDelete(rows[cursor]!.id);
      }
      if ((input === "c" || input === "C") && rows[cursor] && rows[cursor]!.status === "open") {
        setMode("close");
        setClosePriceInput("");
      }
      if (confirmDelete != null && (input === "y" || input === "Y")) {
        remove(confirmDelete);
        setConfirmDelete(null);
        setCursor(0);
      }
      if (confirmDelete != null && (input === "n" || input === "N" || key.escape)) {
        setConfirmDelete(null);
      }
    },
    { isActive: focused },
  );

  if (mode === "new") {
    return (
      <InvestmentForm
        onCancel={() => setMode("list")}
        onSubmit={(d) => {
          add({
            itemUniqueName: d.itemUniqueName,
            quality: 1,
            quantity: d.quantity,
            buyPricePerUnit: d.buyPricePerUnit,
            buyCity: d.buyCity,
            buyDate: Date.now(),
            targetSellCity: d.targetSellCity,
            expectedSellPrice: d.expectedSellPrice,
            status: "open",
            sellPriceActual: null,
            sellDate: null,
            notes: d.notes,
          });
          setMode("list");
        }}
      />
    );
  }

  if (mode === "close") {
    const sel = rows[cursor];
    return (
      <Box flexDirection="column" borderStyle="round" borderColor="yellow" paddingX={1}>
        <Text bold color="yellow">Cerrar posición</Text>
        <Text>Ítem: {sel?.itemUniqueName ?? "—"}</Text>
        <Text>Compra unidad: {formatSilver(sel?.buyPricePerUnit ?? 0)}</Text>
        <Text>Precio venta real (por unidad): </Text>
        <TextInput
          value={closePriceInput}
          onChange={setClosePriceInput}
          onSubmit={(v) => {
            const n = Number(v);
            if (Number.isFinite(n) && n > 0 && sel) {
              closePosition(sel.id, n);
            }
            setMode("list");
          }}
          focus
        />
        <Text dimColor>Enter para confirmar · Esc para cancelar</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column" flexGrow={1} borderStyle="round" borderColor="magenta" paddingX={1}>
      <Text bold color="magenta">
        Inversiones — Abiertas: {stats.open} · Cerradas: {stats.closed} · Canc: {stats.cancelled} · Profit total:{" "}
        <Text color={stats.totalProfit >= 0 ? "green" : "red"}>
          {stats.totalProfit >= 0 ? "+" : ""}
          {formatSilver(Math.round(stats.totalProfit))}
        </Text>
      </Text>
      <Box>
        <Box width={4}><Text dimColor>#</Text></Box>
        <Box width={20}><Text dimColor>Ítem</Text></Box>
        <Box width={6}><Text dimColor>Qty</Text></Box>
        <Box width={11}><Text dimColor>Compra</Text></Box>
        <Box width={13}><Text dimColor>Origen</Text></Box>
        <Box width={13}><Text dimColor>Destino</Text></Box>
        <Box width={9}><Text dimColor>Estado</Text></Box>
        <Box width={10}><Text dimColor>ROI</Text></Box>
      </Box>
      {rows.length === 0 ? (
        <Text dimColor>(sin inversiones — pulsá I para crear)</Text>
      ) : (
        rows.slice(0, 15).map((r, i) => {
          const roi = computeRoi(r);
          const selected = i === cursor;
          return (
            <Box key={r.id}>
              <Box width={4}><Text inverse={selected}>{r.id}</Text></Box>
              <Box width={20}><Text inverse={selected}>{r.itemUniqueName}</Text></Box>
              <Box width={6}><Text inverse={selected}>{r.quantity}</Text></Box>
              <Box width={11}><Text inverse={selected}>{formatSilver(r.buyPricePerUnit)}</Text></Box>
              <Box width={13}><Text inverse={selected}>{r.buyCity}</Text></Box>
              <Box width={13}><Text inverse={selected}>{r.targetSellCity ?? "—"}</Text></Box>
              <Box width={9}>
                <Text
                  inverse={selected}
                  color={
                    r.status === "open" ? "cyan" : r.status === "closed" ? "green" : "red"
                  }
                >
                  {r.status}
                </Text>
              </Box>
              <Box width={10}>
                <Text inverse={selected} color={roi >= 0 ? "green" : "red"}>
                  {roi >= 0 ? "+" : ""}
                  {formatPercent(roi)}
                </Text>
              </Box>
            </Box>
          );
        })
      )}
      {confirmDelete != null && (
        <Text color="red">¿Eliminar #{confirmDelete}? (Y/N)</Text>
      )}
      <Text dimColor>[I]Nueva [C]Cerrar [D]Eliminar ↑↓ navegar</Text>
    </Box>
  );
}
