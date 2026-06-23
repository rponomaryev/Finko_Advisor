import type { SectorMapping } from "./types.ts";

const staticMappings: SectorMapping[] = [

  {
    businessType: "car wash",
    normalizedSector: "car wash and vehicle cleaning services",
    possibleHsCodes: [],
    possibleActivityCodes: ["S96", "G45"],
    keywords: {
      ru: ["автомойка", "авто мойка", "мойка автомобилей", "мойка машин"],
      uz: ["avtoyuvish", "avto yuvish", "mashina yuvish"],
      en: ["car wash", "carwash", "vehicle wash", "self-service wash"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },

  {
    businessType: "bakery",
    normalizedSector: "bakery and baked goods production",
    possibleHsCodes: ["1905"],
    possibleActivityCodes: ["C10", "G47", "I56"],
    keywords: {
      ru: ["пекарня", "мини-пекарня", "хлеб", "выпечка", "самса", "булочки"],
      uz: ["nonvoyxona", "non", "somsa", "pishiriq"],
      en: ["bakery", "bread", "baked goods", "pastry"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "ice cream / dessert kiosk",
    normalizedSector: "food service and ice cream",
    possibleHsCodes: ["2105"],
    possibleActivityCodes: ["I56"],
    keywords: {
      ru: ["мороженое", "мороженного", "ларек мороженого", "киоск мороженого"],
      uz: ["muzqaymoq", "muzqaymoq do'koni"],
      en: ["ice cream", "ice-cream", "food kiosk", "dessert kiosk"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "furniture manufacturing",
    normalizedSector: "furniture manufacturing",
    possibleHsCodes: ["9403", "9401"],
    possibleActivityCodes: ["C31"],
    keywords: {
      ru: ["мебель", "мебельный цех", "производство мебели"],
      uz: ["mebel", "duradgor"],
      en: ["furniture", "furniture manufacturing"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "beauty salon",
    normalizedSector: "personal services",
    possibleHsCodes: [],
    possibleActivityCodes: ["S96"],
    keywords: {
      ru: ["салон красоты", "парикмахерская", "маникюр"],
      uz: ["go'zallik saloni", "sartarosh"],
      en: ["beauty salon", "barber", "hair salon"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "poultry farm",
    normalizedSector: "poultry farming",
    possibleHsCodes: ["0105", "0407", "0207"],
    possibleActivityCodes: ["A01"],
    keywords: {
      ru: ["птицеферма", "бройлер", "яйца", "курица"],
      uz: ["parrandachilik", "tovuq", "tuxum"],
      en: ["poultry", "broiler", "eggs", "poultry farm"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "ecommerce store",
    normalizedSector: "retail ecommerce",
    possibleHsCodes: [],
    possibleActivityCodes: ["G47"],
    keywords: {
      ru: ["онлайн-магазин", "интернет-магазин", "маркетплейс"],
      uz: ["onlayn do'kon", "internet do'kon"],
      en: ["ecommerce", "e-commerce", "online store", "marketplace"]
    },
    confidence: "medium",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "import export",
    normalizedSector: "wholesale trade and cross-border trade",
    possibleHsCodes: [],
    possibleActivityCodes: ["G46"],
    keywords: {
      ru: ["импорт", "экспорт", "поставка из китая"],
      uz: ["import", "eksport", "xitoydan"],
      en: ["import", "export", "china sourcing"]
    },
    confidence: "medium",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "production of toys",
    normalizedSector: "toy manufacturing",
    possibleHsCodes: ["9503"],
    possibleActivityCodes: ["C32"],
    keywords: {
      ru: ["игрушки", "производство игрушек", "детские игрушки"],
      uz: ["o'yinchoqlar", "o'yinchoq ishlab chiqarish"],
      en: ["toys", "toy manufacturing"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "sewing workshop",
    normalizedSector: "garment manufacturing",
    possibleHsCodes: ["61", "62", "63"],
    possibleActivityCodes: ["C14"],
    keywords: {
      ru: ["швейный цех", "пошив", "одежда", "текстиль"],
      uz: ["tikuv sexi", "kiyim", "to'qimachilik"],
      en: ["sewing", "garment", "apparel", "textile"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  },
  {
    businessType: "coffee shop",
    normalizedSector: "food service",
    possibleHsCodes: [],
    possibleActivityCodes: ["I56"],
    keywords: {
      ru: ["кофейня", "кафе", "общепит", "кофе"],
      uz: ["qahvaxona", "kafe", "umumiy ovqatlanish"],
      en: ["coffee shop", "cafe", "food service"]
    },
    confidence: "high",
    mappingSource: "static_dictionary"
  }
];

function includesKeyword(value: string, keywords: string[]) {
  const normalized = value.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function mapBusinessToSector(businessType: string): SectorMapping {
  const matched = staticMappings.find((mapping) =>
    includesKeyword(businessType, [...mapping.keywords.ru, ...mapping.keywords.uz, ...mapping.keywords.en])
  );
  if (matched) return { ...matched, businessType };

  return {
    businessType,
    normalizedSector: "generic business activity",
    possibleHsCodes: [],
    possibleActivityCodes: [],
    keywords: {
      ru: [businessType],
      uz: [businessType],
      en: [businessType]
    },
    confidence: "low",
    mappingSource: "static_dictionary"
  };
}

export function shouldAskForMappingClarification(mapping: SectorMapping) {
  return mapping.confidence === "low" || (mapping.possibleHsCodes.length === 0 && mapping.possibleActivityCodes?.length === 0);
}
