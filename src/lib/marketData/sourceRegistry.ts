export type MarketSource = {
  id: string;
  name: string;
  baseUrl: string;
  country: "UZ" | "GLOBAL";
  type: "official" | "multilateral" | "industry" | "proxy";
  supportedData: Array<"macro" | "trade" | "industry" | "prices" | "exchange_rates" | "inflation" | "regional" | "business_demography">;
  supportedLocales: string[];
  reliabilityTier: 1 | 2 | 3;
  requiresApiKey: boolean;
};

export const marketSourceRegistry: MarketSource[] = [
  { id: "stat_uz", name: "National Statistics Committee of the Republic of Uzbekistan", baseUrl: "https://stat.uz", country: "UZ", type: "official", supportedData: ["macro", "industry", "prices", "regional", "business_demography"], supportedLocales: ["uz", "ru", "en"], reliabilityTier: 1, requiresApiKey: false },
  { id: "api_stat_uz", name: "API Stat.uz", baseUrl: "https://api.stat.uz/api/v1.0/data", country: "UZ", type: "official", supportedData: ["macro", "industry", "prices", "regional", "business_demography"], supportedLocales: ["uz", "ru", "en"], reliabilityTier: 1, requiresApiKey: false },
  { id: "data_egov_uz", name: "Open Data Portal of the Republic of Uzbekistan", baseUrl: "https://data.egov.uz", country: "UZ", type: "official", supportedData: ["macro", "trade", "industry", "regional"], supportedLocales: ["uz", "ru", "en"], reliabilityTier: 1, requiresApiKey: false },
  { id: "cbu_uz", name: "Central Bank of Uzbekistan", baseUrl: "https://cbu.uz", country: "UZ", type: "official", supportedData: ["exchange_rates", "inflation", "macro"], supportedLocales: ["uz", "ru", "en"], reliabilityTier: 1, requiresApiKey: false },
  { id: "world_bank", name: "World Bank Open Data", baseUrl: "https://data.worldbank.org", country: "GLOBAL", type: "multilateral", supportedData: ["macro", "trade", "inflation"], supportedLocales: ["en"], reliabilityTier: 2, requiresApiKey: false },
  { id: "wits", name: "World Integrated Trade Solution", baseUrl: "https://wits.worldbank.org", country: "GLOBAL", type: "multilateral", supportedData: ["trade"], supportedLocales: ["en"], reliabilityTier: 2, requiresApiKey: false },
  { id: "un_comtrade", name: "UN Comtrade", baseUrl: "https://comtradeplus.un.org", country: "GLOBAL", type: "multilateral", supportedData: ["trade"], supportedLocales: ["en"], reliabilityTier: 2, requiresApiKey: false },
  { id: "faostat", name: "FAOSTAT", baseUrl: "https://www.fao.org/faostat", country: "GLOBAL", type: "multilateral", supportedData: ["industry", "prices", "trade"], supportedLocales: ["en"], reliabilityTier: 2, requiresApiKey: false },
  { id: "adb", name: "Asian Development Bank Data", baseUrl: "https://data.adb.org", country: "GLOBAL", type: "multilateral", supportedData: ["macro", "regional"], supportedLocales: ["en"], reliabilityTier: 2, requiresApiKey: false }
];

export const officialSourceRegistry = {
  uzStatisticsAgency: {
    sourceName: "National Statistics Committee of the Republic of Uzbekistan",
    sourceType: "official_statistics",
    sourceUrl: "https://stat.uz",
    apiUrl: "https://api.stat.uz/api/v1.0/data"
  },
  openDataPortal: {
    sourceName: "Open Data Portal of the Republic of Uzbekistan",
    sourceType: "official_statistics",
    sourceUrl: "https://data.egov.uz"
  },
  customsCommittee: {
    sourceName: "Customs Committee of the Republic of Uzbekistan",
    sourceType: "official_statistics",
    sourceUrl: "https://customs.uz"
  },
  centralBank: {
    sourceName: "Central Bank of Uzbekistan",
    sourceType: "official_statistics",
    sourceUrl: "https://cbu.uz"
  },
  worldBank: {
    sourceName: "World Bank Open Data",
    sourceType: "multilateral_statistics",
    sourceUrl: "https://data.worldbank.org/country/uzbekistan"
  },
  uploadedDataset: {
    sourceName: "FINKO uploaded official dataset",
    sourceType: "custom_upload"
  }
} as const;
