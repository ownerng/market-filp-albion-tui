import { useEffect, useState } from "react";
import { useStdout } from "ink";

export function useTerminalSize() {
  const { stdout } = useStdout();
  const [size, setSize] = useState({
    columns: stdout.columns ?? 100,
    rows: stdout.rows ?? 30,
  });

  useEffect(() => {
    const handler = () => {
      setSize({ columns: stdout.columns ?? 100, rows: stdout.rows ?? 30 });
    };
    stdout.on("resize", handler);
    return () => {
      stdout.off("resize", handler);
    };
  }, [stdout]);

  return size;
}
