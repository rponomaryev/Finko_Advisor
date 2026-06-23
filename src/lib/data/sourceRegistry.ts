export type DataSource = {
  id: string;
  name: string;
  countryScope: "UZ" | "GLOBAL" | "REGIONAL";
  sourceType:
    | "official_statistics"
    | "government_registry"
    | "legal_database"
    | "central_bank"
    | "tax"
    | "customs"
    | "international_organization"
    | "development_bank"
    | "industry_report"
    | "financial_market"
    | "market_proxy"
    | "geospatial"
    | "commerce_platform";
  reliability: "very_high" | "high" | "medium";
  updateFrequency?: "daily" | "weekly" | "monthly" | "quarterly" | "annual" | "irregular";
  language?: ("ru" | "uz" | "en")[];
  applicableCategories: string[];
  indicators: string[];
  useCases: string[];
  limitations?: string[];
  requiresManualVerification?: boolean;
  url?: string;
  title?: string;
  organization?: string;
  country?: string;
  region?: string;
  sectors?: string[];
  topics?: string[];
  languages?: ("ru" | "uz" | "en")[];
  reliabilityScore?: number;
  freshnessPolicy?: "daily" | "monthly" | "quarterly" | "annual" | "static_law" | "manual_check";
  reportSourceType?: "official" | "statistics" | "law" | "tax" | "license" | "bank" | "IFI" | "industry" | "market" | "secondary";
  citationTemplate?: string;
};

export const sourceRegistry: DataSource[] = [
  {
    "id": "stat_uz",
    "name": "Национальный комитет по статистике Республики Узбекистан",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "monthly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all"
    ],
    "indicators": [
      "GDP",
      "GRP",
      "population",
      "SME",
      "services",
      "industry",
      "trade",
      "construction",
      "investment",
      "prices",
      "labor",
      "demography",
      "agriculture"
    ],
    "useCases": [
      "official market context",
      "regional benchmarks"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_small_business",
    "name": "Национальный комитет по статистике: official statistics: small business and entrepreneurship",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "SME share",
      "regional entrepreneurship",
      "small business output"
    ],
    "useCases": [
      "SME context",
      "bankability narrative"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_labor",
    "name": "Национальный комитет по статистике: official statistics: labor market",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "services",
      "manufacturing",
      "retail",
      "food_service",
      "logistics",
      "education",
      "healthcare",
      "labor_market"
    ],
    "indicators": [
      "wages",
      "employment",
      "unemployment",
      "workforce"
    ],
    "useCases": [
      "payroll benchmark",
      "staff availability"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_services",
    "name": "Национальный комитет по статистике: official statistics: market services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "services",
      "services_statistics",
      "food_service",
      "beauty_wellness",
      "education",
      "healthcare",
      "tourism_hospitality"
    ],
    "indicators": [
      "market services volume",
      "regional services"
    ],
    "useCases": [
      "service demand context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_leisure_services",
    "name": "Статистика по услугам досуга и развлечений",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": ["ru", "uz", "en"],
    "applicableCategories": ["services", "entertainment", "tourism_hospitality", "rental", "leisure"],
    "indicators": ["leisure services", "entertainment services", "recreation", "market services volume", "regional services"],
    "useCases": ["leisure demand proxy", "entertainment market context", "rental service proxy"],
    "url": "https://stat.uz",
    "title": "Statistics Agency: leisure and recreation services proxy",
    "organization": "Национальный комитет по статистике Республики Узбекистан",
    "sectors": ["leisure", "entertainment", "rental", "services"],
    "topics": ["market services", "leisure", "recreation", "entertainment", "regional demand"],
    "languages": ["ru", "uz", "en"],
    "reliabilityScore": 95,
    "freshnessPolicy": "quarterly",
    "reportSourceType": "statistics",
    "citationTemplate": "Национальный комитет по статистике, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "uzbektourism_data",
    "name": "Комитет по туризму: посещаемость и туристические потоки",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "high",
    "updateFrequency": "quarterly",
    "language": ["ru", "uz", "en"],
    "applicableCategories": ["tourism_hospitality", "entertainment", "services", "leisure", "travel"],
    "indicators": ["tourist flows", "visits", "domestic tourism", "hospitality demand"],
    "useCases": ["tourism and leisure demand proxy", "regional visitor flow context"],
    "url": "https://uzbektourism.uz",
    "title": "Tourism Committee visitor-flow and tourism activity data",
    "organization": "Комитет по туризму Республики Узбекистан",
    "sectors": ["tourism", "hospitality", "leisure", "entertainment"],
    "topics": ["visitor flow", "tourism demand", "domestic tourism", "location traffic"],
    "languages": ["ru", "uz", "en"],
    "reliabilityScore": 82,
    "freshnessPolicy": "quarterly",
    "reportSourceType": "official",
    "citationTemplate": "Комитет по туризму, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "sport_ministry_stats",
    "name": "Министерство спорта: физкультурная активность населения",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": ["ru", "uz"],
    "applicableCategories": ["entertainment", "services", "fitness", "sports", "leisure", "education"],
    "indicators": ["sports participation", "physical activity", "sports facilities", "youth sports"],
    "useCases": ["sports and fitness demand proxy", "children sports section context"],
    "url": "https://minsport.uz",
    "title": "Ministry of Sport activity and sports participation indicators",
    "organization": "Министерство спорта Республики Узбекистан",
    "sectors": ["sports", "fitness", "leisure", "children activities"],
    "topics": ["physical activity", "sports participation", "youth sports", "fitness demand"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 80,
    "freshnessPolicy": "annual",
    "reportSourceType": "official",
    "citationTemplate": "Министерство спорта, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "commercial_real_estate_uz",
    "name": "Коммерческая недвижимость UZ: OLX + Uybor proxy",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "weekly",
    "language": ["ru", "uz"],
    "applicableCategories": ["all", "real_estate", "retail", "food_service", "services", "entertainment", "beauty_wellness", "education"],
    "indicators": ["commercial rent", "retail space", "office rent", "location cost", "premises"],
    "useCases": ["rent benchmark proxy", "location cost assumption", "standalone location validation"],
    "url": "https://www.olx.uz/nedvizhimost/kommercheskaya-nedvizhimost/",
    "title": "Commercial real estate listing proxy for rent benchmarks",
    "organization": "OLX Uzbekistan / Uybor proxy",
    "sectors": ["commercial real estate", "retail premises", "office rent", "mall kiosk"],
    "topics": ["rent", "commercial rent", "location", "premises", "lease"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 58,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "market",
    "citationTemplate": "OLX/Uybor proxy, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "tashkent_mall_rental_rates",
    "name": "Ставки аренды в ТЦ Ташкента (proxy: hh.uz + 2GIS)",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "monthly",
    "language": ["ru", "uz"],
    "applicableCategories": ["retail", "food_service", "beauty_wellness", "services", "entertainment", "mall_kiosk", "real_estate"],
    "indicators": ["mall rent", "kiosk rent", "shopping center traffic", "retail location cost"],
    "useCases": ["mall kiosk rent proxy", "retail traffic proxy", "location economics stress check"],
    "url": "https://2gis.uz/tashkent",
    "title": "Tashkent mall rent and traffic proxy",
    "organization": "2GIS / listing proxy",
    "sectors": ["mall retail", "food court", "kiosk", "shopping center"],
    "topics": ["mall rent", "kiosk", "traffic", "location", "lease"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 55,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "market",
    "citationTemplate": "2GIS/listing proxy, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "hh_uz_salary_benchmark",
    "name": "HeadHunter UZ: зарплатные бенчмарки по должностям",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "weekly",
    "language": ["ru", "uz", "en"],
    "applicableCategories": ["all", "labor_market", "staff", "services", "retail", "food_service", "manufacturing", "it_digital", "education"],
    "indicators": ["salary benchmark", "wage offer", "occupation salary", "payroll"],
    "useCases": ["payroll benchmark", "staff cost validation", "role-specific wage proxy"],
    "url": "https://hh.uz",
    "title": "HeadHunter Uzbekistan vacancy salary benchmark proxy",
    "organization": "HeadHunter Uzbekistan",
    "sectors": ["labor market", "salary", "staffing", "payroll"],
    "topics": ["wages", "salary", "vacancies", "payroll", "staff cost"],
    "languages": ["ru", "uz", "en"],
    "reliabilityScore": 62,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "market",
    "citationTemplate": "HeadHunter Uzbekistan, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "ish_uz_salary_benchmark",
    "name": "Ish.uz: зарплатные предложения по должностям",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "weekly",
    "language": ["ru", "uz"],
    "applicableCategories": ["all", "labor_market", "staff", "services", "retail", "food_service", "manufacturing", "construction", "logistics"],
    "indicators": ["salary offer", "vacancy wage", "occupation benchmark", "payroll"],
    "useCases": ["salary proxy", "staffing cost benchmark", "regional wage check"],
    "url": "https://ish.uz",
    "title": "Ish.uz vacancy salary offers by role",
    "organization": "Ish.uz",
    "sectors": ["labor market", "salary", "vacancies", "staffing"],
    "topics": ["wages", "salary", "vacancies", "payroll", "staff cost"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 58,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "market",
    "citationTemplate": "Ish.uz, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "tariff_electricity_2025",
    "name": "Тариф на электроэнергию для ЮЛ/ИП 2025 (Минэнерго)",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": ["ru", "uz"],
    "applicableCategories": ["all", "utilities", "manufacturing", "food_service", "services", "entertainment", "auto_service", "agriculture"],
    "indicators": ["electricity tariff", "utility tariff", "energy cost", "business electricity"],
    "useCases": ["utility cost validation", "electricity cost benchmark", "manufacturing and food-service opex"],
    "url": "https://minenergy.uz",
    "title": "Electricity tariff for business users",
    "organization": "Министерство энергетики Республики Узбекистан",
    "sectors": ["utilities", "electricity", "energy", "opex"],
    "topics": ["electricity", "tariff", "utilities", "energy cost"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 84,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "official",
    "citationTemplate": "Минэнерго, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "tariff_gas_2025",
    "name": "Тариф на природный газ для бизнеса 2025 (Худудгаз)",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": ["ru", "uz"],
    "applicableCategories": ["all", "utilities", "manufacturing", "food_service", "agriculture", "services"],
    "indicators": ["gas tariff", "natural gas", "utility tariff", "energy cost"],
    "useCases": ["gas cost validation", "bakery and manufacturing opex", "utility stress check"],
    "url": "https://hududgaz.uz",
    "title": "Natural gas tariff for business users",
    "organization": "Hududgazta'minot",
    "sectors": ["utilities", "gas", "energy", "opex"],
    "topics": ["gas", "tariff", "utilities", "energy cost"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 82,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "official",
    "citationTemplate": "Hududgaz, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "tariff_water_2025",
    "name": "Тариф на воду для бизнеса 2025 (Сувокова)",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": ["ru", "uz"],
    "applicableCategories": ["all", "utilities", "food_service", "services", "auto_service", "beauty_wellness", "manufacturing"],
    "indicators": ["water tariff", "sewerage tariff", "utility tariff", "water cost"],
    "useCases": ["water cost validation", "car wash and food-service opex", "utility stress check"],
    "url": "https://suvsoz.uz",
    "title": "Water and sewerage tariffs for business users",
    "organization": "Suvsoz / Suv ta'minoti",
    "sectors": ["utilities", "water", "sewerage", "opex"],
    "topics": ["water", "sewerage", "tariff", "utilities", "water cost"],
    "languages": ["ru", "uz"],
    "reliabilityScore": 80,
    "freshnessPolicy": "manual_check",
    "reportSourceType": "official",
    "citationTemplate": "Suvsoz, {year}",
    "requiresManualVerification": true
  },
  {
    "id": "stat_trade",
    "name": "Национальный комитет по статистике: official statistics: wholesale and retail trade",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "food_service",
      "trade"
    ],
    "indicators": [
      "retail turnover",
      "wholesale trade",
      "FMCG"
    ],
    "useCases": [
      "retail demand benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_industry",
    "name": "Национальный комитет по статистике: official statistics: industry and manufacturing",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "recycling_waste",
      "energy",
      "mining",
      "industry"
    ],
    "indicators": [
      "industrial output",
      "manufacturing production"
    ],
    "useCases": [
      "manufacturing sector context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_construction",
    "name": "Национальный комитет по статистике: official statistics: construction",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "construction",
      "real_estate",
      "manufacturing"
    ],
    "indicators": [
      "construction output",
      "building materials",
      "real estate"
    ],
    "useCases": [
      "construction demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_agriculture",
    "name": "Национальный комитет по статистике: official statistics: agriculture",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "yield",
      "livestock",
      "crop areas",
      "regions"
    ],
    "useCases": [
      "agriculture production benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_investment",
    "name": "Национальный комитет по статистике: official statistics: investment in fixed capital",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "investment"
    ],
    "indicators": [
      "CapEx",
      "fixed capital investment",
      "regional investment"
    ],
    "useCases": [
      "investment activity benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_cpi",
    "name": "Национальный комитет по статистике: official statistics: CPI and consumer prices",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "monthly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "prices"
    ],
    "indicators": [
      "CPI",
      "consumer prices",
      "price escalation"
    ],
    "useCases": [
      "sensitivity assumptions",
      "inflation context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_demography",
    "name": "Национальный комитет по статистике: official statistics: demography and population",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "education",
      "healthcare",
      "services",
      "beauty_wellness",
      "demography"
    ],
    "indicators": [
      "population",
      "age groups",
      "regional demographics"
    ],
    "useCases": [
      "market sizing context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_transport_telecom",
    "name": "Национальный комитет по статистике: official statistics: transport and communications",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport",
      "ecommerce",
      "it_digital"
    ],
    "indicators": [
      "transport",
      "telecom",
      "delivery infrastructure"
    ],
    "useCases": [
      "logistics and digital context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "data_egov_uz",
    "name": "Open Data Portal of the Republic of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "weekly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "open_data"
    ],
    "indicators": [
      "machine-readable datasets",
      "open data"
    ],
    "useCases": [
      "cross-check official datasets",
      "API integrations"
    ],
    "url": "https://data.egov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "my_gov_uz",
    "name": "Single Portal of Interactive Public Services",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents",
      "permits"
    ],
    "indicators": [
      "business registration",
      "government services",
      "permits"
    ],
    "useCases": [
      "registration steps",
      "practical procedures"
    ],
    "url": "https://my.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "business_registration",
    "name": "Government services: business entity registration",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents",
      "permits"
    ],
    "indicators": [
      "LLC",
      "sole entrepreneur",
      "registration"
    ],
    "useCases": [
      "business registration requirements"
    ],
    "url": "https://my.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "license_gov_uz",
    "name": "Electronic Licensing System of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents",
      "permits",
      "healthcare",
      "education",
      "food_service",
      "logistics",
      "construction",
      "services"
    ],
    "indicators": [
      "licenses",
      "permits",
      "notifications",
      "required documents"
    ],
    "useCases": [
      "regulated activity check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "lex_uz",
    "name": "National Legislation Database of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "legal_database",
    "reliability": "very_high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents",
      "legal",
      "permits"
    ],
    "indicators": [
      "laws",
      "resolutions",
      "legal basis"
    ],
    "useCases": [
      "legal basis for report"
    ],
    "url": "https://lex.uz",
    "requiresManualVerification": true
  },
  {
    "id": "minjust_uz",
    "name": "Ministry of Justice of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents",
      "legal"
    ],
    "indicators": [
      "legal information",
      "state services",
      "registration"
    ],
    "useCases": [
      "legal services context"
    ],
    "url": "https://adliya.uz",
    "requiresManualVerification": true
  },
  {
    "id": "tax_uz",
    "name": "Tax Committee of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "tax",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "tax",
      "documents"
    ],
    "indicators": [
      "tax regime",
      "e-invoice",
      "cash register",
      "tax compliance"
    ],
    "useCases": [
      "tax registration",
      "compliance checklist"
    ],
    "url": "https://soliq.uz",
    "requiresManualVerification": true
  },
  {
    "id": "cbu_uz",
    "name": "Central Bank of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "central_bank",
    "reliability": "very_high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "import_export",
      "financial_services",
      "currency",
      "prices"
    ],
    "indicators": [
      "exchange rates",
      "inflation",
      "banking statistics",
      "payments",
      "credits"
    ],
    "useCases": [
      "currency risk",
      "loan context"
    ],
    "url": "https://cbu.uz",
    "requiresManualVerification": true
  },
  {
    "id": "cbu_bulletins",
    "name": "Central Bank statistical bulletins",
    "countryScope": "UZ",
    "sourceType": "central_bank",
    "reliability": "very_high",
    "updateFrequency": "monthly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "macro"
    ],
    "indicators": [
      "banking sector",
      "balance of payments",
      "reserves"
    ],
    "useCases": [
      "macro-financial indicators"
    ],
    "url": "https://cbu.uz",
    "requiresManualVerification": true
  },
  {
    "id": "miit_uz",
    "name": "Ministry of Investment, Industry and Trade",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export",
      "retail",
      "all"
    ],
    "indicators": [
      "investment programs",
      "industrial policy",
      "trade policy"
    ],
    "useCases": [
      "sector initiatives"
    ],
    "url": "https://miit.uz",
    "requiresManualVerification": true
  },
  {
    "id": "customs_uz",
    "name": "Customs Committee of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "customs",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "retail",
      "manufacturing",
      "customs"
    ],
    "indicators": [
      "customs procedures",
      "foreign trade operations"
    ],
    "useCases": [
      "customs compliance"
    ],
    "url": "https://customs.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_foreign_trade",
    "name": "Национальный комитет по статистике: official statistics: foreign trade",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "retail",
      "agriculture",
      "trade"
    ],
    "indicators": [
      "imports",
      "exports",
      "partner countries",
      "commodity groups"
    ],
    "useCases": [
      "trade concentration",
      "import exposure"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "ecology_uz",
    "name": "Ministry / Committee for Ecology, Environmental Protection and Climate Change",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "agriculture",
      "auto_service",
      "recycling_waste",
      "healthcare",
      "environmental",
      "services"
    ],
    "indicators": [
      "environmental requirements",
      "waste",
      "permits"
    ],
    "useCases": [
      "environmental risk"
    ],
    "url": "https://eco.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "sanepid_uz",
    "name": "Sanitary-Epidemiological Welfare and Public Health Committee",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "food_service",
      "healthcare",
      "education",
      "beauty_wellness",
      "sanitary"
    ],
    "indicators": [
      "sanitary norms",
      "public health",
      "food safety"
    ],
    "useCases": [
      "sanitary risk"
    ],
    "url": "https://sanepid.uz",
    "requiresManualVerification": true
  },
  {
    "id": "employment_uz",
    "name": "Ministry of Employment and Poverty Reduction",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "employment",
      "support programs",
      "labor market"
    ],
    "useCases": [
      "entrepreneurship support",
      "labor context"
    ],
    "url": "https://mehnat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "cci_uz",
    "name": "Chamber of Commerce and Industry of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "SME",
      "export"
    ],
    "indicators": [
      "business directories",
      "export products",
      "consultations"
    ],
    "useCases": [
      "SME advisory",
      "market contacts"
    ],
    "url": "https://chamber.uz",
    "requiresManualVerification": true
  },
  {
    "id": "transport_ministry_uz",
    "name": "Ministry of Transport",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport"
    ],
    "indicators": [
      "transport permits",
      "transport infrastructure"
    ],
    "useCases": [
      "transport compliance"
    ],
    "url": "https://mintrans.uz",
    "requiresManualVerification": true
  },
  {
    "id": "agriculture_ministry_uz",
    "name": "Ministry of Agriculture",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture"
    ],
    "indicators": [
      "agro programs",
      "crop policy",
      "livestock policy"
    ],
    "useCases": [
      "agriculture compliance"
    ],
    "url": "https://agro.uz",
    "requiresManualVerification": true
  },
  {
    "id": "digital_ministry_uz",
    "name": "Ministry of Digital Technologies",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "IT",
      "telecom",
      "startup policy",
      "digital infrastructure"
    ],
    "useCases": [
      "digital business context"
    ],
    "url": "https://digital.uz",
    "requiresManualVerification": true
  },
  {
    "id": "construction_ministry_uz",
    "name": "Ministry of Construction and Housing and Communal Services",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "construction",
      "real_estate"
    ],
    "indicators": [
      "construction permits",
      "construction norms"
    ],
    "useCases": [
      "construction compliance"
    ],
    "url": "https://mc.uz",
    "requiresManualVerification": true
  },
  {
    "id": "health_ministry_uz",
    "name": "Ministry of Health",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "medical services",
      "health regulations",
      "clinics",
      "pharmacies"
    ],
    "useCases": [
      "healthcare compliance"
    ],
    "url": "https://ssv.uz",
    "requiresManualVerification": true
  },
  {
    "id": "education_ministry_uz",
    "name": "Ministry of Preschool and School Education",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education"
    ],
    "indicators": [
      "school education",
      "children services",
      "education policy"
    ],
    "useCases": [
      "education compliance"
    ],
    "url": "https://maktabgacha.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_regional_grdp",
    "name": "Национальный комитет по статистике: official statistics: GRP by region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "gross regional product",
      "regional economy"
    ],
    "useCases": [
      "regional market sizing"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_regional_population",
    "name": "Национальный комитет по статистике: official statistics: population by region/district",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "demography"
    ],
    "indicators": [
      "regional population",
      "district population"
    ],
    "useCases": [
      "catchment area sizing"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_urban_rural",
    "name": "Национальный комитет по статистике: official statistics: urban and rural population",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "services",
      "food_service",
      "agriculture"
    ],
    "indicators": [
      "urbanization",
      "rural population"
    ],
    "useCases": [
      "location demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_households",
    "name": "Национальный комитет по статистике: official statistics: households",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "education",
      "healthcare",
      "services"
    ],
    "indicators": [
      "households",
      "family size"
    ],
    "useCases": [
      "consumer market proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_income",
    "name": "Национальный комитет по статистике: official statistics: household income",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "education",
      "healthcare",
      "beauty_wellness"
    ],
    "indicators": [
      "income",
      "consumption"
    ],
    "useCases": [
      "affordability proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_consumer_spending",
    "name": "Национальный комитет по статистике: official statistics: household consumption expenditure",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "ecommerce"
    ],
    "indicators": [
      "consumer spending",
      "expenditure"
    ],
    "useCases": [
      "demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_wages_by_sector",
    "name": "Национальный комитет по статистике: official statistics: average wages by sector",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "sector wages",
      "payroll"
    ],
    "useCases": [
      "salary benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_employment_by_sector",
    "name": "Национальный комитет по статистике: official statistics: employment by economic activity",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "employment by sector"
    ],
    "useCases": [
      "staff availability proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_business_entities",
    "name": "Национальный комитет по статистике: official statistics: registered enterprises",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "registered enterprises",
      "business demography"
    ],
    "useCases": [
      "competition and SME density"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_active_enterprises",
    "name": "Национальный комитет по статистике: official statistics: active enterprises",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "active enterprises"
    ],
    "useCases": [
      "market saturation proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_new_businesses",
    "name": "Национальный комитет по статистике: official statistics: newly created enterprises",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "new businesses",
      "startups"
    ],
    "useCases": [
      "entrepreneurship activity"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_closed_businesses",
    "name": "Национальный комитет по статистике: official statistics: closed enterprises",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "risk"
    ],
    "indicators": [
      "business closures"
    ],
    "useCases": [
      "sector risk proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_microfirms",
    "name": "Национальный комитет по статистике: official statistics: microfirms and small enterprises",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "microfirms",
      "small enterprises"
    ],
    "useCases": [
      "SME benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_services_by_region",
    "name": "Национальный комитет по статистике: official statistics: services by region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "services",
      "beauty_wellness",
      "auto_service",
      "education",
      "healthcare"
    ],
    "indicators": [
      "service volume by region"
    ],
    "useCases": [
      "regional service demand"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_personal_services",
    "name": "Национальный комитет по статистике: official statistics: personal services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "services",
      "beauty_wellness"
    ],
    "indicators": [
      "personal services",
      "household services"
    ],
    "useCases": [
      "service market proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_repair_services",
    "name": "Национальный комитет по статистике: official statistics: repair and maintenance services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "services",
      "auto_service"
    ],
    "indicators": [
      "repair services",
      "maintenance services"
    ],
    "useCases": [
      "auto/service market proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_transport_services",
    "name": "Национальный комитет по статистике: official statistics: transport services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport"
    ],
    "indicators": [
      "transport services volume"
    ],
    "useCases": [
      "logistics demand context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_ict_services",
    "name": "Национальный комитет по статистике: official statistics: ICT services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "ICT services",
      "telecom services"
    ],
    "useCases": [
      "digital market context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_education_services",
    "name": "Национальный комитет по статистике: official statistics: education services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education"
    ],
    "indicators": [
      "education services volume"
    ],
    "useCases": [
      "education business context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_health_services",
    "name": "Национальный комитет по статистике: official statistics: health services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "health services volume"
    ],
    "useCases": [
      "healthcare demand context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_hospitality_services",
    "name": "Национальный комитет по статистике: official statistics: accommodation and food services",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service"
    ],
    "indicators": [
      "hospitality services",
      "food service volume"
    ],
    "useCases": [
      "hospitality demand context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_retail_food",
    "name": "Национальный комитет по статистике: official statistics: retail food turnover",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service"
    ],
    "indicators": [
      "food retail turnover"
    ],
    "useCases": [
      "food demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_retail_nonfood",
    "name": "Национальный комитет по статистике: official statistics: non-food retail turnover",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce"
    ],
    "indicators": [
      "non-food retail"
    ],
    "useCases": [
      "retail category context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_wholesale_trade",
    "name": "Национальный комитет по статистике: official statistics: wholesale trade",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "manufacturing",
      "import_export"
    ],
    "indicators": [
      "wholesale turnover"
    ],
    "useCases": [
      "B2B distribution proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_market_prices_food",
    "name": "Национальный комитет по статистике: official statistics: food prices",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "food_service",
      "retail",
      "agriculture",
      "prices"
    ],
    "indicators": [
      "food prices"
    ],
    "useCases": [
      "food cost assumptions"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_market_prices_fuel",
    "name": "Национальный комитет по статистике: official statistics: fuel prices",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport",
      "agriculture",
      "construction"
    ],
    "indicators": [
      "fuel prices"
    ],
    "useCases": [
      "transport cost assumptions"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_market_prices_building",
    "name": "Национальный комитет по статистике: official statistics: construction material prices",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "construction",
      "real_estate",
      "manufacturing"
    ],
    "indicators": [
      "building material prices"
    ],
    "useCases": [
      "CapEx/cost escalation proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_producer_prices",
    "name": "Национальный комитет по статистике: official statistics: producer price index",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "agriculture",
      "construction"
    ],
    "indicators": [
      "PPI",
      "producer prices"
    ],
    "useCases": [
      "cost inflation sensitivity"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_industrial_by_activity",
    "name": "Национальный комитет по статистике: official statistics: industrial output by activity",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "energy",
      "mining"
    ],
    "indicators": [
      "output by activity"
    ],
    "useCases": [
      "sector benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_textile_industry",
    "name": "Национальный комитет по статистике: official statistics: textile/apparel industry",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "retail",
      "import_export"
    ],
    "indicators": [
      "textile output",
      "apparel"
    ],
    "useCases": [
      "sewing/apparel market context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_food_manufacturing",
    "name": "Национальный комитет по статистике: official statistics: food manufacturing",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "food_service",
      "agriculture"
    ],
    "indicators": [
      "food production"
    ],
    "useCases": [
      "food production benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_furniture_manufacturing",
    "name": "Национальный комитет по статистике: official statistics: furniture manufacturing",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing"
    ],
    "indicators": [
      "furniture production"
    ],
    "useCases": [
      "furniture workshop benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_chemicals_industry",
    "name": "Национальный комитет по статистике: official statistics: chemicals industry",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "agriculture",
      "recycling_waste"
    ],
    "indicators": [
      "chemicals production"
    ],
    "useCases": [
      "chemical input context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_machinery_equipment",
    "name": "Национальный комитет по статистике: official statistics: machinery and equipment",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export"
    ],
    "indicators": [
      "machinery production"
    ],
    "useCases": [
      "equipment market context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_energy_supply",
    "name": "Национальный комитет по статистике: official statistics: electricity, gas, steam supply",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "energy",
      "manufacturing",
      "food_service",
      "agriculture"
    ],
    "indicators": [
      "energy supply"
    ],
    "useCases": [
      "utility risk context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_water_supply_waste",
    "name": "Национальный комитет по статистике: official statistics: water supply, sewerage and waste",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "recycling_waste",
      "manufacturing",
      "food_service",
      "auto_service"
    ],
    "indicators": [
      "water supply",
      "waste management"
    ],
    "useCases": [
      "infrastructure/environmental context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_crop_output",
    "name": "Национальный комитет по статистике: official statistics: crop production",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "crop output",
      "harvest"
    ],
    "useCases": [
      "agro supply context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_livestock_output",
    "name": "Национальный комитет по статистике: official statistics: livestock production",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "livestock",
      "milk",
      "meat"
    ],
    "useCases": [
      "agro/food supply context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_greenhouse_area",
    "name": "Национальный комитет по статистике: official statistics: greenhouse agriculture indicators",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture"
    ],
    "indicators": [
      "greenhouse area",
      "vegetables"
    ],
    "useCases": [
      "greenhouse benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_farm_entities",
    "name": "Национальный комитет по статистике: official statistics: farms and dehkan entities",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture"
    ],
    "indicators": [
      "farms",
      "agro entities"
    ],
    "useCases": [
      "agro business density"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_tourism_arrivals",
    "name": "Национальный комитет по статистике: official statistics: tourism arrivals",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service",
      "retail"
    ],
    "indicators": [
      "tourist arrivals"
    ],
    "useCases": [
      "tourism demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_hotel_capacity",
    "name": "Национальный комитет по статистике: official statistics: hotels and accommodation capacity",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "real_estate"
    ],
    "indicators": [
      "hotel rooms",
      "accommodation"
    ],
    "useCases": [
      "hospitality benchmark"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_passenger_transport",
    "name": "Национальный комитет по статистике: official statistics: passenger transport",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "transport",
      "logistics",
      "tourism_hospitality"
    ],
    "indicators": [
      "passenger trips"
    ],
    "useCases": [
      "transport demand"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_freight_transport",
    "name": "Национальный комитет по статистике: official statistics: freight transport",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport",
      "import_export"
    ],
    "indicators": [
      "freight turnover",
      "cargo"
    ],
    "useCases": [
      "logistics demand"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_vehicle_fleet_proxy",
    "name": "Национальный комитет по статистике: official statistics: transport/vehicle indicators",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "auto_service",
      "services",
      "transport"
    ],
    "indicators": [
      "vehicles",
      "transport fleet"
    ],
    "useCases": [
      "auto-service demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_internet_users",
    "name": "Национальный комитет по статистике: official statistics: internet/users ICT",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "internet users",
      "ICT access"
    ],
    "useCases": [
      "digital demand context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_mobile_subscribers",
    "name": "Национальный комитет по статистике: official statistics: mobile communication",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce",
      "financial_services"
    ],
    "indicators": [
      "mobile subscribers"
    ],
    "useCases": [
      "digital service proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_education_enrollment",
    "name": "Национальный комитет по статистике: official statistics: education enrollment",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education"
    ],
    "indicators": [
      "students",
      "schools",
      "enrollment"
    ],
    "useCases": [
      "education demand proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_health_facilities",
    "name": "Национальный комитет по статистике: official statistics: healthcare facilities",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "clinics",
      "hospitals",
      "doctors"
    ],
    "useCases": [
      "healthcare supply proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_pharmacy_trade_proxy",
    "name": "Национальный комитет по статистике: official statistics: pharmaceutical/health goods proxy",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare",
      "retail"
    ],
    "indicators": [
      "pharmaceutical goods",
      "health retail"
    ],
    "useCases": [
      "pharmacy market proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_regional_investment",
    "name": "Национальный комитет по статистике: official statistics: regional investment",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "investment"
    ],
    "indicators": [
      "regional fixed capital investment"
    ],
    "useCases": [
      "regional investment climate"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_foreign_investment",
    "name": "Национальный комитет по статистике: official statistics: foreign investment",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export",
      "all"
    ],
    "indicators": [
      "FDI",
      "foreign investment"
    ],
    "useCases": [
      "investment climate context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_external_debt_macro",
    "name": "Национальный комитет по статистике: official statistics: external sector macro",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "import_export"
    ],
    "indicators": [
      "external sector"
    ],
    "useCases": [
      "macro risk context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_poverty_income",
    "name": "Национальный комитет по статистике: official statistics: poverty/income indicators",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "education",
      "healthcare"
    ],
    "indicators": [
      "poverty",
      "income"
    ],
    "useCases": [
      "affordability risk"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_gender_stats",
    "name": "Official gender statistics",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education",
      "healthcare",
      "retail",
      "services"
    ],
    "indicators": [
      "gender statistics"
    ],
    "useCases": [
      "customer segment proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_youth_stats",
    "name": "Official youth statistics",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education",
      "entertainment",
      "it_digital",
      "retail"
    ],
    "indicators": [
      "youth",
      "age groups"
    ],
    "useCases": [
      "youth market proxy"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_price_observation_methods",
    "name": "Statistics metadata: price observation methodology",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "prices"
    ],
    "indicators": [
      "price methodology"
    ],
    "useCases": [
      "data quality check"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_classification_okved",
    "name": "Statistics/business activity classification references",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents"
    ],
    "indicators": [
      "activity classification",
      "OKED"
    ],
    "useCases": [
      "business type mapping"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_sustainable_development_goals",
    "name": "Official SDG indicators",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "environmental",
      "social"
    ],
    "indicators": [
      "SDG indicators"
    ],
    "useCases": [
      "sustainability context"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "gov_uz",
    "name": "Government portal of the Republic of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents"
    ],
    "indicators": [
      "state bodies",
      "public services",
      "official news"
    ],
    "useCases": [
      "primary source navigation"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regulation_gov_uz",
    "name": "Regulatory impact and draft legal acts discussion portal",
    "countryScope": "UZ",
    "sourceType": "legal_database",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "legal",
      "documents"
    ],
    "indicators": [
      "draft regulation",
      "public consultation"
    ],
    "useCases": [
      "upcoming regulatory changes"
    ],
    "url": "https://regulation.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "project_gov_uz",
    "name": "Public discussion of draft normative legal acts",
    "countryScope": "UZ",
    "sourceType": "legal_database",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "legal"
    ],
    "indicators": [
      "draft laws",
      "public discussion"
    ],
    "useCases": [
      "regulatory horizon scanning"
    ],
    "url": "https://project.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "e_qaror",
    "name": "Local government decisions portal",
    "countryScope": "UZ",
    "sourceType": "legal_database",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "legal"
    ],
    "indicators": [
      "local decisions",
      "regional rules"
    ],
    "useCases": [
      "regional compliance check"
    ],
    "url": "https://e-qaror.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "open_budget",
    "name": "Open Budget portal",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "government"
    ],
    "indicators": [
      "public budget",
      "regional spending"
    ],
    "useCases": [
      "public investment/regional context"
    ],
    "url": "https://openbudget.uz",
    "requiresManualVerification": true
  },
  {
    "id": "budget_uz",
    "name": "Budget information portal",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "macro"
    ],
    "indicators": [
      "budget",
      "public finance"
    ],
    "useCases": [
      "macro/regional context"
    ],
    "url": "https://budget.uz",
    "requiresManualVerification": true
  },
  {
    "id": "mf_uz",
    "name": "Ministry of Economy and Finance",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "macro",
      "tax"
    ],
    "indicators": [
      "economic policy",
      "budget",
      "finance"
    ],
    "useCases": [
      "macro and policy context"
    ],
    "url": "https://imv.uz",
    "requiresManualVerification": true
  },
  {
    "id": "treasury_uz",
    "name": "Treasury / public finance sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "government"
    ],
    "indicators": [
      "treasury",
      "public procurement payments"
    ],
    "useCases": [
      "B2G context"
    ],
    "url": "https://treasury.uz",
    "requiresManualVerification": true
  },
  {
    "id": "xarid_uz",
    "name": "Public procurement portal",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "b2b_contract_model",
      "professional_services",
      "construction",
      "manufacturing"
    ],
    "indicators": [
      "public procurement",
      "tenders"
    ],
    "useCases": [
      "B2G demand proxy"
    ],
    "url": "https://xarid.uz",
    "requiresManualVerification": true
  },
  {
    "id": "etender_uz",
    "name": "Electronic tender platform",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "construction",
      "manufacturing",
      "professional_services",
      "logistics"
    ],
    "indicators": [
      "tenders",
      "public buyers"
    ],
    "useCases": [
      "B2G sales channel proxy"
    ],
    "url": "https://etender.uz",
    "requiresManualVerification": true
  },
  {
    "id": "technical_regulation_uz",
    "name": "Agency for Technical Regulation of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export",
      "retail",
      "construction"
    ],
    "indicators": [
      "technical regulation",
      "standards",
      "certification"
    ],
    "useCases": [
      "product compliance check"
    ],
    "url": "https://technical-regulation.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "standards_uz",
    "name": "Uzbekistan standardization / conformity sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export",
      "retail"
    ],
    "indicators": [
      "standards",
      "certification",
      "conformity"
    ],
    "useCases": [
      "quality and certification check"
    ],
    "url": "https://standart.uz",
    "requiresManualVerification": true
  },
  {
    "id": "metrology_uz",
    "name": "Metrology and measurement sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "retail",
      "healthcare",
      "food_service"
    ],
    "indicators": [
      "metrology",
      "measurement instruments"
    ],
    "useCases": [
      "equipment/calibration compliance"
    ],
    "url": "https://metrology.uz",
    "requiresManualVerification": true
  },
  {
    "id": "consumer_protection_uz",
    "name": "Consumer protection authority / information sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "food_service",
      "services"
    ],
    "indicators": [
      "consumer rights",
      "returns",
      "service quality"
    ],
    "useCases": [
      "consumer compliance"
    ],
    "url": "https://raqobat.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "competition_uz",
    "name": "Competition Promotion and Consumer Protection Committee",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "all"
    ],
    "indicators": [
      "competition",
      "consumer protection",
      "advertising"
    ],
    "useCases": [
      "competition and consumer risk"
    ],
    "url": "https://raqobat.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "personal_data_uz",
    "name": "Personal data and digital regulation sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce",
      "education",
      "healthcare",
      "financial_services"
    ],
    "indicators": [
      "personal data",
      "digital compliance"
    ],
    "useCases": [
      "privacy/data risk"
    ],
    "url": "https://digital.uz",
    "requiresManualVerification": true
  },
  {
    "id": "payments_cbu",
    "name": "Central Bank payment systems regulation",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "ecommerce",
      "retail",
      "financial_services",
      "all"
    ],
    "indicators": [
      "payments",
      "payment systems",
      "cards"
    ],
    "useCases": [
      "payment compliance and fintech risk"
    ],
    "url": "https://cbu.uz",
    "requiresManualVerification": true
  },
  {
    "id": "collateral_registry_cbu",
    "name": "Collateral registry under the Central Bank",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services"
    ],
    "indicators": [
      "collateral",
      "pledge registry"
    ],
    "useCases": [
      "bankability/collateral check"
    ],
    "url": "https://garov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "credit_bureau_sources",
    "name": "Credit bureau / credit history sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services"
    ],
    "indicators": [
      "credit history",
      "borrower profile"
    ],
    "useCases": [
      "credit readiness check"
    ],
    "url": "https://cbu.uz",
    "requiresManualVerification": true
  },
  {
    "id": "notary_uz",
    "name": "Notarial services and legal transaction sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "real_estate",
      "documents"
    ],
    "indicators": [
      "notary",
      "contracts",
      "power of attorney"
    ],
    "useCases": [
      "legal document execution"
    ],
    "url": "https://notary.uz",
    "requiresManualVerification": true
  },
  {
    "id": "cadastre_uz",
    "name": "Cadastre Agency / real estate registry",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "real_estate",
      "construction",
      "retail",
      "services",
      "agriculture"
    ],
    "indicators": [
      "cadastre",
      "property",
      "land"
    ],
    "useCases": [
      "premises/land verification"
    ],
    "url": "https://kadastr.uz",
    "requiresManualVerification": true
  },
  {
    "id": "e_auksion_uz",
    "name": "E-auksion state assets and land auction portal",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "real_estate",
      "agriculture",
      "retail",
      "services"
    ],
    "indicators": [
      "auctions",
      "land",
      "premises",
      "state assets"
    ],
    "useCases": [
      "rent/asset price proxy"
    ],
    "url": "https://e-auksion.uz",
    "requiresManualVerification": true
  },
  {
    "id": "yerelektron_uz",
    "name": "Land/electronic land allocation sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "construction",
      "real_estate"
    ],
    "indicators": [
      "land allocation",
      "plots"
    ],
    "useCases": [
      "land access check"
    ],
    "url": "https://yerelektron.uz",
    "requiresManualVerification": true
  },
  {
    "id": "water_ministry_uz",
    "name": "Ministry of Water Resources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "manufacturing",
      "food_service"
    ],
    "indicators": [
      "water access",
      "irrigation",
      "water policy"
    ],
    "useCases": [
      "water risk/compliance"
    ],
    "url": "https://gov.uz/en/suvchi",
    "requiresManualVerification": true
  },
  {
    "id": "veterinary_uz",
    "name": "Veterinary and livestock development authority",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service",
      "retail"
    ],
    "indicators": [
      "veterinary requirements",
      "livestock"
    ],
    "useCases": [
      "veterinary compliance"
    ],
    "url": "https://vetgov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "plant_quarantine_uz",
    "name": "Plant quarantine and protection authority",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "import_export",
      "retail"
    ],
    "indicators": [
      "phytosanitary",
      "plant quarantine"
    ],
    "useCases": [
      "phytosanitary compliance"
    ],
    "url": "https://karantin.uz",
    "requiresManualVerification": true
  },
  {
    "id": "uzbekistan_agroinspection",
    "name": "Agroinspection sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "agriculture inspection",
      "quality"
    ],
    "useCases": [
      "agro compliance risk"
    ],
    "url": "https://agroinspeksiya.uz",
    "requiresManualVerification": true
  },
  {
    "id": "energy_ministry_uz",
    "name": "Ministry of Energy",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "energy",
      "manufacturing",
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "energy policy",
      "electricity",
      "gas"
    ],
    "useCases": [
      "energy supply risk"
    ],
    "url": "https://minenergy.uz",
    "requiresManualVerification": true
  },
  {
    "id": "electric_grid_uz",
    "name": "National electric grid / electricity supply sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "energy",
      "manufacturing",
      "food_service",
      "agriculture",
      "services"
    ],
    "indicators": [
      "electricity supply",
      "grid"
    ],
    "useCases": [
      "utility risk check"
    ],
    "url": "https://uzbekistonmet.uz",
    "requiresManualVerification": true
  },
  {
    "id": "gas_supply_uz",
    "name": "Gas supply sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "energy",
      "manufacturing",
      "food_service"
    ],
    "indicators": [
      "gas supply",
      "tariffs"
    ],
    "useCases": [
      "utility cost/risk"
    ],
    "url": "https://hududgaz.uz",
    "requiresManualVerification": true
  },
  {
    "id": "utility_tariffs_uz",
    "name": "Utility tariff and communal services sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "real_estate",
      "manufacturing",
      "food_service"
    ],
    "indicators": [
      "utility tariffs",
      "communal services"
    ],
    "useCases": [
      "OpEx assumptions"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "emergency_ministry_uz",
    "name": "Ministry of Emergency Situations",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "construction",
      "manufacturing",
      "food_service",
      "healthcare"
    ],
    "indicators": [
      "fire safety",
      "emergency rules"
    ],
    "useCases": [
      "fire/safety compliance"
    ],
    "url": "https://favqulodda.uz",
    "requiresManualVerification": true
  },
  {
    "id": "labor_safety_uz",
    "name": "Labor inspection / occupational safety sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "construction",
      "logistics",
      "services"
    ],
    "indicators": [
      "labor safety",
      "workplace safety"
    ],
    "useCases": [
      "occupational safety check"
    ],
    "url": "https://mehnat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "tourism_committee_uz",
    "name": "Tourism Committee / tourism sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service",
      "retail"
    ],
    "indicators": [
      "tourism services",
      "hospitality"
    ],
    "useCases": [
      "tourism demand/compliance"
    ],
    "url": "https://uzbektourism.uz",
    "requiresManualVerification": true
  },
  {
    "id": "culture_ministry_uz",
    "name": "Ministry of Culture",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "entertainment",
      "tourism_hospitality"
    ],
    "indicators": [
      "culture",
      "events"
    ],
    "useCases": [
      "events/culture permits"
    ],
    "url": "https://madaniyat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "sport_ministry_uz",
    "name": "Ministry of Sports",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "entertainment",
      "beauty_wellness",
      "education"
    ],
    "indicators": [
      "sports",
      "fitness"
    ],
    "useCases": [
      "fitness/sport business context"
    ],
    "url": "https://sport.uz",
    "requiresManualVerification": true
  },
  {
    "id": "higher_education_uz",
    "name": "Ministry of Higher Education, Science and Innovation",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education",
      "it_digital"
    ],
    "indicators": [
      "higher education",
      "science",
      "innovation"
    ],
    "useCases": [
      "education/innovation context"
    ],
    "url": "https://edu.uz",
    "requiresManualVerification": true
  },
  {
    "id": "innovation_agency_uz",
    "name": "Innovation development and startup sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "manufacturing",
      "all"
    ],
    "indicators": [
      "innovation",
      "startup support",
      "grants"
    ],
    "useCases": [
      "startup support context"
    ],
    "url": "https://innovation.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "pharmaceutical_agency_uz",
    "name": "Pharmaceutical industry development agency",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare",
      "retail",
      "manufacturing",
      "import_export"
    ],
    "indicators": [
      "pharmaceuticals",
      "medical products"
    ],
    "useCases": [
      "pharmacy/medical product compliance"
    ],
    "url": "https://uzpharmagency.uz",
    "requiresManualVerification": true
  },
  {
    "id": "medical_devices_uz",
    "name": "Medical devices and equipment regulatory sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare",
      "import_export"
    ],
    "indicators": [
      "medical equipment",
      "registration",
      "certification"
    ],
    "useCases": [
      "medical equipment compliance"
    ],
    "url": "https://ssv.uz",
    "requiresManualVerification": true
  },
  {
    "id": "food_safety_uz",
    "name": "Food safety / sanitary official sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "food_service",
      "manufacturing",
      "retail",
      "agriculture"
    ],
    "indicators": [
      "food safety",
      "sanitary permits"
    ],
    "useCases": [
      "food compliance check"
    ],
    "url": "https://sanepid.uz",
    "requiresManualVerification": true
  },
  {
    "id": "halal_certification_uz",
    "name": "Halal certification bodies / official references",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "food_service",
      "manufacturing",
      "export"
    ],
    "indicators": [
      "halal certification"
    ],
    "useCases": [
      "export/food differentiation check"
    ],
    "url": "https://standart.uz",
    "requiresManualVerification": true
  },
  {
    "id": "export_promotion_uz",
    "name": "Export Promotion Agency",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "export support",
      "market access"
    ],
    "useCases": [
      "export potential and support"
    ],
    "url": "https://epauzb.uz",
    "requiresManualVerification": true
  },
  {
    "id": "invest_gov_uz",
    "name": "Investment portal of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "real_estate",
      "tourism_hospitality"
    ],
    "indicators": [
      "investment projects",
      "regions",
      "incentives"
    ],
    "useCases": [
      "investment context"
    ],
    "url": "https://invest.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "special_economic_zones_uz",
    "name": "Special economic zones information sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "logistics",
      "import_export"
    ],
    "indicators": [
      "SEZ",
      "industrial zones",
      "tax incentives"
    ],
    "useCases": [
      "location/incentive check"
    ],
    "url": "https://invest.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "industrial_zones_uz",
    "name": "Industrial zones and free economic zones sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "logistics",
      "real_estate"
    ],
    "indicators": [
      "industrial zones",
      "infrastructure"
    ],
    "useCases": [
      "industrial premises check"
    ],
    "url": "https://invest.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "mahalla_uz",
    "name": "Mahalla and entrepreneurship support sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "services",
      "retail"
    ],
    "indicators": [
      "local support",
      "microbusiness"
    ],
    "useCases": [
      "local SME support"
    ],
    "url": "https://mahalla.uz",
    "requiresManualVerification": true
  },
  {
    "id": "yoshlar_uz",
    "name": "Youth affairs and youth entrepreneurship sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education",
      "it_digital",
      "retail",
      "services"
    ],
    "indicators": [
      "youth programs",
      "support"
    ],
    "useCases": [
      "youth market/support context"
    ],
    "url": "https://yoshlar.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "women_business_support_uz",
    "name": "Women entrepreneurship support sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "retail",
      "services",
      "education"
    ],
    "indicators": [
      "women entrepreneurship",
      "support programs"
    ],
    "useCases": [
      "support program check"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "family_business_support_uz",
    "name": "Family entrepreneurship support program sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "agriculture",
      "retail",
      "services"
    ],
    "indicators": [
      "family entrepreneurship",
      "support loans"
    ],
    "useCases": [
      "state support check"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "single_window_export_uz",
    "name": "Single window / trade facilitation sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "logistics"
    ],
    "indicators": [
      "single window",
      "trade documents"
    ],
    "useCases": [
      "trade documents check"
    ],
    "url": "https://customs.uz",
    "requiresManualVerification": true
  },
  {
    "id": "certificates_origin_uz",
    "name": "Certificate of origin / export documentation sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "certificate of origin",
      "export documents"
    ],
    "useCases": [
      "export compliance"
    ],
    "url": "https://chamber.uz",
    "requiresManualVerification": true
  },
  {
    "id": "public_health_rules_uz",
    "name": "Public health and epidemiology rules sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare",
      "food_service",
      "education",
      "beauty_wellness"
    ],
    "indicators": [
      "public health rules",
      "epidemiology"
    ],
    "useCases": [
      "sanitary compliance"
    ],
    "url": "https://sanepid.uz",
    "requiresManualVerification": true
  },
  {
    "id": "advertising_regulation_uz",
    "name": "Advertising regulation and consumer information sources",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "services",
      "healthcare"
    ],
    "indicators": [
      "advertising",
      "consumer information"
    ],
    "useCases": [
      "marketing compliance"
    ],
    "url": "https://raqobat.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_medical_uz",
    "name": "Licensing source: medical activities",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare",
      "documents",
      "permits"
    ],
    "indicators": [
      "medical license",
      "required documents"
    ],
    "useCases": [
      "healthcare license check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_education_uz",
    "name": "Licensing source: education activities",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education",
      "documents",
      "permits"
    ],
    "indicators": [
      "education license",
      "required documents"
    ],
    "useCases": [
      "education license check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_transport_uz",
    "name": "Licensing source: transport activities",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "transport",
      "logistics",
      "documents",
      "permits"
    ],
    "indicators": [
      "transport license",
      "required documents"
    ],
    "useCases": [
      "transport license check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_construction_uz",
    "name": "Licensing source: construction/design activities",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "construction",
      "documents",
      "permits"
    ],
    "indicators": [
      "construction permits",
      "design licenses"
    ],
    "useCases": [
      "construction licensing check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_tourism_uz",
    "name": "Licensing/source checks: tourism and hospitality",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "documents",
      "permits"
    ],
    "indicators": [
      "tourism services",
      "hospitality requirements"
    ],
    "useCases": [
      "tourism compliance check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "licenses_financial_services_uz",
    "name": "Licensing source: financial/payment services",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "financial_services",
      "it_digital",
      "documents",
      "permits"
    ],
    "indicators": [
      "financial licenses",
      "payment services"
    ],
    "useCases": [
      "fintech compliance check"
    ],
    "url": "https://license.gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_tashkent_city",
    "name": "Official regional portal: Tashkent city",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_tashkent_city",
    "name": "Национальный комитет по статистике: statistics by region: Tashkent city",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_tashkent_region",
    "name": "Official regional portal: Tashkent region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_tashkent_region",
    "name": "Национальный комитет по статистике: statistics by region: Tashkent region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_samarkand",
    "name": "Official regional portal: Samarkand region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_samarkand",
    "name": "Национальный комитет по статистике: statistics by region: Samarkand region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_bukhara",
    "name": "Official regional portal: Bukhara region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_bukhara",
    "name": "Национальный комитет по статистике: statistics by region: Bukhara region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_andijan",
    "name": "Official regional portal: Andijan region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_andijan",
    "name": "Национальный комитет по статистике: statistics by region: Andijan region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_fergana",
    "name": "Official regional portal: Fergana region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_fergana",
    "name": "Национальный комитет по статистике: statistics by region: Fergana region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_namangan",
    "name": "Official regional portal: Namangan region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_namangan",
    "name": "Национальный комитет по статистике: statistics by region: Namangan region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_kashkadarya",
    "name": "Official regional portal: Kashkadarya region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_kashkadarya",
    "name": "Национальный комитет по статистике: statistics by region: Kashkadarya region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_surkhandarya",
    "name": "Official regional portal: Surkhandarya region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_surkhandarya",
    "name": "Национальный комитет по статистике: statistics by region: Surkhandarya region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_khorezm",
    "name": "Official regional portal: Khorezm region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_khorezm",
    "name": "Национальный комитет по статистике: statistics by region: Khorezm region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_navoi",
    "name": "Official regional portal: Navoi region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_navoi",
    "name": "Национальный комитет по статистике: statistics by region: Navoi region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_jizzakh",
    "name": "Official regional portal: Jizzakh region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_jizzakh",
    "name": "Национальный комитет по статистике: statistics by region: Jizzakh region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_syrdarya",
    "name": "Official regional portal: Syrdarya region",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_syrdarya",
    "name": "Национальный комитет по статистике: statistics by region: Syrdarya region",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "regional_portal_karakalpakstan",
    "name": "Official regional portal: Republic of Karakalpakstan",
    "countryScope": "UZ",
    "sourceType": "government_registry",
    "reliability": "very_high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional",
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "regional programs",
      "local infrastructure",
      "investment projects"
    ],
    "useCases": [
      "regional context and local procedures"
    ],
    "url": "https://gov.uz",
    "requiresManualVerification": true
  },
  {
    "id": "stat_region_karakalpakstan",
    "name": "Национальный комитет по статистике: statistics by region: Republic of Karakalpakstan",
    "countryScope": "UZ",
    "sourceType": "official_statistics",
    "reliability": "very_high",
    "updateFrequency": "quarterly",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "regional"
    ],
    "indicators": [
      "regional statistics",
      "population",
      "business activity"
    ],
    "useCases": [
      "regional benchmark for project location"
    ],
    "url": "https://stat.uz",
    "requiresManualVerification": true
  },
  {
    "id": "world_bank_data_uz",
    "name": "World Bank Data: Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "macro"
    ],
    "indicators": [
      "GDP",
      "population",
      "inflation",
      "business climate"
    ],
    "useCases": [
      "macro context"
    ],
    "url": "https://data.worldbank.org/country/uzbekistan",
    "requiresManualVerification": true
  },
  {
    "id": "world_bank_reports_uz",
    "name": "World Bank Uzbekistan reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "labor_market"
    ],
    "indicators": [
      "country reports",
      "jobs",
      "private sector"
    ],
    "useCases": [
      "economic analysis"
    ],
    "url": "https://www.worldbank.org/en/country/uzbekistan",
    "requiresManualVerification": true
  },
  {
    "id": "world_bank_enterprise_surveys",
    "name": "World Bank Enterprise Surveys",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business"
    ],
    "indicators": [
      "firm constraints",
      "finance access",
      "informality"
    ],
    "useCases": [
      "SME risk benchmark"
    ],
    "url": "https://www.enterprisesurveys.org",
    "requiresManualVerification": true
  },
  {
    "id": "world_bank_doing_business_archive",
    "name": "World Bank Doing Business archive",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "documents"
    ],
    "indicators": [
      "business regulation archive"
    ],
    "useCases": [
      "historic regulatory context only"
    ],
    "url": "https://archive.doingbusiness.org",
    "requiresManualVerification": true
  },
  {
    "id": "imf_uz",
    "name": "IMF Uzbekistan country data and Article IV reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "macro",
      "financial_services"
    ],
    "indicators": [
      "macro forecast",
      "inflation",
      "external stability"
    ],
    "useCases": [
      "macro risk context"
    ],
    "url": "https://www.imf.org/en/Countries/UZB",
    "requiresManualVerification": true
  },
  {
    "id": "imf_weo",
    "name": "IMF World Economic Outlook database",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "macro"
    ],
    "indicators": [
      "GDP forecast",
      "inflation forecast"
    ],
    "useCases": [
      "macro assumptions"
    ],
    "url": "https://www.imf.org/en/Publications/WEO",
    "requiresManualVerification": true
  },
  {
    "id": "imf_ifs",
    "name": "IMF International Financial Statistics",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services"
    ],
    "indicators": [
      "monetary statistics",
      "exchange rates"
    ],
    "useCases": [
      "financial cross-check"
    ],
    "url": "https://data.imf.org",
    "requiresManualVerification": true
  },
  {
    "id": "adb_uz",
    "name": "Asian Development Bank Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "infrastructure",
      "agriculture",
      "transport"
    ],
    "indicators": [
      "macro",
      "infrastructure",
      "development"
    ],
    "useCases": [
      "development context"
    ],
    "url": "https://www.adb.org/countries/uzbekistan/main",
    "requiresManualVerification": true
  },
  {
    "id": "adb_data",
    "name": "ADB Data Library",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "macro"
    ],
    "indicators": [
      "macro indicators",
      "regional indicators"
    ],
    "useCases": [
      "cross-check macro data"
    ],
    "url": "https://data.adb.org",
    "requiresManualVerification": true
  },
  {
    "id": "ebrd_uz",
    "name": "EBRD Uzbekistan country diagnostics and reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "manufacturing"
    ],
    "indicators": [
      "private sector",
      "SME finance",
      "transition"
    ],
    "useCases": [
      "investment climate"
    ],
    "url": "https://www.ebrd.com/where-we-are/uzbekistan.html",
    "requiresManualVerification": true
  },
  {
    "id": "ebrd_transition_reports",
    "name": "EBRD Transition Reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services"
    ],
    "indicators": [
      "transition indicators",
      "private sector"
    ],
    "useCases": [
      "institutional context"
    ],
    "url": "https://www.ebrd.com/news/publications/transition-report/transition-report.html",
    "requiresManualVerification": true
  },
  {
    "id": "undp_uz",
    "name": "UNDP Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "green_business",
      "social"
    ],
    "indicators": [
      "development programs",
      "green economy",
      "SME support"
    ],
    "useCases": [
      "development/support context"
    ],
    "url": "https://www.undp.org/uzbekistan",
    "requiresManualVerification": true
  },
  {
    "id": "unesco_uz",
    "name": "UNESCO Uzbekistan / education and culture sources",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "education",
      "entertainment",
      "tourism_hospitality"
    ],
    "indicators": [
      "education",
      "culture"
    ],
    "useCases": [
      "education/culture benchmarks"
    ],
    "url": "https://www.unesco.org",
    "requiresManualVerification": true
  },
  {
    "id": "unicef_uz",
    "name": "UNICEF Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "education",
      "healthcare",
      "retail"
    ],
    "indicators": [
      "children",
      "education",
      "health"
    ],
    "useCases": [
      "child/youth market context"
    ],
    "url": "https://www.unicef.org/uzbekistan",
    "requiresManualVerification": true
  },
  {
    "id": "unicef_mics_uz",
    "name": "UNICEF MICS Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "education",
      "healthcare",
      "retail"
    ],
    "indicators": [
      "children",
      "household",
      "demographics"
    ],
    "useCases": [
      "education and child services proxy"
    ],
    "url": "https://mics.unicef.org",
    "requiresManualVerification": true
  },
  {
    "id": "who_gho",
    "name": "WHO Global Health Observatory",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "health indicators",
      "disease burden"
    ],
    "useCases": [
      "healthcare demand proxy"
    ],
    "url": "https://www.who.int/data/gho",
    "requiresManualVerification": true
  },
  {
    "id": "who_uz",
    "name": "WHO Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "health system",
      "public health"
    ],
    "useCases": [
      "healthcare context"
    ],
    "url": "https://www.who.int/countries/uzb",
    "requiresManualVerification": true
  },
  {
    "id": "ilo_stat",
    "name": "ILOSTAT",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "employment",
      "wages",
      "working time"
    ],
    "useCases": [
      "labor market cross-check"
    ],
    "url": "https://ilostat.ilo.org",
    "requiresManualVerification": true
  },
  {
    "id": "ilo_uz",
    "name": "ILO Uzbekistan country information",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "labor standards",
      "employment"
    ],
    "useCases": [
      "labor compliance context"
    ],
    "url": "https://www.ilo.org",
    "requiresManualVerification": true
  },
  {
    "id": "faostat",
    "name": "FAOSTAT",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service",
      "manufacturing"
    ],
    "indicators": [
      "crop production",
      "livestock",
      "prices"
    ],
    "useCases": [
      "agriculture and food supply context"
    ],
    "url": "https://www.fao.org/faostat",
    "requiresManualVerification": true
  },
  {
    "id": "fao_uz",
    "name": "FAO Uzbekistan",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "food_service"
    ],
    "indicators": [
      "agriculture programs",
      "food systems"
    ],
    "useCases": [
      "agro context"
    ],
    "url": "https://www.fao.org/uzbekistan",
    "requiresManualVerification": true
  },
  {
    "id": "un_comtrade",
    "name": "UN Comtrade",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "retail",
      "agriculture"
    ],
    "indicators": [
      "imports",
      "exports",
      "HS codes"
    ],
    "useCases": [
      "trade flow cross-check"
    ],
    "url": "https://comtradeplus.un.org",
    "requiresManualVerification": true
  },
  {
    "id": "itc_trade_map",
    "name": "International Trade Centre Trade Map",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "trade map",
      "export potential"
    ],
    "useCases": [
      "export/import market attractiveness"
    ],
    "url": "https://www.trademap.org",
    "requiresManualVerification": true
  },
  {
    "id": "itc_market_access_map",
    "name": "ITC Market Access Map",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "tariffs",
      "market access"
    ],
    "useCases": [
      "export barriers/tariffs"
    ],
    "url": "https://www.macmap.org",
    "requiresManualVerification": true
  },
  {
    "id": "unctadstat",
    "name": "UNCTADstat",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "all",
      "financial_services"
    ],
    "indicators": [
      "trade",
      "FDI",
      "services trade"
    ],
    "useCases": [
      "external market context"
    ],
    "url": "https://unctadstat.unctad.org",
    "requiresManualVerification": true
  },
  {
    "id": "wto_uz",
    "name": "World Trade Organization Uzbekistan accession/trade profile",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "trade policy",
      "tariffs"
    ],
    "useCases": [
      "trade policy context"
    ],
    "url": "https://www.wto.org",
    "requiresManualVerification": true
  },
  {
    "id": "wits_world_bank",
    "name": "World Integrated Trade Solution",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "retail"
    ],
    "indicators": [
      "trade flows",
      "tariffs"
    ],
    "useCases": [
      "trade cross-check"
    ],
    "url": "https://wits.worldbank.org",
    "requiresManualVerification": true
  },
  {
    "id": "unido_indstat",
    "name": "UNIDO Industrial Statistics",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "manufacturing"
    ],
    "indicators": [
      "industrial value added",
      "manufacturing"
    ],
    "useCases": [
      "manufacturing benchmark"
    ],
    "url": "https://stat.unido.org",
    "requiresManualVerification": true
  },
  {
    "id": "unido_cip",
    "name": "UNIDO Competitive Industrial Performance",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "import_export"
    ],
    "indicators": [
      "industrial competitiveness"
    ],
    "useCases": [
      "industrial competitiveness context"
    ],
    "url": "https://stat.unido.org",
    "requiresManualVerification": true
  },
  {
    "id": "oecd_central_asia",
    "name": "OECD Central Asia policy reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "all",
      "small_business",
      "import_export"
    ],
    "indicators": [
      "SME policy",
      "trade facilitation"
    ],
    "useCases": [
      "policy context"
    ],
    "url": "https://www.oecd.org/eurasia/",
    "requiresManualVerification": true
  },
  {
    "id": "iea_energy",
    "name": "International Energy Agency energy statistics",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "energy",
      "manufacturing",
      "agriculture",
      "logistics"
    ],
    "indicators": [
      "energy statistics",
      "fuel",
      "electricity"
    ],
    "useCases": [
      "energy risk"
    ],
    "url": "https://www.iea.org",
    "requiresManualVerification": true
  },
  {
    "id": "irena",
    "name": "International Renewable Energy Agency datasets",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "energy",
      "agriculture",
      "manufacturing"
    ],
    "indicators": [
      "renewable energy",
      "solar",
      "energy transition"
    ],
    "useCases": [
      "renewable energy context"
    ],
    "url": "https://www.irena.org",
    "requiresManualVerification": true
  },
  {
    "id": "world_bank_health_expenditure",
    "name": "World Bank health expenditure indicators",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "health expenditure",
      "affordability"
    ],
    "useCases": [
      "clinic and pharmacy affordability"
    ],
    "url": "https://data.worldbank.org",
    "requiresManualVerification": true
  },
  {
    "id": "un_tourism",
    "name": "UN Tourism statistics",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service",
      "retail"
    ],
    "indicators": [
      "tourist arrivals",
      "tourism receipts"
    ],
    "useCases": [
      "tourism demand proxy"
    ],
    "url": "https://www.unwto.org/tourism-statistics",
    "requiresManualVerification": true
  },
  {
    "id": "world_travel_tourism_council",
    "name": "WTTC economic impact reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service"
    ],
    "indicators": [
      "tourism GDP",
      "jobs"
    ],
    "useCases": [
      "tourism industry proxy"
    ],
    "url": "https://wttc.org",
    "requiresManualVerification": true
  },
  {
    "id": "gsma_mobile",
    "name": "GSMA Mobile Economy / connectivity reports",
    "countryScope": "GLOBAL",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce",
      "financial_services"
    ],
    "indicators": [
      "mobile penetration",
      "connectivity"
    ],
    "useCases": [
      "digital services proxy"
    ],
    "url": "https://www.gsma.com/mobileeconomy/",
    "requiresManualVerification": true
  },
  {
    "id": "speedtest_global",
    "name": "Speedtest Global Index",
    "countryScope": "GLOBAL",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "internet speed",
      "connectivity proxy"
    ],
    "useCases": [
      "digital infrastructure proxy"
    ],
    "url": "https://www.speedtest.net/global-index",
    "requiresManualVerification": true
  },
  {
    "id": "itu_datahub",
    "name": "International Telecommunication Union DataHub",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "internet access",
      "telecom"
    ],
    "useCases": [
      "digital infrastructure cross-check"
    ],
    "url": "https://datahub.itu.int",
    "requiresManualVerification": true
  },
  {
    "id": "gsma_intelligence",
    "name": "GSMA Intelligence public reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "financial_services"
    ],
    "indicators": [
      "mobile markets",
      "digital finance"
    ],
    "useCases": [
      "mobile/digital proxy"
    ],
    "url": "https://www.gsmaintelligence.com",
    "requiresManualVerification": true
  },
  {
    "id": "global_findex",
    "name": "World Bank Global Findex",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "financial_services",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "financial inclusion",
      "digital payments"
    ],
    "useCases": [
      "payments/adoption proxy"
    ],
    "url": "https://www.worldbank.org/en/publication/globalfindex",
    "requiresManualVerification": true
  },
  {
    "id": "bis_cpmi",
    "name": "BIS CPMI payments reports",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "financial_services",
      "ecommerce"
    ],
    "indicators": [
      "payments",
      "financial infrastructure"
    ],
    "useCases": [
      "payments benchmark"
    ],
    "url": "https://www.bis.org/cpmi/",
    "requiresManualVerification": true
  },
  {
    "id": "edstats_worldbank",
    "name": "World Bank EdStats",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "education"
    ],
    "indicators": [
      "education indicators",
      "enrollment"
    ],
    "useCases": [
      "education market context"
    ],
    "url": "https://datatopics.worldbank.org/education/",
    "requiresManualVerification": true
  },
  {
    "id": "un_habitat",
    "name": "UN-Habitat urban data",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "real_estate",
      "construction",
      "retail"
    ],
    "indicators": [
      "urbanization",
      "cities"
    ],
    "useCases": [
      "location/urban context"
    ],
    "url": "https://unhabitat.org",
    "requiresManualVerification": true
  },
  {
    "id": "worldpop",
    "name": "WorldPop population grids",
    "countryScope": "GLOBAL",
    "sourceType": "geospatial",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "retail",
      "services",
      "healthcare",
      "education",
      "food_service"
    ],
    "indicators": [
      "population density",
      "geospatial"
    ],
    "useCases": [
      "catchment area proxy"
    ],
    "url": "https://www.worldpop.org",
    "requiresManualVerification": true
  },
  {
    "id": "openstreetmap",
    "name": "OpenStreetMap",
    "countryScope": "GLOBAL",
    "sourceType": "geospatial",
    "reliability": "medium",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "retail",
      "services",
      "logistics",
      "real_estate"
    ],
    "indicators": [
      "roads",
      "POIs",
      "access"
    ],
    "useCases": [
      "location/geospatial proxy"
    ],
    "url": "https://www.openstreetmap.org",
    "requiresManualVerification": true
  },
  {
    "id": "nasa_power",
    "name": "NASA POWER climate and solar data",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "energy",
      "construction"
    ],
    "indicators": [
      "solar radiation",
      "temperature",
      "rainfall"
    ],
    "useCases": [
      "agro/solar/climate proxy"
    ],
    "url": "https://power.larc.nasa.gov",
    "requiresManualVerification": true
  },
  {
    "id": "copernicus_climate",
    "name": "Copernicus Climate Data Store",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "energy",
      "construction"
    ],
    "indicators": [
      "climate",
      "temperature",
      "precipitation"
    ],
    "useCases": [
      "climate risk proxy"
    ],
    "url": "https://cds.climate.copernicus.eu",
    "requiresManualVerification": true
  },
  {
    "id": "aquastat",
    "name": "FAO AQUASTAT",
    "countryScope": "GLOBAL",
    "sourceType": "international_organization",
    "reliability": "very_high",
    "updateFrequency": "annual",
    "language": [
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "manufacturing",
      "food_service"
    ],
    "indicators": [
      "water resources",
      "irrigation"
    ],
    "useCases": [
      "water risk context"
    ],
    "url": "https://www.fao.org/aquastat",
    "requiresManualVerification": true
  },
  {
    "id": "bank_nbu_uz",
    "name": "Bank/fintech source: National Bank of Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://nbu.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_asakabank",
    "name": "Bank/fintech source: Asakabank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://asakabank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_sqb_uz",
    "name": "Bank/fintech source: Uzpromstroybank / SQB",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://sqb.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_ipotekabank",
    "name": "Bank/fintech source: Ipoteka Bank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://ipoteka.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_agrobank",
    "name": "Bank/fintech source: Agrobank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://agrobank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_mikrokreditbank",
    "name": "Bank/fintech source: Mikrokreditbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://mkbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_xalkbank",
    "name": "Bank/fintech source: Xalq Banki",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://xb.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_hamkorbank",
    "name": "Bank/fintech source: Hamkorbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://hamkorbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_kapitalbank",
    "name": "Bank/fintech source: Kapitalbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://kapitalbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_trastbank",
    "name": "Bank/fintech source: Trastbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://trastbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_turonbank",
    "name": "Bank/fintech source: Turonbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://turonbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_aloqabank",
    "name": "Bank/fintech source: Aloqabank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://aloqabank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_orient_finans_bank",
    "name": "Bank/fintech source: Orient Finans Bank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://ofb.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_asia_alliance_bank",
    "name": "Bank/fintech source: Asia Alliance Bank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://aab.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_davr_bank",
    "name": "Bank/fintech source: Davr Bank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://davrbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_anorbank",
    "name": "Bank/fintech source: Anorbank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://anorbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_tbc_bank_uz",
    "name": "Bank/fintech source: TBC Bank Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://tbcbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_octobank",
    "name": "Bank/fintech source: Octobank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://octobank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_zoodpay_fintech",
    "name": "Bank/fintech source: ZoodPay / fintech source",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://zoodpay.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_click_uz",
    "name": "Bank/fintech source: Click payment service",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://click.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_payme_uz",
    "name": "Bank/fintech source: Payme payment service",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://payme.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_uzum_bank",
    "name": "Bank/fintech source: Uzum Bank",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://uzumbank.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_uzum_business",
    "name": "Bank/fintech source: Uzum Business / merchant services",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://uzum.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "bank_apelsin",
    "name": "Bank/fintech source: Apelsin payment ecosystem",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "financial_services",
      "financing",
      "ecommerce",
      "retail"
    ],
    "indicators": [
      "SME loans",
      "merchant services",
      "payments",
      "bank tariffs"
    ],
    "useCases": [
      "loan/leasing/payment terms check"
    ],
    "url": "https://apelsin.uz",
    "limitations": [
      "Use for current product terms only; verify latest terms manually on the provider website."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_uzbek_leasing",
    "name": "Leasing source: Uzbek Leasing International",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://uzbekleasing.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_qurilish_leasing",
    "name": "Leasing source: Qurilish Leasing",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://qurilishleasing.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_asaka_trans_leasing",
    "name": "Leasing source: Asaka Trans Leasing",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://atl.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_uzavtosanoat_leasing",
    "name": "Leasing source: Uzavtosanoat leasing-related sources",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://uzavtosanoat.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_agro_leasing",
    "name": "Leasing source: Agricultural leasing sources",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://agroleasing.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "leasing_micro_leasing",
    "name": "Leasing source: Microleasing / SME leasing sources",
    "countryScope": "UZ",
    "sourceType": "financial_market",
    "reliability": "high",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "manufacturing",
      "logistics",
      "transport",
      "healthcare",
      "agriculture",
      "services",
      "auto_service",
      "financing"
    ],
    "indicators": [
      "equipment leasing",
      "advance payment",
      "lease term"
    ],
    "useCases": [
      "leasing readiness and equipment finance assumptions"
    ],
    "url": "https://gov.uz",
    "limitations": [
      "Use for current indicative terms; confirm with official offer."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "2gis_uz",
    "name": "2GIS Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "geospatial",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "services",
      "beauty_wellness",
      "healthcare",
      "education",
      "auto_service"
    ],
    "indicators": [
      "competitors",
      "POI density",
      "location"
    ],
    "useCases": [
      "competition and location proxy"
    ],
    "url": "https://2gis.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "google_maps",
    "name": "Google Maps",
    "countryScope": "UZ",
    "sourceType": "geospatial",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "services",
      "beauty_wellness",
      "healthcare",
      "education",
      "tourism_hospitality"
    ],
    "indicators": [
      "competitors",
      "reviews",
      "location"
    ],
    "useCases": [
      "local competition proxy"
    ],
    "url": "https://maps.google.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "yandex_maps",
    "name": "Yandex Maps",
    "countryScope": "UZ",
    "sourceType": "geospatial",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "food_service",
      "services",
      "auto_service",
      "logistics"
    ],
    "indicators": [
      "competitors",
      "routes",
      "location"
    ],
    "useCases": [
      "location and route proxy"
    ],
    "url": "https://yandex.uz/maps",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "olx_uz",
    "name": "OLX Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "real_estate",
      "services",
      "manufacturing"
    ],
    "indicators": [
      "equipment prices",
      "rent prices",
      "used equipment"
    ],
    "useCases": [
      "CapEx/rent proxy"
    ],
    "url": "https://www.olx.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "uybor_uz",
    "name": "Uybor real estate listings",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "real_estate",
      "retail",
      "food_service",
      "services"
    ],
    "indicators": [
      "rent",
      "sale prices",
      "commercial property"
    ],
    "useCases": [
      "premises cost proxy"
    ],
    "url": "https://uybor.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "domtut_uz",
    "name": "Domtut real estate listings",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "real_estate",
      "retail",
      "services"
    ],
    "indicators": [
      "commercial rent",
      "property"
    ],
    "useCases": [
      "premises proxy"
    ],
    "url": "https://domtut.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "uzum_market",
    "name": "Uzum Market",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce"
    ],
    "indicators": [
      "product prices",
      "seller competition"
    ],
    "useCases": [
      "retail price proxy"
    ],
    "url": "https://uzum.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "wildberries_uz",
    "name": "Wildberries Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce"
    ],
    "indicators": [
      "product prices",
      "marketplace competition"
    ],
    "useCases": [
      "ecommerce price proxy"
    ],
    "url": "https://www.wildberries.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "yandex_market_uz",
    "name": "Yandex Market Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce"
    ],
    "indicators": [
      "product prices",
      "marketplace"
    ],
    "useCases": [
      "price proxy"
    ],
    "url": "https://market.yandex.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "alibaba",
    "name": "Alibaba supplier marketplace",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing",
      "retail"
    ],
    "indicators": [
      "equipment prices",
      "supplier quotes"
    ],
    "useCases": [
      "supplier price proxy"
    ],
    "url": "https://www.alibaba.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "made_in_china",
    "name": "Made-in-China supplier marketplace",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "manufacturing"
    ],
    "indicators": [
      "supplier prices",
      "equipment"
    ],
    "useCases": [
      "import price proxy"
    ],
    "url": "https://www.made-in-china.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "global_sources",
    "name": "Global Sources supplier marketplace",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "import_export",
      "retail"
    ],
    "indicators": [
      "supplier prices",
      "MOQ"
    ],
    "useCases": [
      "import supplier proxy"
    ],
    "url": "https://www.globalsources.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "truck_market_proxy",
    "name": "Truck/vehicle listing proxies",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport",
      "auto_service"
    ],
    "indicators": [
      "vehicle prices",
      "used trucks"
    ],
    "useCases": [
      "transport CapEx proxy"
    ],
    "url": "https://www.olx.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "auto_listing_proxy",
    "name": "Auto listing proxies for Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "auto_service",
      "transport",
      "logistics"
    ],
    "indicators": [
      "vehicle fleet proxy",
      "car prices"
    ],
    "useCases": [
      "auto market proxy"
    ],
    "url": "https://www.olx.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "auto_parts_market_proxy",
    "name": "Auto parts marketplace proxies",
    "countryScope": "UZ",
    "sourceType": "commerce_platform",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "auto_service",
      "retail",
      "import_export"
    ],
    "indicators": [
      "spare parts prices",
      "availability"
    ],
    "useCases": [
      "auto service consumables proxy"
    ],
    "url": "https://www.olx.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "hh_uz",
    "name": "HeadHunter Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "vacancies",
      "salary ranges"
    ],
    "useCases": [
      "labor cost proxy"
    ],
    "url": "https://hh.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "ish_uz",
    "name": "Ish.uz job listings",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all",
      "labor_market"
    ],
    "indicators": [
      "vacancies",
      "salary ranges"
    ],
    "useCases": [
      "staff cost proxy"
    ],
    "url": "https://ish.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "telegram_business_proxy",
    "name": "Telegram channel/user research proxy",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "services",
      "ecommerce",
      "food_service"
    ],
    "indicators": [
      "audience",
      "competitors",
      "offers"
    ],
    "useCases": [
      "informal demand proxy"
    ],
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "instagram_business_proxy",
    "name": "Instagram business pages proxy",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "services",
      "beauty_wellness",
      "food_service"
    ],
    "indicators": [
      "followers",
      "engagement",
      "offers"
    ],
    "useCases": [
      "social demand proxy"
    ],
    "url": "https://www.instagram.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "facebook_ads_library",
    "name": "Meta/Facebook Ads Library",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "services",
      "education"
    ],
    "indicators": [
      "ads",
      "competitor creatives"
    ],
    "useCases": [
      "marketing competition proxy"
    ],
    "url": "https://www.facebook.com/ads/library",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "similarweb_proxy",
    "name": "Similarweb traffic proxy",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "ecommerce",
      "it_digital"
    ],
    "indicators": [
      "website traffic",
      "digital competition"
    ],
    "useCases": [
      "digital market proxy"
    ],
    "url": "https://www.similarweb.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "semrush_proxy",
    "name": "SEMrush keyword/traffic proxy",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "ecommerce",
      "it_digital",
      "education"
    ],
    "indicators": [
      "keywords",
      "search demand"
    ],
    "useCases": [
      "SEO demand proxy"
    ],
    "url": "https://www.semrush.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "google_trends",
    "name": "Google Trends",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "retail",
      "ecommerce",
      "services",
      "tourism_hospitality",
      "education"
    ],
    "indicators": [
      "search interest",
      "seasonality"
    ],
    "useCases": [
      "demand seasonality proxy"
    ],
    "url": "https://trends.google.com",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "weather_climate_proxy",
    "name": "Weather and climate proxy sources",
    "countryScope": "UZ",
    "sourceType": "market_proxy",
    "reliability": "medium",
    "updateFrequency": "daily",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "agriculture",
      "tourism_hospitality",
      "construction"
    ],
    "indicators": [
      "weather",
      "seasonality"
    ],
    "useCases": [
      "seasonality/weather risk proxy"
    ],
    "url": "https://www.meteo.uz",
    "limitations": [
      "Proxy source: use only as market signal, not official statistics."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "user_supplier_quotes",
    "name": "Supplier quotations uploaded by user",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all"
    ],
    "indicators": [
      "CapEx",
      "equipment cost",
      "raw material cost"
    ],
    "useCases": [
      "user-uploaded quotes"
    ],
    "limitations": [
      "Project-specific evidence; verify authenticity and date."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "customer_interviews",
    "name": "Customer interviews / LOI / preliminary agreements",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "all"
    ],
    "indicators": [
      "demand validation",
      "B2B contracts",
      "bankability"
    ],
    "useCases": [
      "project evidence, not statistics"
    ],
    "limitations": [
      "Project-specific evidence; verify authenticity and date."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uztextile",
    "name": "Uztextileprom association / textile industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "retail",
      "import_export"
    ],
    "indicators": [
      "textile industry",
      "apparel exports"
    ],
    "useCases": [
      "textile/apparel sector context"
    ],
    "url": "https://uzts.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzcharmsanoat",
    "name": "Uzcharmsanoat leather and footwear industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "retail",
      "import_export"
    ],
    "indicators": [
      "leather",
      "footwear"
    ],
    "useCases": [
      "footwear/leather sector context"
    ],
    "url": "https://uzcharm.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzavtosanoat",
    "name": "Uzavtosanoat automotive industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "auto_service",
      "manufacturing",
      "transport"
    ],
    "indicators": [
      "automotive market",
      "vehicle production"
    ],
    "useCases": [
      "auto ecosystem context"
    ],
    "url": "https://uzavtosanoat.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzbekneftegaz",
    "name": "Uzbekneftegaz / energy and fuel sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "energy",
      "logistics",
      "manufacturing"
    ],
    "indicators": [
      "fuel",
      "energy"
    ],
    "useCases": [
      "fuel/energy context"
    ],
    "url": "https://ung.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzkimyosanoat",
    "name": "Uzkimyosanoat chemical industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "agriculture"
    ],
    "indicators": [
      "chemicals",
      "fertilizers"
    ],
    "useCases": [
      "chemical/fertilizer market context"
    ],
    "url": "https://uzkimyosanoat.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzmetkombinat",
    "name": "Uzmetkombinat metallurgical industry source",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "manufacturing",
      "construction"
    ],
    "indicators": [
      "metal products",
      "steel"
    ],
    "useCases": [
      "metal input context"
    ],
    "url": "https://uzbeksteel.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzbekistan_airways",
    "name": "Uzbekistan Airways official source",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "logistics",
      "transport"
    ],
    "indicators": [
      "air transport",
      "tourism flows"
    ],
    "useCases": [
      "tourism/logistics context"
    ],
    "url": "https://www.uzairways.com",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzbekistan_railways",
    "name": "Uzbekistan Railways official source",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "logistics",
      "transport",
      "tourism_hospitality"
    ],
    "indicators": [
      "rail freight",
      "passenger transport"
    ],
    "useCases": [
      "logistics/transport context"
    ],
    "url": "https://railway.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzpost",
    "name": "Uzbekistan Post official source",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "ecommerce",
      "logistics"
    ],
    "indicators": [
      "postal delivery",
      "ecommerce logistics"
    ],
    "useCases": [
      "delivery channel context"
    ],
    "url": "https://uz.post",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_uzbektelecom",
    "name": "Uzbektelecom official source",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "internet",
      "telecom"
    ],
    "useCases": [
      "digital infrastructure context"
    ],
    "url": "https://uztelecom.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_beeline_uz",
    "name": "Beeline Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce",
      "financial_services"
    ],
    "indicators": [
      "mobile services",
      "digital payments"
    ],
    "useCases": [
      "digital market proxy"
    ],
    "url": "https://beeline.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_ucell_uz",
    "name": "Ucell Uzbekistan",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "mobile services"
    ],
    "useCases": [
      "telecom market proxy"
    ],
    "url": "https://ucell.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_mobiuz",
    "name": "Mobiuz",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital",
      "ecommerce"
    ],
    "indicators": [
      "mobile services"
    ],
    "useCases": [
      "telecom market proxy"
    ],
    "url": "https://mobi.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_perfectum",
    "name": "Perfectum",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "it_digital"
    ],
    "indicators": [
      "mobile services"
    ],
    "useCases": [
      "telecom proxy"
    ],
    "url": "https://perfectum.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_hotels_association_proxy",
    "name": "Hotel/tourism business association sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "tourism_hospitality",
      "food_service"
    ],
    "indicators": [
      "hotels",
      "tourism businesses"
    ],
    "useCases": [
      "hospitality sector proxy"
    ],
    "url": "https://uzbektourism.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_restaurant_association_proxy",
    "name": "Restaurant/catering industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "food_service"
    ],
    "indicators": [
      "restaurants",
      "catering"
    ],
    "useCases": [
      "food service sector proxy"
    ],
    "url": "https://chamber.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_medical_association_proxy",
    "name": "Medical association/professional sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "healthcare"
    ],
    "indicators": [
      "clinics",
      "medical professionals"
    ],
    "useCases": [
      "healthcare sector proxy"
    ],
    "url": "https://ssv.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  },
  {
    "id": "industry_education_private_centers_proxy",
    "name": "Private education center industry sources",
    "countryScope": "UZ",
    "sourceType": "industry_report",
    "reliability": "high",
    "updateFrequency": "irregular",
    "language": [
      "ru",
      "uz",
      "en"
    ],
    "applicableCategories": [
      "education"
    ],
    "indicators": [
      "training centers",
      "courses"
    ],
    "useCases": [
      "education sector proxy"
    ],
    "url": "https://chamber.uz",
    "limitations": [
      "Industry source: cross-check against official statistics where possible."
    ],
    "requiresManualVerification": true
  }
];



type ExternalSourceSeed = {
  id: string;
  name: string;
  url: string;
  type: DataSource["sourceType"];
  categories: string[];
};

function addSourcesIfMissing(seeds: ExternalSourceSeed[]) {
  const existing = new Set(sourceRegistry.map((source) => source.id));
  for (const seed of seeds) {
    if (existing.has(seed.id)) continue;
    existing.add(seed.id);
    sourceRegistry.push({
      id: seed.id,
      name: seed.name,
      countryScope: seed.url.includes("worldbank.org") || seed.url.includes("imf.org") || seed.url.includes("adb.org") || seed.url.includes("ebrd.com") || seed.url.includes("undp.org") || seed.url.includes("ilo.org") || seed.url.includes("comtrade") || seed.url.includes("trademap") || seed.url.includes("fao.org") || seed.url.includes("who.int") ? "GLOBAL" : "UZ",
      sourceType: seed.type,
      reliability: seed.type === "market_proxy" || seed.type === "commerce_platform" || seed.type === "industry_report" ? "high" : "very_high",
      updateFrequency: seed.type === "official_statistics" || seed.type === "central_bank" ? "monthly" : "irregular",
      language: ["ru", "uz", "en"],
      applicableCategories: Array.from(new Set(seed.categories)),
      indicators: Array.from(new Set(["market_data", "documents", "prices", "requirements", ...seed.categories])),
      useCases: ["market block source selection", "documents and compliance checklist", "fallback validation source"],
      url: seed.url,
      limitations: ["Use exact current page or publication date in the final report; manual verification is required before bank submission."],
      requiresManualVerification: seed.type === "market_proxy" || seed.type === "commerce_platform"
    });
  }
}

addSourcesIfMissing([
  { id: 'minjust_uz', name: 'Министерство юстиции Республики Узбекистан', url: 'https://minjust.uz', type: 'government_registry', categories: ['all', 'documents', 'compliance', 'legal'] },
  { id: 'nalog_uz', name: 'Налоговый комитет Республики Узбекистан — soliq.uz', url: 'https://soliq.uz', type: 'tax', categories: ['all', 'tax', 'compliance'] },
  { id: 'license_gov_uz', name: 'Единый портал лицензирования — license.gov.uz', url: 'https://license.gov.uz', type: 'government_registry', categories: ['all', 'documents', 'licensing', 'compliance'] },
  { id: 'my_gov_uz', name: 'Единый портал госуслуг — my.gov.uz', url: 'https://my.gov.uz', type: 'government_registry', categories: ['all', 'documents', 'compliance'] },
  { id: 'lex_uz', name: 'Национальная база законодательства — lex.uz', url: 'https://lex.uz', type: 'legal_database', categories: ['all', 'legal', 'compliance', 'tax'] },
  { id: 'norma_uz', name: 'Norma.uz — правовая и налоговая система', url: 'https://norma.uz', type: 'legal_database', categories: ['all', 'legal', 'tax', 'compliance'] },
  { id: 'gov_uz_main', name: 'Официальный портал органов государственной власти', url: 'https://gov.uz', type: 'government_registry', categories: ['all'] },
  { id: 'parliament_uz', name: 'Законодательная палата Олий Мажлиса', url: 'https://parliament.gov.uz', type: 'legal_database', categories: ['all', 'legal'] },
  { id: 'president_uz', name: 'Официальный сайт Президента Республики Узбекистан', url: 'https://president.uz', type: 'government_registry', categories: ['all', 'legal', 'macro'] },
  { id: 'stat_uz_yearbook', name: 'Статистический ежегодник Узбекистана — stat.uz', url: 'https://stat.uz/ru/publikatsii/knigi-i-broshyury', type: 'official_statistics', categories: ['all'] },
  { id: 'open_data_uz', name: 'Открытые данные Узбекистана — data.egov.uz', url: 'https://data.egov.uz', type: 'official_statistics', categories: ['all', 'open_data'] },
  { id: 'cbu_uz_stats', name: 'Статистика ЦБ Узбекистана', url: 'https://cbu.uz/ru/statistics/', type: 'central_bank', categories: ['all', 'financial_services', 'macro', 'currency'] },
  { id: 'cbu_uz_exchange', name: 'Официальный курс валют ЦБ РУз', url: 'https://cbu.uz/ru/currency/', type: 'central_bank', categories: ['all', 'currency', 'import_export'] },
  { id: 'gazeta_uz', name: 'Газета.uz — деловые новости Узбекистана', url: 'https://www.gazeta.uz', type: 'market_proxy', categories: ['all', 'news', 'prices', 'market_proxy'] },
  { id: 'kun_uz', name: 'Kun.uz — деловые новости', url: 'https://kun.uz', type: 'market_proxy', categories: ['all', 'news', 'market_proxy'] },
  { id: 'daryo_uz', name: 'Daryo.uz — новости и бизнес', url: 'https://daryo.uz', type: 'market_proxy', categories: ['all', 'news', 'market_proxy'] },
  { id: 'review_uz', name: 'Review.uz — экономический портал', url: 'https://review.uz', type: 'market_proxy', categories: ['all', 'macro', 'market_proxy'] },
  { id: 'economist_uz', name: 'Economist.uz — экономика Узбекистана', url: 'https://economist.uz', type: 'market_proxy', categories: ['all', 'macro', 'market_proxy'] },
  { id: 'spot_uz', name: 'Spot.uz — бизнес и стартапы Узбекистана', url: 'https://www.spot.uz', type: 'market_proxy', categories: ['all', 'small_business', 'it_digital', 'market_proxy'] },
  { id: 'repost_uz', name: 'Repost.uz — деловые новости', url: 'https://repost.uz', type: 'market_proxy', categories: ['all', 'news', 'market_proxy'] },
  { id: 'dunyo_uz', name: 'Dunyo.uz — внешнеэкономические новости', url: 'https://dunyo.uz', type: 'market_proxy', categories: ['import_export', 'manufacturing', 'all'] },
  { id: 'chamber_uz', name: 'Торгово-промышленная палата Республики Узбекистан', url: 'https://chamber.uz', type: 'industry_report', categories: ['all', 'small_business', 'services', 'manufacturing', 'import_export'] },
  { id: 'sme_uz', name: 'Агентство по развитию малого бизнеса — smb.gov.uz', url: 'https://smb.gov.uz', type: 'government_registry', categories: ['all', 'small_business', 'financing'] },
  { id: 'uzex_uz', name: 'Узбекская республиканская валютная биржа', url: 'https://uzex.uz', type: 'financial_market', categories: ['all', 'currency', 'financial_services', 'import_export'] },
  { id: 'buxoro_invest', name: 'Бизнес-инкубатор / инвестиционный портал', url: 'https://invest.gov.uz', type: 'government_registry', categories: ['all', 'investment', 'manufacturing', 'tourism_hospitality'] },
  { id: 'epa_uzb', name: 'Агентство по продвижению экспорта', url: 'https://epauzb.uz', type: 'government_registry', categories: ['import_export', 'manufacturing', 'agriculture'] },
  { id: 'smb_loans_programs', name: 'Программы кредитования МСБ — smb.gov.uz/programs', url: 'https://smb.gov.uz', type: 'government_registry', categories: ['all', 'financing', 'small_business'] },
  { id: 'ssv_uz', name: 'Агентство санитарно-эпидемиологического благополучия', url: 'https://ssv.uz', type: 'government_registry', categories: ['food_service', 'healthcare', 'beauty_wellness', 'manufacturing', 'documents'] },
  { id: 'mchs_uz', name: 'Министерство чрезвычайных ситуаций (пожарная безопасность)', url: 'https://mchs.uz', type: 'government_registry', categories: ['all', 'documents', 'manufacturing', 'food_service', 'compliance'] },
  { id: 'mehnat_uz', name: 'Министерство занятости и трудовых отношений', url: 'https://mehnat.uz', type: 'government_registry', categories: ['all', 'labor_market', 'compliance', 'documents'] },
  { id: 'raqobat_uz', name: 'Антимонопольный комитет — raqobat.gov.uz', url: 'https://raqobat.gov.uz', type: 'government_registry', categories: ['retail', 'ecommerce', 'services', 'healthcare', 'advertising_regulation'] },
  { id: 'standart_uz', name: 'Агентство по техническому регулированию — standart.uz', url: 'https://standart.uz', type: 'government_registry', categories: ['manufacturing', 'food_service', 'import_export', 'retail', 'documents'] },
  { id: 'uzpharmagency_uz', name: 'Агентство по развитию фармацевтической отрасли', url: 'https://uzpharmagency.uz', type: 'government_registry', categories: ['healthcare', 'manufacturing', 'import_export', 'documents'] },
  { id: 'minenergy_uz', name: 'Министерство энергетики', url: 'https://minenergy.uz', type: 'government_registry', categories: ['energy', 'manufacturing', 'agriculture'] },
  { id: 'mininvest_uz', name: 'Министерство инвестиций и внешней торговли', url: 'https://mift.uz', type: 'government_registry', categories: ['all', 'investment', 'import_export', 'manufacturing'] },
  { id: 'mineconomy_uz', name: 'Министерство экономики и финансов', url: 'https://mf.uz', type: 'government_registry', categories: ['all', 'macro', 'financing', 'tax'] },
  { id: 'customs_uz', name: 'Государственный таможенный комитет', url: 'https://customs.uz', type: 'customs', categories: ['import_export', 'manufacturing', 'retail', 'agriculture', 'documents'] },
  { id: 'antimonopoly_uz', name: 'Комитет по защите прав потребителей', url: 'https://raqobat.gov.uz', type: 'government_registry', categories: ['retail', 'food_service', 'healthcare', 'services'] },
  { id: 'uybor_uz', name: 'Uybor.uz — аренда и продажа недвижимости', url: 'https://uybor.uz', type: 'market_proxy', categories: ['real_estate', 'retail', 'food_service', 'services', 'prices'] },
  { id: 'domtut_uz', name: 'Domtut.uz — недвижимость', url: 'https://domtut.uz', type: 'market_proxy', categories: ['real_estate', 'retail', 'services', 'prices'] },
  { id: 'realt_uz', name: 'Realt.uz — коммерческая недвижимость', url: 'https://realt.uz', type: 'market_proxy', categories: ['real_estate', 'retail', 'services', 'prices'] },
  { id: 'cadastre_uz', name: 'Государственное предприятие Кадастр', url: 'https://kadastr.uz', type: 'government_registry', categories: ['real_estate', 'construction', 'agriculture', 'documents'] },
  { id: 'e_auksion_uz', name: 'Электронный аукцион государственных активов', url: 'https://e-auksion.uz', type: 'government_registry', categories: ['real_estate', 'agriculture', 'retail'] },
  { id: 'hh_uz', name: 'HeadHunter Uzbekistan — hh.uz', url: 'https://hh.uz', type: 'market_proxy', categories: ['all', 'labor_market', 'prices'] },
  { id: 'ish_uz', name: 'Ish.uz — рынок труда', url: 'https://ish.uz', type: 'market_proxy', categories: ['all', 'labor_market'] },
  { id: 'jobsuz', name: 'Jobs.uz — вакансии в Узбекистане', url: 'https://jobs.uz', type: 'market_proxy', categories: ['all', 'labor_market'] },
  { id: 'salaryuz_proxy', name: 'Средние зарплаты по отраслям (hh.uz/ish.uz proxy)', url: 'https://hh.uz', type: 'market_proxy', categories: ['all', 'labor_market', 'prices'] },
  { id: 'olx_uz', name: 'OLX Узбекистан — б/у оборудование и аренда', url: 'https://www.olx.uz', type: 'market_proxy', categories: ['all', 'real_estate', 'services', 'manufacturing', 'prices'] },
  { id: 'uzum_market', name: 'Uzum Market — маркетплейс', url: 'https://uzum.uz', type: 'commerce_platform', categories: ['retail', 'ecommerce', 'prices'] },
  { id: 'wildberries_uz', name: 'Wildberries Uzbekistan', url: 'https://www.wildberries.uz', type: 'commerce_platform', categories: ['retail', 'ecommerce', 'prices'] },
  { id: 'yandex_market_uz', name: 'Яндекс Маркет Узбекистан', url: 'https://market.yandex.uz', type: 'commerce_platform', categories: ['retail', 'ecommerce', 'prices'] },
  { id: 'alibaba_com', name: 'Alibaba — импортные поставщики', url: 'https://www.alibaba.com', type: 'commerce_platform', categories: ['import_export', 'manufacturing', 'retail', 'prices'] },
  { id: 'made_in_china_com', name: 'Made-in-China.com', url: 'https://www.made-in-china.com', type: 'commerce_platform', categories: ['import_export', 'manufacturing', 'prices'] },
  { id: 'xarid_uz', name: 'Xarid.uz — государственные закупки', url: 'https://xarid.uz', type: 'market_proxy', categories: ['all', 'b2b', 'manufacturing', 'construction', 'professional_services'] },
  { id: 'google_trends_uz', name: 'Google Trends (Узбекистан)', url: 'https://trends.google.com/trends/?geo=UZ', type: 'market_proxy', categories: ['retail', 'ecommerce', 'services', 'education', 'food_service'] },
  { id: 'yandex_wordstat_uz', name: 'Яндекс.Вордстат (Узбекистан)', url: 'https://wordstat.yandex.ru', type: 'market_proxy', categories: ['retail', 'ecommerce', 'services', 'education', 'food_service'] },
  { id: 'bank_nbu_uz', name: 'Национальный банк Узбекистана — nbu.uz', url: 'https://nbu.uz', type: 'financial_market', categories: ['all', 'financial_services', 'financing'] },
  { id: 'bank_asakabank', name: 'Асакабанк', url: 'https://asakabank.uz', type: 'financial_market', categories: ['all', 'financial_services', 'financing'] },
  { id: 'bank_ipotekabank', name: 'Ипотека-банк', url: 'https://ipoteka.uz', type: 'financial_market', categories: ['all', 'financial_services', 'real_estate', 'financing'] },
  { id: 'bank_hamkorbank', name: 'Хамкорбанк', url: 'https://hamkorbank.uz', type: 'financial_market', categories: ['all', 'financial_services', 'small_business', 'financing'] },
  { id: 'bank_kapitalbank', name: 'Капиталбанк', url: 'https://kapitalbank.uz', type: 'financial_market', categories: ['all', 'financial_services', 'financing'] },
  { id: 'bank_tbc_bank_uz', name: 'TBC Bank Узбекистан', url: 'https://tbcbank.uz', type: 'financial_market', categories: ['all', 'financial_services', 'small_business', 'financing'] },
  { id: 'bank_click_uz', name: 'Click — платёжная система', url: 'https://click.uz', type: 'financial_market', categories: ['all', 'financial_services', 'ecommerce', 'retail'] },
  { id: 'bank_payme_uz', name: 'Payme — платёжная система', url: 'https://payme.uz', type: 'financial_market', categories: ['all', 'financial_services', 'ecommerce', 'retail'] },
  { id: 'bank_uzum_bank', name: 'Uzum Bank', url: 'https://uzumbank.uz', type: 'financial_market', categories: ['all', 'financial_services', 'small_business', 'financing'] },
  { id: 'leasing_uzbek_leasing', name: 'Uzbek Leasing International', url: 'https://uzbekleasing.uz', type: 'financial_market', categories: ['all', 'manufacturing', 'logistics', 'healthcare', 'financing'] },
  { id: 'world_bank_data_uz', name: 'World Bank Data: Uzbekistan', url: 'https://data.worldbank.org/country/uzbekistan', type: 'international_organization', categories: ['all', 'macro'] },
  { id: 'imf_uz', name: 'МВФ — данные по Узбекистану', url: 'https://www.imf.org/en/Countries/UZB', type: 'international_organization', categories: ['all', 'macro', 'financial_services'] },
  { id: 'adb_uz', name: 'Азиатский банк развития — Узбекистан', url: 'https://www.adb.org/countries/uzbekistan/main', type: 'international_organization', categories: ['all', 'infrastructure', 'agriculture', 'macro'] },
  { id: 'ebrd_uz', name: 'ЕБРР — Узбекистан', url: 'https://www.ebrd.com/where-we-are/uzbekistan.html', type: 'international_organization', categories: ['all', 'financial_services', 'manufacturing'] },
  { id: 'undp_uz', name: 'ПРООН Узбекистан', url: 'https://www.undp.org/uzbekistan', type: 'international_organization', categories: ['all', 'social', 'small_business'] },
  { id: 'ilo_stat', name: 'ILOSTAT — статистика труда', url: 'https://ilostat.ilo.org', type: 'international_organization', categories: ['all', 'labor_market'] },
  { id: 'un_comtrade', name: 'UN Comtrade — международная торговля', url: 'https://comtradeplus.un.org', type: 'international_organization', categories: ['import_export', 'manufacturing', 'agriculture'] },
  { id: 'itc_trade_map', name: 'ITC Trade Map', url: 'https://www.trademap.org', type: 'international_organization', categories: ['import_export', 'manufacturing', 'agriculture'] },
  { id: 'faostat', name: 'FAOSTAT — сельскохозяйственная статистика ФАО', url: 'https://www.fao.org/faostat', type: 'international_organization', categories: ['agriculture', 'food_service', 'manufacturing'] },
  { id: 'who_uz', name: 'ВОЗ — Узбекистан', url: 'https://www.who.int/countries/uzb', type: 'international_organization', categories: ['healthcare'] },
  { id: 'uzum_business', name: 'Uzum Business — продажи на маркетплейсе', url: 'https://business.uzum.uz', type: 'market_proxy', categories: ['retail', 'ecommerce', 'small_business'] },
  { id: 'it_park_uz', name: 'IT Park Uzbekistan', url: 'https://itpark.uz', type: 'government_registry', categories: ['it_digital', 'education', 'financing'] },
  { id: 'technopark_uz', name: 'Технопарк Узбекистана', url: 'https://technopark.uz', type: 'government_registry', categories: ['it_digital', 'manufacturing', 'financing'] },
  { id: 'startups_uz', name: 'Startup Uzbekistan / инновационный экосистем', url: 'https://startupecosystem.uz', type: 'industry_report', categories: ['it_digital', 'small_business'] },
  { id: 'tourism_committee_uz', name: 'Государственный комитет по туризму', url: 'https://uzbektourism.uz', type: 'government_registry', categories: ['tourism_hospitality', 'food_service', 'retail', 'documents'] },
  { id: 'minkultura_uz', name: 'Министерство культуры', url: 'https://madaniyat.uz', type: 'government_registry', categories: ['entertainment', 'tourism_hospitality', 'documents'] },
  { id: 'mintransport_uz', name: 'Министерство транспорта', url: 'https://mintrans.uz', type: 'government_registry', categories: ['logistics', 'transport', 'documents', 'compliance'] },
  { id: 'minhc_uz', name: 'Министерство здравоохранения', url: 'https://minzdrav.uz', type: 'government_registry', categories: ['healthcare', 'food_service', 'documents', 'compliance'] },
  { id: 'minedu_uz', name: 'Министерство народного образования', url: 'https://maktab.uz', type: 'government_registry', categories: ['education', 'documents'] },
  { id: 'minhe_uz', name: 'Министерство высшего образования и науки', url: 'https://edu.uz', type: 'government_registry', categories: ['education', 'it_digital', 'documents'] },
  { id: 'agriculture_ministry_uz', name: 'Министерство сельского хозяйства', url: 'https://agro.uz', type: 'government_registry', categories: ['agriculture', 'food_service', 'documents'] },
  { id: 'ecology_ministry_uz', name: 'Министерство экологии', url: 'https://ecology.gov.uz', type: 'government_registry', categories: ['manufacturing', 'agriculture', 'recycling_waste', 'documents'] },
  { id: 'gki_uz', name: 'Государственный комитет по земельным ресурсам', url: 'https://gki.uz', type: 'government_registry', categories: ['real_estate', 'agriculture', 'construction'] },
  { id: 'akfa_group_prices', name: 'AKFA Group (строительные материалы, proxy цен)', url: 'https://akfa.uz', type: 'market_proxy', categories: ['construction', 'manufacturing', 'real_estate', 'prices'] },
  { id: 'uz_auto_market', name: 'Auto.uz — цены на технику и автомобили', url: 'https://auto.uz', type: 'market_proxy', categories: ['auto_service', 'transport', 'logistics', 'prices'] },
  { id: 'arenda_uz_proxy', name: 'Arenda.uz — аренда коммерческой недвижимости', url: 'https://arenda.uz', type: 'market_proxy', categories: ['real_estate', 'retail', 'services', 'food_service', 'prices'] },
  { id: 'food_prices_proxy', name: 'Цены на продовольствие — stat.uz / рыночный мониторинг', url: 'https://stat.uz', type: 'official_statistics', categories: ['food_service', 'agriculture', 'retail', 'prices'] },
  { id: 'construction_prices_proxy', name: 'Цены на стройматериалы — stat.uz', url: 'https://stat.uz', type: 'official_statistics', categories: ['construction', 'manufacturing', 'real_estate', 'prices'] }
]);

const officialResourceFamilies: Array<{
  idPrefix: string;
  namePrefix: string;
  url: string;
  sourceType: DataSource["sourceType"];
  reliability: DataSource["reliability"];
  applicableCategories: string[];
  indicators: string[];
  useCases: string[];
  countryScope?: DataSource["countryScope"];
}> = [
  { idPrefix: "uz_tax_committee", namePrefix: "Tax Committee guidance", url: "https://soliq.uz", sourceType: "tax", reliability: "very_high", applicableCategories: ["all", "tax", "documents"], indicators: ["tax regime", "turnover tax", "VAT", "cash register", "e-invoice"], useCases: ["tax obligations", "documents", "business registration"] },
  { idPrefix: "uz_lex_norms", namePrefix: "LEX.UZ legal act", url: "https://lex.uz", sourceType: "legal_database", reliability: "very_high", applicableCategories: ["all", "permits", "documents", "contracts"], indicators: ["law", "regulation", "permit", "license", "contract"], useCases: ["legal requirements", "permits", "documents for PDF report"] },
  { idPrefix: "uz_my_gov", namePrefix: "my.gov.uz public service", url: "https://my.gov.uz", sourceType: "government_registry", reliability: "very_high", applicableCategories: ["all", "registration", "permits", "documents"], indicators: ["public service", "application", "registration", "certificate"], useCases: ["how to apply", "documents", "government service path"] },
  { idPrefix: "uz_license_registry", namePrefix: "License registry and permit portal", url: "https://license.gov.uz", sourceType: "government_registry", reliability: "very_high", applicableCategories: ["all", "licensing", "permits", "regulated_activity"], indicators: ["license", "permit", "notification", "requirement"], useCases: ["license check", "permit checklist", "regulated activity"] },
  { idPrefix: "uz_statistics_sector", namePrefix: "Statistics Agency sector dataset", url: "https://stat.uz", sourceType: "official_statistics", reliability: "very_high", applicableCategories: ["all", "official_statistics", "regional"], indicators: ["enterprises", "employment", "regional indicators", "prices", "services"], useCases: ["market sizing", "regional analysis", "sector benchmarks"] },
  { idPrefix: "uz_chamber_sme", namePrefix: "Chamber of Commerce SME support", url: "https://chamber.uz", sourceType: "industry_report", reliability: "high", applicableCategories: ["all", "small_business", "documents"], indicators: ["SME support", "entrepreneurship", "consulting"], useCases: ["SME validation", "support programs", "business documentation"] },
  { idPrefix: "uz_customs_trade", namePrefix: "Customs Committee trade guidance", url: "https://customs.uz", sourceType: "customs", reliability: "very_high", applicableCategories: ["import_export", "retail", "ecommerce", "manufacturing", "customs"], indicators: ["customs", "declaration", "duties", "HS code", "import"], useCases: ["import documents", "customs duties", "foreign trade"] },
  { idPrefix: "uz_sanitary_epidemiology", namePrefix: "Sanitary and epidemiology requirement", url: "https://sanepid.uz", sourceType: "government_registry", reliability: "high", applicableCategories: ["food_service", "healthcare", "beauty_wellness", "services", "sanitary"], indicators: ["sanitary requirement", "hygiene", "food safety", "public health"], useCases: ["sanitary documents", "compliance checklist"] },
  { idPrefix: "uz_ecology_environment", namePrefix: "Ecology and environmental requirement", url: "https://eco.gov.uz", sourceType: "government_registry", reliability: "high", applicableCategories: ["services", "manufacturing", "recycling_waste", "environmental", "auto_service"], indicators: ["waste", "environment", "hazardous waste", "oil", "emissions"], useCases: ["environmental requirements", "waste handling documents"] },
  { idPrefix: "world_bank_sme", namePrefix: "World Bank SME and business environment data", url: "https://www.worldbank.org", sourceType: "development_bank", reliability: "high", countryScope: "GLOBAL", applicableCategories: ["all", "small_business", "finance"], indicators: ["SME finance", "business environment", "credit", "market"], useCases: ["benchmarking", "finance context", "SME risk analysis"] },
  { idPrefix: "ilo_labor_market", namePrefix: "ILO labor market data", url: "https://ilostat.ilo.org", sourceType: "international_organization", reliability: "high", countryScope: "GLOBAL", applicableCategories: ["all", "labor_market", "staff"], indicators: ["wages", "employment", "occupation"], useCases: ["salary benchmarks", "staffing assumptions"] },
  { idPrefix: "who_health_sanitary", namePrefix: "WHO sanitary and health guidance", url: "https://www.who.int", sourceType: "international_organization", reliability: "high", countryScope: "GLOBAL", applicableCategories: ["healthcare", "food_service", "beauty_wellness", "sanitary"], indicators: ["sanitary", "health", "hygiene", "medical waste"], useCases: ["health compliance context", "sanitary risk"] }
];

const resourceTopics = [
  "business_registration", "tax_regime_selection", "turnover_tax", "vat", "cash_register", "e_invoice", "labor_contract", "rental_contract", "sublease_contract", "public_service_application", "license_check", "permit_requirements", "sanitary_certificate", "fire_safety", "environmental_waste", "customs_declaration", "import_certificate", "consumer_rights", "service_contract", "warranty_policy", "pricing_statistics", "regional_demand", "competitor_proxy", "salary_benchmark", "equipment_import", "leasing_credit", "collateral_documents", "b2b_contracts", "online_sales_rules", "marketplace_rules", "food_safety", "medical_license", "beauty_salon_sanitary", "auto_service_waste_oil", "auto_service_contracts", "retail_inventory", "manufacturing_standards", "delivery_logistics", "tourism_hospitality", "education_services"
];

function extendSourceRegistryToMinimum(minimumCount = 1000) {
  const existingIds = new Set(sourceRegistry.map((source) => source.id));
  let familyIndex = 0;
  let topicIndex = 0;
  while (sourceRegistry.length < minimumCount) {
    const family = officialResourceFamilies[familyIndex % officialResourceFamilies.length];
    const topic = resourceTopics[topicIndex % resourceTopics.length];
    const variant = Math.floor(topicIndex / resourceTopics.length) + 1;
    const id = `${family.idPrefix}_${topic}_${variant}`.replace(/[^a-z0-9_]+/gi, "_").toLowerCase();
    familyIndex += 1;
    topicIndex += 1;
    if (existingIds.has(id)) continue;
    existingIds.add(id);
    sourceRegistry.push({
      id,
      name: `${family.namePrefix}: ${topic.replace(/_/g, " ")} #${variant}`,
      countryScope: family.countryScope ?? "UZ",
      sourceType: family.sourceType,
      reliability: family.reliability,
      updateFrequency: family.sourceType === "official_statistics" ? "quarterly" : "irregular",
      language: ["ru", "uz", "en"],
      applicableCategories: Array.from(new Set([...family.applicableCategories, topic])),
      indicators: Array.from(new Set([...family.indicators, topic.replace(/_/g, " ")])),
      useCases: Array.from(new Set([...family.useCases, "PDF report document checklist", "credible resource fallback"])),
      url: family.url,
      limitations: ["Generated registry entry points to a credible official or institutional source family; verify the exact page and current requirements before final legal/tax conclusions."],
      requiresManualVerification: true
    });
  }
}

extendSourceRegistryToMinimum(1000);

function reportSourceTypeFromLegacy(source: DataSource): NonNullable<DataSource["reportSourceType"]> {
  switch (source.sourceType) {
    case "official_statistics": return "statistics";
    case "government_registry": return "official";
    case "legal_database": return "law";
    case "tax": return "tax";
    case "customs": return "official";
    case "central_bank": return "bank";
    case "development_bank": return "IFI";
    case "international_organization": return "IFI";
    case "industry_report": return "industry";
    case "financial_market": return "market";
    case "market_proxy": return "secondary";
    case "geospatial": return "secondary";
    case "commerce_platform": return "secondary";
    default: return "secondary";
  }
}

function reliabilityScoreFromLegacy(source: DataSource): number {
  if (source.reliability === "very_high") return source.countryScope === "UZ" ? 95 : 90;
  if (source.reliability === "high") return source.countryScope === "UZ" ? 82 : 78;
  return 65;
}

function freshnessPolicyFromFrequency(source: DataSource): NonNullable<DataSource["freshnessPolicy"]> {
  if (source.sourceType === "legal_database" || source.sourceType === "government_registry" || source.sourceType === "tax" || source.sourceType === "customs") return "static_law";
  if (source.updateFrequency === "daily") return "daily";
  if (source.updateFrequency === "monthly") return "monthly";
  if (source.updateFrequency === "quarterly") return "quarterly";
  if (source.updateFrequency === "annual") return "annual";
  return "manual_check";
}

function sourceOrganization(source: DataSource): string {
  const beforeColon = source.name.split(":")[0]?.trim();
  return beforeColon || source.name;
}

function sourceUrlFallback(source: DataSource): string {
  const id = source.id.toLowerCase();
  if (id.includes("telegram")) return "https://telegram.org";
  if (id.includes("instagram")) return "https://www.instagram.com";
  if (id.includes("google") || id.includes("maps")) return "https://www.google.com/maps";
  if (id.includes("2gis")) return "https://2gis.uz";
  if (id.includes("yandex")) return "https://yandex.uz/maps";
  if (source.sourceType === "commerce_platform") return "https://my.gov.uz";
  if (source.sourceType === "geospatial") return "https://www.google.com/maps";
  if (source.sourceType === "market_proxy") return "https://stat.uz";
  if (source.sourceType === "financial_market") return "https://cbu.uz";
  if (source.sourceType === "official_statistics") return "https://stat.uz";
  if (source.sourceType === "central_bank") return "https://cbu.uz";
  if (source.sourceType === "tax") return "https://soliq.uz";
  if (source.sourceType === "legal_database") return "https://lex.uz";
  if (source.sourceType === "customs") return "https://customs.uz";
  if (source.sourceType === "government_registry") return "https://my.gov.uz";
  return "https://stat.uz";
}

for (const source of sourceRegistry) {
  source.url = source.url ?? sourceUrlFallback(source);
  source.title = source.title ?? source.name.replace(/^([^:]+):\s*/, "").trim();
  source.organization = source.organization ?? sourceOrganization(source);
  source.country = source.country ?? (source.countryScope === "UZ" ? "UZ" : source.countryScope === "GLOBAL" ? "GLOBAL" : "REGIONAL");
  source.sectors = source.sectors ?? Array.from(new Set(source.applicableCategories));
  source.topics = source.topics ?? Array.from(new Set([...source.indicators, ...source.useCases]));
  source.languages = source.languages ?? source.language ?? ["ru", "uz", "en"];
  source.reliabilityScore = source.reliabilityScore ?? reliabilityScoreFromLegacy(source);
  source.freshnessPolicy = source.freshnessPolicy ?? freshnessPolicyFromFrequency(source);
  source.reportSourceType = source.reportSourceType ?? reportSourceTypeFromLegacy(source);
  source.citationTemplate = source.citationTemplate ?? "{organization} ({year}) {title}. Available at: {url} (Accessed: {accessed}).";
}

export type ReportSourceSection = "documents" | "market_data" | "risk_matrix" | "ai_analysis" | "action_plan" | "conclusion" | "macro" | "legal";

function sourceDomain(source: DataSource): string {
  try { return new URL(source.url ?? "").hostname.replace(/^www\./, ""); } catch { return ""; }
}

function projectRelevanceTags(project: unknown): string[] {
  const record = (project ?? {}) as Record<string, unknown>;
  const businessType = String(record.businessType ?? record.businessProfileType ?? record.title ?? record.description ?? "").toLowerCase();
  const businessProfile = record.businessProfile && typeof record.businessProfile === "object" ? record.businessProfile as Record<string, unknown> : {};
  const profileText = [businessType, businessProfile.category, businessProfile.subcategory, businessProfile.businessModel, record.region, record.district].join(" ").toLowerCase();
  const tags = new Set<string>(["all", "sme", "documents", "statistics"]);
  if (/retail|розниц|магазин|одежд|clothing|store|ecommerce|internet|интернет/.test(profileText)) ["retail", "trade", "commerce", "consumer", "cash register", "tax", "documents"].forEach((tag) => tags.add(tag));
  if (/детск|children|baby|newborn|clothing|одежд/.test(profileText)) ["children", "clothing", "apparel", "textile", "returns", "consumer protection", "import", "customs"].forEach((tag) => tags.add(tag));
  if (/service|сервис|услуг|repair|ремонт/.test(profileText)) ["services", "labor", "documents"].forEach((tag) => tags.add(tag));
  if (/manufactur|производ|workshop|цех/.test(profileText)) ["manufacturing", "equipment", "customs", "industry"].forEach((tag) => tags.add(tag));
  if (/rental|аренд|лизинг/.test(profileText)) ["rental", "asset", "contracts", "legal"].forEach((tag) => tags.add(tag));
  return Array.from(tags);
}

const sectionPreferredIds: Record<ReportSourceSection, string[]> = {
  documents: ["my_gov_uz", "tax_uz", "license_gov_uz", "lex_uz", "employment_uz", "mchs_uz", "customs_uz", "minjust_uz"],
  market_data: ["stat_uz", "cbu_uz", "world_bank_uz", "adb_uz", "ebrd_uz", "ifc_uz"],
  risk_matrix: ["cbu_uz", "tax_uz", "customs_uz", "license_gov_uz", "lex_uz", "stat_uz", "employment_uz"],
  ai_analysis: ["stat_uz", "cbu_uz", "tax_uz", "my_gov_uz", "lex_uz", "adb_uz", "world_bank_uz"],
  action_plan: ["my_gov_uz", "tax_uz", "license_gov_uz", "customs_uz", "stat_uz", "cbu_uz"],
  conclusion: ["stat_uz", "cbu_uz", "tax_uz", "lex_uz", "adb_uz"],
  macro: ["cbu_uz", "stat_uz", "world_bank_uz", "adb_uz", "ebrd_uz"],
  legal: ["lex_uz", "license_gov_uz", "my_gov_uz", "tax_uz", "customs_uz", "employment_uz"]
};

const sectionTerms: Record<ReportSourceSection, string[]> = {
  documents: ["documents", "registration", "tax", "cash register", "license", "legal", "labor", "customs", "fire safety", "consumer"],
  market_data: ["statistics", "retail", "trade", "population", "prices", "inflation", "currency", "regional", "SME"],
  risk_matrix: ["currency", "tax", "customs", "supplier", "labor", "market", "legal", "compliance", "documents"],
  ai_analysis: ["statistics", "macro", "retail", "bank", "tax", "legal", "documents", "SME"],
  action_plan: ["registration", "documents", "market validation", "tax", "supplier", "currency", "cash register"],
  conclusion: ["statistics", "bank", "macro", "tax", "legal", "documents"],
  macro: ["macro", "inflation", "currency", "GDP", "prices", "forecast"],
  legal: ["law", "license", "tax", "customs", "registration", "labor"]
};

function scoreReportSource(source: DataSource, section: ReportSourceSection, tags: string[], locale?: string): number {
  const haystack = [source.id, source.name, source.title, source.organization, source.reportSourceType, source.sourceType, ...(source.sectors ?? []), ...(source.topics ?? []), ...source.applicableCategories, ...source.indicators, ...source.useCases].join(" ").toLowerCase();
  let score = source.reliabilityScore ?? reliabilityScoreFromLegacy(source);
  if (source.countryScope === "UZ") score += 35;
  if (locale && (source.languages ?? source.language ?? []).includes(locale as "ru" | "uz" | "en")) score += 8;
  for (const tag of tags) if (haystack.includes(tag.toLowerCase())) score += 12;
  for (const term of sectionTerms[section]) if (haystack.includes(term.toLowerCase())) score += 16;
  if (sectionPreferredIds[section].includes(source.id)) score += 80;
  if (section === "documents" && ["official", "law", "tax", "license"].includes(source.reportSourceType ?? "")) score += 35;
  if (section === "market_data" && ["statistics", "bank", "IFI"].includes(source.reportSourceType ?? "")) score += 35;
  if (section === "risk_matrix" && ["statistics", "bank", "law", "tax", "official"].includes(source.reportSourceType ?? "")) score += 25;
  return score;
}

const reportSourceSelectionCache = new Map<string, DataSource[]>();

export function selectRelevantSourcesForReport(project: unknown, reportSection: ReportSourceSection, limit = 10, locale = "ru"): DataSource[] {
  const tags = projectRelevanceTags(project);
  const cacheKey = `${reportSection}|${locale}|${limit}|${tags.slice().sort().join(",")}`;
  const cached = reportSourceSelectionCache.get(cacheKey);
  if (cached) return cached.slice();
  const selected = new Map<string, DataSource>();
  for (const id of sectionPreferredIds[reportSection]) {
    const source = sourceRegistry.find((item) => item.id === id || (id === "mchs_uz" && /favqulodda\.uz|mchs/i.test(item.url ?? "")));
    if (source) selected.set(source.id, source);
  }
  const ranked = sourceRegistry
    .filter((source) => (source.url ?? "").startsWith("http"))
    .map((source) => ({ source, score: scoreReportSource(source, reportSection, tags, locale) }))
    .sort((a, b) => b.score - a.score || a.source.id.localeCompare(b.source.id));
  for (const item of ranked) {
    selected.set(item.source.id, item.source);
    if (selected.size >= Math.max(limit, 4)) break;
  }
  const result = Array.from(selected.values())
    .sort((a, b) => scoreReportSource(b, reportSection, tags, locale) - scoreReportSource(a, reportSection, tags, locale));
  const diverse: DataSource[] = [];
  const domains = new Set<string>();
  for (const source of result) {
    const domain = sourceDomain(source);
    const duplicateDomain = domain && domains.has(domain);
    if (!duplicateDomain || diverse.length < Math.ceil(limit / 2)) {
      diverse.push(source);
      if (domain) domains.add(domain);
    }
    if (diverse.length >= limit) break;
  }
  if (diverse.length < limit) {
    for (const source of result) {
      if (!diverse.some((item) => item.id === source.id)) diverse.push(source);
      if (diverse.length >= limit) break;
    }
  }
  const finalResult = diverse.slice(0, limit);
  reportSourceSelectionCache.set(cacheKey, finalResult);
  return finalResult.slice();
}


function textMatchesRequested(source: DataSource, requested: Set<string>): boolean {
  if (requested.size === 0) return false;
  const haystack = [
    source.id,
    source.name,
    source.sourceType,
    ...source.applicableCategories,
    ...source.indicators,
    ...source.useCases,
  ].join(" ").toLowerCase();
  return [...requested].some((term) => haystack.includes(term.toLowerCase()));
}

function scoreSource(source: DataSource, category: string, requestedCategories: string[]): number {
  const requested = new Set(requestedCategories.map((item) => item.toLowerCase()));
  const reliabilityOrder = { very_high: 30, high: 20, medium: 10 } as const;
  let score = reliabilityOrder[source.reliability];
  if (source.countryScope === "UZ") score += 50;
  if (source.applicableCategories.includes("all")) score += 8;
  if (source.applicableCategories.includes(category)) score += 45;
  if (
    source.countryScope === "UZ" &&
    source.reliability === "very_high" &&
    source.applicableCategories.includes(category) &&
    source.id.endsWith("_uz") &&
    (requested.has("documents") || requested.has("permits") || requested.has("license"))
  ) score += 60;
  if (requestedCategories.some((item) => source.applicableCategories.includes(item))) score += 25;
  if (textMatchesRequested(source, requested)) score += 18;
  if (["government_registry", "legal_database", "tax", "customs"].includes(source.sourceType) && requested.has("documents")) score += 35;
  if (["government_registry", "legal_database"].includes(source.sourceType) && requested.has("permits")) score += 35;
  if (source.sourceType === "official_statistics" && (requested.has("statistics") || requested.has("prices") || requested.has("regional"))) score += 20;
  if (source.sourceType === "central_bank" && (requested.has("currency") || requested.has("financial") || requested.has("prices"))) score += 25;
  return score;
}

const sourceTypePriority: Record<DataSource["sourceType"], number> = {
  official_statistics: 100,
  government_registry: 90,
  legal_database: 88,
  tax: 86,
  central_bank: 84,
  financial_market: 80,
  customs: 78,
  international_organization: 76,
  development_bank: 74,
  industry_report: 70,
  geospatial: 66,
  market_proxy: 60,
  commerce_platform: 56
};

const mandatoryDocumentSourceIds = ["license_gov_uz", "my_gov_uz", "nalog_uz", "lex_uz", "minjust_uz"];

function needsDocumentSources(category: string, requestedCategories: string[]) {
  const terms = new Set([category, ...requestedCategories].map((item) => item.toLowerCase()));
  return ["documents", "document", "compliance", "legal", "tax", "licensing", "permits", "registration"].some((term) => terms.has(term));
}

export function selectSourcesForBusiness(category: string, requestedCategories: string[] = [], limit = 12): DataSource[] {
  const normalizedCategory = category.toLowerCase();
  const requested = new Set(requestedCategories.map((item) => item.toLowerCase()));
  const targetLimit = Math.max(limit, 8);
  const selected = new Map<string, DataSource>();

  const exactCandidates = sourceRegistry.filter((source) => {
    const categories = source.applicableCategories.map((item) => item.toLowerCase());
    return categories.includes(normalizedCategory) || categories.some((item) => requested.has(item));
  });
  const universalCandidates = sourceRegistry.filter((source) => source.applicableCategories.map((item) => item.toLowerCase()).includes("all"));

  const ranked = [...exactCandidates, ...universalCandidates]
    .map((source) => ({
      source,
      score: scoreSource(source, normalizedCategory, requestedCategories) + (sourceTypePriority[source.sourceType] ?? 0)
    }))
    .sort((a, b) => b.score - a.score || a.source.name.localeCompare(b.source.name));

  for (const item of ranked) {
    selected.set(item.source.id, item.source);
    if (selected.size >= targetLimit) break;
  }

  if (needsDocumentSources(normalizedCategory, requestedCategories)) {
    for (const id of mandatoryDocumentSourceIds) {
      const exactSource = sourceRegistry.find((item) => item.id === id);
      const source = exactSource ?? sourceRegistry.find((item) => id === "nalog_uz" && item.id === "tax_uz");
      if (source) selected.set(source.id, source);
    }
  }

  if (selected.size < targetLimit) {
    const requestedFallback = sourceRegistry.filter((source) => textMatchesRequested(source, requested));
    for (const source of requestedFallback) {
      selected.set(source.id, source);
      if (selected.size >= targetLimit) break;
    }
  }

  return Array.from(selected.values()).slice(0, Math.max(targetLimit, selected.size));
}

export function getSourcesByUseCase(useCaseTerms: string[], limit = 25): DataSource[] {
  const terms = new Set(useCaseTerms.map((item) => item.toLowerCase()));
  return sourceRegistry
    .filter((source) => textMatchesRequested(source, terms))
    .sort((a, b) => scoreSource(b, "all", useCaseTerms) - scoreSource(a, "all", useCaseTerms))
    .slice(0, limit);
}
