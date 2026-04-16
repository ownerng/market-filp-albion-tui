export const CITIES = [
  { id: "Caerleon", label: "Caerleon", blackMarket: true },
  { id: "Bridgewatch", label: "Bridgewatch", blackMarket: false },
  { id: "Lymhurst", label: "Lymhurst", blackMarket: false },
  { id: "Fort Sterling", label: "Fort Sterling", blackMarket: false },
  { id: "Martlock", label: "Martlock", blackMarket: false },
  { id: "Thetford", label: "Thetford", blackMarket: false },
  { id: "Black Market", label: "Black Market", blackMarket: true },
  { id: "Brecilien", label: "Brecilien", blackMarket: false },
] as const;

export type CityId = (typeof CITIES)[number]["id"];

export const CITY_IDS: readonly CityId[] = CITIES.map((c) => c.id);
