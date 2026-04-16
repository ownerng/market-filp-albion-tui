import { useCallback, useEffect, useState } from "react";
import {
  createInvestment,
  deleteInvestment,
  listInvestments,
  sumClosedProfit,
  updateInvestment,
} from "../db/queries/investments.js";
import type { InvestmentInsert, InvestmentRow } from "../db/schema.js";

export function useInvestments() {
  const [rows, setRows] = useState<InvestmentRow[]>([]);
  const [closedProfit, setClosedProfit] = useState(0);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    setRows(listInvestments());
    setClosedProfit(sumClosedProfit());
  }, [tick]);

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const add = useCallback(
    (input: Omit<InvestmentInsert, "id">) => {
      const id = createInvestment(input);
      refresh();
      return id;
    },
    [refresh],
  );

  const update = useCallback(
    (id: number, patch: Partial<InvestmentRow>) => {
      updateInvestment(id, patch);
      refresh();
    },
    [refresh],
  );

  const remove = useCallback(
    (id: number) => {
      deleteInvestment(id);
      refresh();
    },
    [refresh],
  );

  const closePosition = useCallback(
    (id: number, sellPriceActual: number) => {
      updateInvestment(id, {
        status: "closed",
        sellPriceActual,
        sellDate: Date.now(),
      });
      refresh();
    },
    [refresh],
  );

  const stats = {
    open: rows.filter((r) => r.status === "open").length,
    closed: rows.filter((r) => r.status === "closed").length,
    cancelled: rows.filter((r) => r.status === "cancelled").length,
    totalProfit: closedProfit,
  };

  return { rows, stats, add, update, remove, closePosition, refresh };
}
