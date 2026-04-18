export interface AppSettings {
  uiLanguage: "es" | "en";
  premiumStatus: boolean;
  serverRegion: "americas" | "europe" | "asia";
  defaultQuality: 1 | 2 | 3 | 4 | 5;
  setupFeeRate: number;
  cacheTtlSeconds: number;
}

export const DEFAULT_SETTINGS: AppSettings = {
  uiLanguage: "es",
  premiumStatus: true,
  serverRegion: "americas",
  defaultQuality: 1,
  setupFeeRate: 0.025,
  cacheTtlSeconds: 3600,
};
