import { z } from "zod";

export const priceResponseSchema = z.object({
  item_id: z.string(),
  city: z.string(),
  quality: z.number().int().min(1).max(5),
  sell_price_min: z.number().int().nonnegative().default(0),
  sell_price_min_date: z.string().nullish(),
  sell_price_max: z.number().int().nonnegative().default(0),
  sell_price_max_date: z.string().nullish(),
  buy_price_min: z.number().int().nonnegative().default(0),
  buy_price_min_date: z.string().nullish(),
  buy_price_max: z.number().int().nonnegative().default(0),
  buy_price_max_date: z.string().nullish(),
});

export const priceResponseArraySchema = z.array(priceResponseSchema);

export type ApiPriceResponse = z.infer<typeof priceResponseSchema>;
