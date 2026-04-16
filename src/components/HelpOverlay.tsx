import React from "react";
import { Box, Text } from "ink";

const ROWS: [string, string][] = [
  ["1 / 2 / 3", "Cambiar vista: Main / Inversiones / Settings"],
  ["/", "Foco a SearchBar"],
  ["Tab", "Ciclar foco (Search → List → Margins)"],
  ["↑ ↓", "Navegar listas"],
  ["← →", "Cambiar filtro de tier (Todos/T4..T8)"],
  ["PgUp / PgDn", "Paginar ItemList"],
  ["Enter", "Seleccionar ítem"],
  ["L", "Toggle idioma ES/EN"],
  ["P", "Toggle Premium ON/OFF"],
  ["R (Main)", "Forzar refresh de precios"],
  ["I (Inversiones)", "Nueva inversión"],
  ["C (Inversiones)", "Cerrar posición"],
  ["D (Inversiones)", "Eliminar inversión (Y/N)"],
  ["R / X (Settings)", "Re-sembrar catálogo / flush cache"],
  ["+ / - (Settings)", "Ajustar quality default"],
  ["Q / Ctrl+C", "Salir"],
  ["?", "Mostrar esta ayuda"],
];

export function HelpOverlay({ onClose: _onClose }: { onClose: () => void }) {
  return (
    <Box flexDirection="column" borderStyle="double" borderColor="cyan" padding={1}>
      <Text bold color="cyan">Ayuda — Keybinds</Text>
      {ROWS.map(([k, d]) => (
        <Box key={k}>
          <Box width={22}>
            <Text color="yellow">{k}</Text>
          </Box>
          <Text>{d}</Text>
        </Box>
      ))}
      <Text dimColor>Pulsá cualquier tecla para cerrar</Text>
    </Box>
  );
}
