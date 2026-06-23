export const waterQualityLabFixture = {
  businessType: "Выездная лаборатория экспресс-анализа качества воды",
  businessIdea: "Бизнес оказывает услуги по выездной проверке качества воды для кафе, ресторанов, гостиниц, офисов, частных домов и небольших производственных помещений. Основная выручка — платные тесты воды, лабораторные замеры, подготовка краткого заключения и рекомендации по фильтрации.",
  region: "Ташкент",
  expectedCategory: "healthcare",
  expectedSubcategory: "analytical_laboratory",
  forbiddenCategory: "food_service",
  forbiddenBlocks: ["food_service_menu", "seating_capacity", "daily_covers", "kitchen_equipment"]
} as const;
