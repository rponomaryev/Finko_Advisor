export const cleaningService = {
  businessType: "Клининговые услуги",
  businessIdea: "Хочу открыть клининговую компанию в Ташкенте: уборка квартир, офисов и B2B договоры с небольшими компаниями. Планирую выездные бригады, закупку профессионального инвентаря и химии.",
  region: "Ташкент город",
  productOrService: "Уборка квартир, офисов и коммерческих помещений",
  cleaningServiceTypes: ["apartment_cleaning", "office_cleaning", "commercial_cleaning", "deep_cleaning"],
  targetCustomers: ["apartments", "offices", "b2b_contracts", "repeat_clients"],
  customerAcquisitionChannels: ["instagram", "telegram", "recommendations", "maps_2gis_google_yandex"],
  premisesStatus: "storage_only",
  equipmentCondition: "new",
  equipmentList: "Профессиональный пылесос, пароочиститель, инвентарь, спецодежда, расходники",
  cleaningChemicals: "Чистящие средства, перчатки, маски, салфетки, мешки",
  chemicalsSource: "local",
  dailyOrdersCapacity: 4,
  averageCleaningTicket: 350000,
  staffPlan: {
    roles: [
      { role: "Клинер", count: 4, monthlySalaryAmount: 3500000, monthlySalaryCurrency: "UZS" },
      { role: "Бригадир", count: 1, monthlySalaryAmount: 5000000, monthlySalaryCurrency: "UZS" }
    ]
  },
  ownContributionAmount: 50000000,
  ownContributionCurrency: "UZS",
  creditNeeded: "yes"
} as const;
