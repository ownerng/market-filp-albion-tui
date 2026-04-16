import React from "react";
import { Text } from "ink";
import { formatAge } from "../lib/formatters.js";

interface Props {
  updatedAt: number | null;
}

export function StalenessIndicator({ updatedAt }: Props) {
  if (!updatedAt) return <Text color="red">—</Text>;
  const age = Date.now() - updatedAt;
  const min = age / 60_000;
  let color: "green" | "yellow" | "redBright" | "red" = "green";
  let suffix = "";
  if (min >= 5 && min < 30) color = "yellow";
  else if (min >= 30 && min < 120) {
    color = "redBright";
    suffix = " !";
  } else if (min >= 120) {
    color = "red";
    suffix = " !!";
  }
  return (
    <Text color={color}>
      {formatAge(updatedAt)}
      {suffix}
    </Text>
  );
}
