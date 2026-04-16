export const HOSTS = {
  americas: "https://west.albion-online-data.com",
  europe: "https://europe.albion-online-data.com",
  asia: "https://east.albion-online-data.com",
} as const;

export type Region = keyof typeof HOSTS;

export const MAX_URL_LEN = 3500;

export function pricesEndpoint(region: Region, itemIds: string[]): string {
  return `${HOSTS[region]}/api/v2/stats/prices/${itemIds.join(",")}.json`;
}
