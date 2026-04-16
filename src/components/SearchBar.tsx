import React from "react";
import { Box, Text } from "ink";
import TextInput from "ink-text-input";

interface Props {
  value: string;
  onChange: (next: string) => void;
  onSubmit?: (value: string) => void;
  focused?: boolean;
  placeholder?: string;
}

export function SearchBar({ value, onChange, onSubmit, focused, placeholder }: Props) {
  return (
    <Box borderStyle="round" borderColor={focused ? "cyan" : "gray"} paddingX={1}>
      <Text color={focused ? "cyan" : "gray"}>Buscar: </Text>
      <TextInput
        value={value}
        onChange={onChange}
        onSubmit={onSubmit}
        placeholder={placeholder ?? "nombre del ítem (ES o EN)"}
        focus={focused ?? true}
      />
    </Box>
  );
}
