import React, { useState } from "react";
import { Box, Text, useInput } from "ink";
import TextInput from "ink-text-input";
import { CITIES } from "../constants/cities.js";
import type { InvestmentRow } from "../db/schema.js";

type FieldKey =
  | "itemUniqueName"
  | "quantity"
  | "buyPricePerUnit"
  | "buyCity"
  | "targetSellCity"
  | "expectedSellPrice"
  | "notes";

const FIELDS: { key: FieldKey; label: string; numeric?: boolean }[] = [
  { key: "itemUniqueName", label: "Ítem (UniqueName, ej: T5_BAG)" },
  { key: "quantity", label: "Cantidad", numeric: true },
  { key: "buyPricePerUnit", label: "Precio compra / unidad", numeric: true },
  { key: "buyCity", label: `Ciudad origen (${CITIES.map((c) => c.label).join(", ")})` },
  { key: "targetSellCity", label: "Ciudad destino (opcional)" },
  { key: "expectedSellPrice", label: "Precio venta esperado (opcional)", numeric: true },
  { key: "notes", label: "Notas (opcional)" },
];

export interface InvestmentFormSubmit {
  itemUniqueName: string;
  quantity: number;
  buyPricePerUnit: number;
  buyCity: string;
  targetSellCity: string | null;
  expectedSellPrice: number | null;
  notes: string | null;
}

interface Props {
  onSubmit: (data: InvestmentFormSubmit) => void;
  onCancel: () => void;
  initial?: Partial<InvestmentRow>;
}

export function InvestmentForm({ onSubmit, onCancel, initial }: Props) {
  const [values, setValues] = useState<Record<FieldKey, string>>({
    itemUniqueName: initial?.itemUniqueName ?? "",
    quantity: initial?.quantity?.toString() ?? "",
    buyPricePerUnit: initial?.buyPricePerUnit?.toString() ?? "",
    buyCity: initial?.buyCity ?? "",
    targetSellCity: initial?.targetSellCity ?? "",
    expectedSellPrice: initial?.expectedSellPrice?.toString() ?? "",
    notes: initial?.notes ?? "",
  });
  const [index, setIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useInput((input, key) => {
    if (key.escape) onCancel();
    if (key.upArrow) setIndex((i) => Math.max(0, i - 1));
    if (key.downArrow) setIndex((i) => Math.min(FIELDS.length - 1, i + 1));
    if (input === "\u0013") submit();
  });

  function submit() {
    const itemUniqueName = values.itemUniqueName.trim();
    const qty = Number(values.quantity);
    const buyPrice = Number(values.buyPricePerUnit);
    const buyCity = values.buyCity.trim();
    if (!itemUniqueName) return setErrorMsg("Ítem requerido");
    if (!Number.isFinite(qty) || qty <= 0) return setErrorMsg("Cantidad inválida");
    if (!Number.isFinite(buyPrice) || buyPrice < 0) return setErrorMsg("Precio compra inválido");
    if (!buyCity) return setErrorMsg("Ciudad origen requerida");

    const expected = values.expectedSellPrice.trim()
      ? Number(values.expectedSellPrice)
      : null;

    onSubmit({
      itemUniqueName,
      quantity: qty,
      buyPricePerUnit: buyPrice,
      buyCity,
      targetSellCity: values.targetSellCity.trim() || null,
      expectedSellPrice: expected,
      notes: values.notes.trim() || null,
    });
  }

  const current = FIELDS[index];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor="cyan" paddingX={1}>
      <Text bold color="cyan">Nueva inversión — ↑↓ navegar · Ctrl+S guardar · Esc cancelar</Text>
      {FIELDS.map((f, i) => (
        <Box key={f.key}>
          <Box width={40}>
            <Text color={i === index ? "yellow" : undefined}>{f.label}:</Text>
          </Box>
          {i === index && current ? (
            <TextInput
              value={values[f.key]}
              onChange={(v) => setValues((vv) => ({ ...vv, [f.key]: v }))}
              onSubmit={() => {
                if (index < FIELDS.length - 1) setIndex(index + 1);
                else submit();
              }}
              focus
            />
          ) : (
            <Text dimColor>{values[f.key] || "—"}</Text>
          )}
        </Box>
      ))}
      {errorMsg && <Text color="red">Error: {errorMsg}</Text>}
    </Box>
  );
}
