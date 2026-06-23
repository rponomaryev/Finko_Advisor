import type { StructuredProjectData } from "../types/project.ts";
import { classifyBusiness, type BusinessProfile } from "../business/businessClassifier.ts";

export type DocumentRequirement = {
  id: string;
  country: "UZ";
  category: string;
  subcategory?: string;
  operationalModel?: string;
  title: string;
  name_ru: string;
  name_uz: string;
  whenRequired: string;
  userCondition?: Record<string, unknown>;
  authority?: string;
  organ_ru: string;
  action: string;
  url: string;
  deadline_days: number;
  required: boolean;
  note_ru?: string;
  sourceType: "official" | "legal" | "advisory";
  sourceId?: string;
  sourceName?: string;
  legalBasis?: string;
  confidence: "high" | "medium" | "needs_verification";
  reportText: string;
  missingInfoQuestions?: string[];
};

type RequirementInput = Omit<DocumentRequirement, "country" | "name_ru" | "name_uz" | "organ_ru" | "url" | "deadline_days" | "required"> & Partial<Pick<DocumentRequirement, "name_ru" | "name_uz" | "organ_ru" | "url" | "deadline_days" | "required" | "note_ru">>;

const officialSourceUrls: Record<string, string> = {
  my_gov_uz: "https://my.gov.uz",
  tax_uz: "https://soliq.uz",
  nalog_uz: "https://soliq.uz",
  license_gov_uz: "https://license.gov.uz",
  lex_uz: "https://lex.uz",
  mchs_uz: "https://favqulodda.uz",
  employment_uz: "https://mehnat.uz",
  mehnat_uz: "https://mehnat.uz",
  sanepid_uz: "https://ssv.uz",
  ssv_uz: "https://ssv.uz",
  customs_uz: "https://customs.uz",
  transport_ministry_uz: "https://mintrans.uz",
  health_ministry_uz: "https://minzdrav.uz",
  agriculture_ministry_uz: "https://agro.uz",
  construction_ministry_uz: "https://mc.uz",
  ecology_uz: "https://ecology.gov.uz"
};

function inferDocumentDeadlineDays(item: RequirementInput) {
  const text = `${item.id} ${item.title} ${item.action}`.toLowerCase();
  if (/not_required|no_special_license|не требуется/.test(text)) return 0;
  if (/ip_registration|регистрация ип/.test(text)) return 1;
  if (/ooo_registration|ооо/.test(text)) return 3;
  if (/tax|налог/.test(text)) return 3;
  if (/cash|kassa|касс/.test(text)) return 7;
  if (/fire|пожар/.test(text)) return 14;
  if (/sanitary|санитар/.test(text)) return 14;
  if (/lease|аренд/.test(text)) return 1;
  if (/labor|employee|труд/.test(text)) return 1;
  return item.sourceType === "advisory" ? 7 : 10;
}

const req = (item: RequirementInput): DocumentRequirement => ({
  country: "UZ",
  ...item,
  name_ru: item.name_ru ?? item.title,
  name_uz: item.name_uz ?? item.title,
  organ_ru: item.organ_ru ?? item.authority ?? item.sourceName ?? "Профильный орган / консультант",
  url: item.url ?? officialSourceUrls[item.sourceId ?? ""] ?? "https://my.gov.uz",
  deadline_days: item.deadline_days ?? inferDocumentDeadlineDays(item),
  required: item.required ?? item.confidence !== "medium",
  note_ru: item.note_ru ?? item.reportText
});

const generalRequirements: DocumentRequirement[] = [
  req({ id: "ip_registration", category: "all", title: "Регистрация ИП", name_ru: "Регистрация ИП", name_uz: "Yakka tartibdagi tadbirkorni ro'yxatdan o'tkazish", whenRequired: "До запуска", authority: "Министерство юстиции / my.gov.uz", organ_ru: "Министерство юстиции / my.gov.uz", action: "Оформить ИП онлайн, если бизнес запускается одним владельцем", sourceType: "official", sourceId: "my_gov_uz", sourceName: "Единый портал госуслуг my.gov.uz", confidence: "high", url: "https://my.gov.uz", deadline_days: 1, required: true, reportText: "Оформляется онлайн за 1 день. Рассмотреть ООО если нужны партнёры или кредит.", note_ru: "Оформляется онлайн за 1 день. Рассмотреть ООО если нужны партнёры или кредит." }),
  req({ id: "ooo_registration", category: "all", title: "Регистрация ООО", name_ru: "Регистрация ООО", name_uz: "MChJni ro'yxatdan o'tkazish", whenRequired: "До запуска, если есть партнеры, кредит или корпоративные клиенты", authority: "Министерство юстиции / my.gov.uz", organ_ru: "Министерство юстиции / my.gov.uz", action: "Зарегистрировать ООО при партнерской структуре, кредитовании или B2B-контрактах", sourceType: "official", sourceId: "my_gov_uz", sourceName: "Единый портал госуслуг my.gov.uz", confidence: "high", url: "https://my.gov.uz", deadline_days: 3, required: false, reportText: "Нужно при наличии партнёров, кредита, корпоративных клиентов", note_ru: "Нужно при наличии партнёров, кредита, корпоративных клиентов" }),
  req({ id: "tax_registration", category: "all", title: "Постановка на налоговый учёт", name_ru: "Постановка на налоговый учёт", name_uz: "Soliq hisobiga qo'yish", whenRequired: "До первых продаж", authority: "Налоговый комитет / soliq.uz", organ_ru: "Налоговый комитет / soliq.uz", action: "Проверить постановку на учет, налоговый режим и платежные документы", sourceType: "official", sourceId: "nalog_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", url: "https://soliq.uz", deadline_days: 3, required: true, reportText: "Постановка на налоговый учёт и выбор режима должны быть закрыты до первых продаж." }),
  req({ id: "online_kassa", category: "all", title: "Подключение онлайн-кассы (фискальный модуль)", name_ru: "Подключение онлайн-кассы (фискальный модуль)", name_uz: "Onlayn kassa ulash", whenRequired: "До приема оплат от физлиц", authority: "Налоговый комитет / soliq.uz", organ_ru: "Налоговый комитет / soliq.uz", action: "Подключить онлайн-кассу/терминал и настроить выдачу чеков", sourceType: "official", sourceId: "nalog_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", url: "https://soliq.uz", deadline_days: 7, required: true, reportText: "Обязательно для всех, кто принимает оплату от физлиц", note_ru: "Обязательно для всех, кто принимает оплату от физлиц" }),
  req({ id: "employee_contract", category: "all", title: "Трудовой договор с сотрудниками", name_ru: "Трудовой договор с сотрудниками", name_uz: "Xodimlar bilan mehnat shartnomasi", whenRequired: "При наличии сотрудников", authority: "Министерство занятости / mehnat.uz", organ_ru: "Министерство занятости / mehnat.uz", action: "Оформить трудовые договоры, должностные обязанности и график", sourceType: "official", sourceId: "mehnat_uz", sourceName: "Министерство занятости", confidence: "high", url: "https://mehnat.uz", deadline_days: 1, required: true, reportText: "Обязателен при наличии наёмных сотрудников", note_ru: "Обязателен при наличии наёмных сотрудников" }),
  req({ id: "sanitary_conclusion", category: "food_service", title: "Санитарно-эпидемиологическое заключение", name_ru: "Санитарно-эпидемиологическое заключение", name_uz: "Sanitariya-epidemiologiya xulosasi", whenRequired: "До запуска санитарно регулируемой деятельности", authority: "Агентство санэпидблагополучия — ssv.uz", organ_ru: "Агентство санэпидблагополучия — ssv.uz", action: "Проверить и получить санитарное заключение, если деятельность попадает в категорию", sourceType: "official", sourceId: "ssv_uz", sourceName: "Агентство санитарно-эпидемиологического благополучия", confidence: "needs_verification", url: "https://ssv.uz", deadline_days: 14, required: true, reportText: "Для пищевых, медицинских, beauty и производственных направлений требования нужно подтвердить по официальному источнику." }),
  req({ id: "no_special_license", category: "services", title: "Специальная лицензия НЕ требуется", name_ru: "Специальная лицензия НЕ требуется", name_uz: "Maxsus litsenziya talab qilinmaydi", whenRequired: "Для обычных сервисных услуг без регулируемой деятельности", authority: "Единый портал лицензирования — license.gov.uz", organ_ru: "Единый портал лицензирования — license.gov.uz", action: "Зафиксировать, что специальная лицензия не требуется, и приложить ссылку на портал лицензирования", sourceType: "official", sourceId: "license_gov_uz", sourceName: "Единый портал лицензирования", confidence: "high", url: "https://license.gov.uz", deadline_days: 0, required: false, reportText: "Специальная лицензия не требуется. Источник: license.gov.uz", note_ru: "Для обычных сервисных услуг специальная лицензия обычно не требуется; статус конкретного вида деятельности нужно зафиксировать через license.gov.uz." }),
  req({ id: "business_registration", category: "all", title: "Регистрация бизнеса", whenRequired: "До начала деятельности", authority: "my.gov.uz / государственные услуги", action: "Сравнить ИП и ООО по владельцам, сотрудникам, B2B-договорам, кредиту/лизингу и ответственности", sourceType: "official", sourceId: "my_gov_uz", sourceName: "Единый портал интерактивных государственных услуг", confidence: "high", reportText: "Если бизнес запускается одним владельцем, без партнеров и крупных B2B-договоров, можно рассмотреть ИП. Если планируются сотрудники, корпоративные клиенты, кредит/лизинг, партнеры или повышенная ответственность, чаще практичнее ООО. Окончательный выбор нужно подтвердить с бухгалтером или юристом." }),
  req({ id: "tax_mode", category: "all", title: "Налоговый режим и кассовая дисциплина", whenRequired: "До первых продаж", authority: "Налоговый комитет Республики Узбекистан", action: "Проверить налоговый режим, онлайн-кассу, e-invoice и платежные документы", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Налоговый режим и порядок оформления продаж нужно подтвердить до запуска, чтобы избежать compliance-риска." }),
  req({ id: "lease_agreement", category: "all", title: "Договор аренды помещения", name_ru: "Договор аренды помещения", name_uz: "Binoni ijara shartnomasi", whenRequired: "Если бизнес использует помещение", authority: "Арендодатель / нотариус при сроке > 1 года", organ_ru: "Арендодатель / нотариус при сроке > 1 года", sourceId: "my_gov_uz", sourceName: "Единый портал госуслуг my.gov.uz", url: "https://my.gov.uz", deadline_days: 1, required: true, action: "Проверить срок, назначение помещения, коммунальные услуги, доступ и ответственность сторон", sourceType: "advisory", confidence: "medium", reportText: "Для помещения нужен понятный договор аренды/субаренды с правом вести заявленную деятельность.", missingInfoQuestions: ["Есть ли проект договора аренды/субаренды?", "Что включено в инфраструктуру и коммунальные платежи?"] }),
  req({ id: "labor_contracts", category: "all", title: "Трудовые отношения", whenRequired: "Если есть сотрудники", authority: "Министерство занятости и сокращения бедности", action: "Оформить трудовые договоры/ГПХ, графики, охрану труда", sourceType: "official", sourceId: "employment_uz", sourceName: "Министерство занятости и сокращения бедности", confidence: "high", reportText: "При найме сотрудников нужно заранее оформить трудовые отношения, обязанности и ответственность." }),
  req({ id: "fire_safety", category: "all", title: "Заключение пожарного надзора", name_ru: "Заключение пожарного надзора", name_uz: "Yong'in xavfsizligi xulosasi", whenRequired: "Для помещений, оборудования и сотрудников", authority: "МЧС Республики Узбекистан — mchs.uz", organ_ru: "МЧС Республики Узбекистан — mchs.uz", sourceId: "mchs_uz", sourceName: "МЧС Республики Узбекистан", url: "https://favqulodda.uz", deadline_days: 14, required: true, action: "Проверить требования по пожарной безопасности, инструктажам и охране труда", sourceType: "advisory", confidence: "needs_verification", reportText: "Требования зависят от помещения и оборудования; их нужно подтвердить по официальным нормам и условиям аренды." }),
];

const categoryRequirements: DocumentRequirement[] = [
  req({ id: "service_quality_contracts", category: "services", title: "Договоры с клиентами и гарантия качества", whenRequired: "Для сервисных работ", action: "Подготовить форму заказа, акт выполненных работ, гарантийные условия", sourceType: "advisory", confidence: "medium", reportText: "Для услуг важно письменно фиксировать объем работ, цену, сроки и гарантию." }),
  req({ id: "tailoring_service_order_terms", category: "services", subcategory: "tailoring_alteration", title: "Бланк заказа и условия ремонта одежды", whenRequired: "До первых заказов", authority: "Юрист / бухгалтер / внутренний регламент ателье", action: "Подготовить форму заказа: описание изделия, объем работ, срок, цена, предоплата, условия примерки, гарантия и порядок претензий", sourceType: "advisory", confidence: "medium", reportText: "Для ателье важно письменно фиксировать, что именно клиент передал, какие работы согласованы, срок выполнения и условия исправления претензий.", missingInfoQuestions: ["Есть ли форма заказа/квитанции для клиента?", "Как фиксируются дефекты изделия до ремонта и согласованный срок?"] }),
  req({ id: "tailoring_mall_or_lease_agreement", category: "services", subcategory: "tailoring_alteration", title: "Договор с ТЦ или арендодателем", whenRequired: "До вложений в точку", authority: "Арендодатель / администрация ТЦ / юрист", action: "Проверить срок аренды, площадь, вывеску, график работы, коммунальные услуги, доступ клиентов, порядок приемки/выдачи одежды и условия расторжения", sourceType: "advisory", confidence: "medium", reportText: "Если ателье работает внутри ТЦ или партнерской локации, экономика зависит от договора, потока, режима работы и права принимать вещи клиентов на территории объекта.", missingInfoQuestions: ["Есть ли проект договора с ТЦ/арендодателем?", "Что включено в аренду: коммунальные услуги, охрана, доступ, вывеска?"] }),
  req({ id: "tailoring_cash_receipts", category: "services", subcategory: "tailoring_alteration", title: "Касса, чеки и акты по услугам ателье", whenRequired: "До первых оплат", authority: "Налоговый комитет Республики Узбекистан / бухгалтер", action: "Проверить онлайн-кассу, терминал, чеки B2C, акты для B2B-клиентов, учет предоплат и возвратов", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Оплата ремонта и подгонки одежды должна оформляться корректно: чеки, предоплаты, возвраты и акты должны совпадать с фактической выручкой." }),
  req({ id: "children_electric_car_mall_agreement", category: "entertainment", subcategory: "children_electric_car_rental", title: "Договор с ТЦ и правила размещения зоны катания", whenRequired: "До закупки машинок и запуска точки", authority: "Администрация ТЦ / арендодатель / юрист", action: "Письменно подтвердить место, площадь зоны, график работы, электричество/зарядку, хранение машинок, охрану, уборку, ответственность сторон и условия расторжения", sourceType: "advisory", confidence: "medium", reportText: "Для проката детских электромобилей внутри ТЦ ключевой документ — право использовать конкретную зону и условия работы. Без этого расчет по трафику и окупаемости ненадежен.", missingInfoQuestions: ["Есть ли проект договора с ТЦ?", "Какая площадь и границы зоны катания?", "Разрешена ли зарядка и хранение машинок на объекте?"] }),
  req({ id: "children_electric_car_safety_liability", category: "entertainment", subcategory: "children_electric_car_rental", title: "Правила безопасности детей и ответственность за ущерб", whenRequired: "До первых сессий проката", authority: "Юрист / администрация ТЦ / страховая организация", action: "Подготовить правила допуска детей, возраст/вес, контроль сотрудника, согласие родителей, инструктаж, порядок действий при травме или повреждении имущества", sourceType: "advisory", confidence: "needs_verification", reportText: "В детском прокате главный риск — безопасность ребенка и ответственность за травмы или ущерб. Требования нужно подтвердить с юристом и администрацией площадки.", missingInfoQuestions: ["Будет ли письменное согласие родителей?", "Кто отвечает за наблюдение во время сессии?", "Есть ли страховка или лимит ответственности?"] }),
  req({ id: "children_electric_car_cash_receipts", category: "entertainment", subcategory: "children_electric_car_rental", title: "Касса, чеки и учет аренды по сессиям", whenRequired: "До первых оплат", authority: "Налоговый комитет Республики Узбекистан / бухгалтер", action: "Проверить оформление оплаты за сессию, абонементы, возвраты, терминал/онлайн-кассу и ежедневную сверку количества поездок", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "В модели аренды по минутам или сессиям нужно связать фактические поездки, выручку, возвраты и кассовые документы." }),
  req({ id: "device_repair_intake_act", category: "services", subcategory: "device_repair", title: "Акт приема смартфона/устройства", whenRequired: "До первой приемки устройства", authority: "Юрист / бухгалтер / внутренний регламент сервиса", action: "Подготовить шаблон акта: клиент, телефон, IMEI/серийный номер, внешнее состояние, комплектация, пароль/доступ, заявленная неисправность, срок, цена диагностики и согласие на ремонт", sourceType: "advisory", confidence: "medium", reportText: "Для ремонта смартфонов акт приема защищает сервис и клиента: фиксирует состояние устройства до ремонта, комплектацию, заявленную неисправность и ответственность за данные.", missingInfoQuestions: ["Есть ли шаблон акта приема устройства?", "Фиксируются ли IMEI/серийный номер и состояние корпуса до ремонта?"] }),
  req({ id: "device_repair_warranty_policy", category: "services", subcategory: "device_repair", title: "Гарантийная политика на ремонт и запчасти", whenRequired: "До первых платных ремонтов", authority: "Юрист / бухгалтер / внутренний регламент сервиса", action: "Прописать срок гарантии на работу и запчасти, исключения после попадания воды/ударов, порядок повторного обращения и условия возврата денег", sourceType: "advisory", confidence: "medium", reportText: "В сервисе смартфонов гарантийные претензии напрямую влияют на маржу. Нужно заранее разделить гарантию на работу мастера, гарантию поставщика на запчасть и случаи, когда гарантия не действует.", missingInfoQuestions: ["Какой срок гарантии будет на работу?", "Как сервис обрабатывает брак запчасти и повторное обращение?"] }),
  req({ id: "device_repair_data_privacy", category: "services", subcategory: "device_repair", title: "Ответственность за данные клиента", whenRequired: "До приема устройств с личными данными", authority: "Юрист / внутренний регламент сервиса", action: "Зафиксировать правила доступа к устройству, резервного копирования, паролей, удаления данных и отказа от ответственности при ремонте после воды/памяти", sourceType: "advisory", confidence: "medium", reportText: "Смартфон содержит личные данные клиента. До запуска нужно письменно определить, кто имеет доступ к устройству, как фиксируется согласие клиента и что сервис не гарантирует без резервной копии.", missingInfoQuestions: ["Будет ли клиент подписывать согласие на доступ к устройству?", "Как сервис предупреждает о риске потери данных?"] }),
  req({ id: "device_repair_spare_parts_docs", category: "services", subcategory: "device_repair", title: "Документы поставщиков запчастей и аксессуаров", whenRequired: "До первой закупки запчастей", authority: "Поставщик / бухгалтер / таможенный брокер при импорте", action: "Получить накладные, прайс-листы, гарантийные условия поставщика, порядок обмена брака и подтверждение происхождения популярных запчастей", sourceType: "advisory", confidence: "medium", reportText: "Для ремонта смартфонов качество экранов, батарей и шлейфов определяет маржу и репутацию. Без документов и условий обмена брака гарантийные замены могут съесть прибыль.", missingInfoQuestions: ["Есть ли 2-3 поставщика запчастей?", "Можно ли вернуть или обменять бракованные экраны/батареи?"] }),
  req({ id: "device_repair_cash_b2b_docs", category: "services", subcategory: "device_repair", title: "Касса, чеки, B2B-договоры и акты", whenRequired: "До первых оплат", authority: "Налоговый комитет Республики Узбекистан / бухгалтер", action: "Проверить онлайн-кассу, терминал, чеки B2C, договоры и акты для корпоративных клиентов, а также раздельный учет ремонта и продажи аксессуаров", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Если сервис берет оплату за ремонт и отдельно продает аксессуары, учет должен разделять услугу, товар, гарантийную замену и возврат. Это влияет на выручку, остатки и налоговые документы." }),
  req({ id: "device_repair_used_phone_sales", category: "services", subcategory: "device_repair", title: "Документы при продаже б/у телефонов", whenRequired: "Если будут продаваться проверенные б/у телефоны", authority: "Юрист / бухгалтер / поставщик", action: "Подготовить форму закупки/приема б/у телефона, подтверждение права продажи, акт проверки состояния, гарантию и правила возврата", sourceType: "advisory", confidence: "needs_verification", reportText: "Продажа б/у телефонов отличается от ремонта: нужен источник происхождения устройства, состояние, гарантия и правила возврата. Иначе появляется риск претензий по собственности, скрытым дефектам и данным предыдущего владельца." }),
  req({ id: "tool_rental_contract_act", category: "services", subcategory: "tool_equipment_rental", title: "Договор аренды инструмента и акт приема-передачи", whenRequired: "До первой выдачи инструмента", authority: "Юрист / бухгалтер", action: "Подготовить договор аренды, акт выдачи/возврата, правила залога, просрочки и ответственности за повреждение", sourceType: "advisory", confidence: "medium", reportText: "Для проката инструмента важно письменно фиксировать комплектность, состояние, срок возврата, залог, штрафы и ответственность клиента. Без акта приема-передачи сложно доказать повреждение или невозврат.", missingInfoQuestions: ["Есть ли форма договора аренды инструмента?", "Будет ли акт выдачи/возврата с состоянием инструмента?", "Как удерживается залог при повреждении?"] }),
  req({ id: "tool_rental_cash_receipts", category: "services", subcategory: "tool_equipment_rental", title: "Касса, чеки и учет залога", whenRequired: "До первых оплат", authority: "Налоговый комитет / бухгалтер", action: "Проверить оформление оплаты аренды, залога, возврата залога, терминала/онлайн-кассы и актов для B2B", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "В модели аренды нужно разделить доход от аренды и возвратный залог, а также корректно оформлять B2C-чеки и B2B-договоры/акты." }),
  req({ id: "tool_rental_storage_safety", category: "services", subcategory: "tool_equipment_rental", title: "Безопасное хранение и инструктаж по инструменту", whenRequired: "До запуска склада/пункта выдачи", authority: "Работодатель / профильный консультант", action: "Подготовить правила хранения, проверки исправности, инструктаж клиента, СИЗ и порядок вывода неисправного инструмента из аренды", sourceType: "advisory", confidence: "medium", reportText: "Инструмент создает риск травм и претензий, если клиент не получил инструкцию или инструмент был неисправен. Нужен чек-лист проверки и понятные правила использования." }),
  req({ id: "car_wash_water_drainage", category: "services", subcategory: "car_wash", title: "Вода, канализация и стоки автомойки", whenRequired: "До запуска автомойки и монтажа оборудования", authority: "Арендодатель / коммунальные службы / экологические требования", action: "Письменно подтвердить источник воды, допустимый слив, фильтрацию/очистку сточных вод и ответственность за нарушения", sourceType: "official", sourceId: "ecology_uz", sourceName: "Экологические и коммунальные требования", confidence: "needs_verification", reportText: "Для автомойки главный compliance-риск — вода и сточные воды. До запуска нужно подтвердить, куда уходит вода после мойки, нужна ли фильтрация, кто отвечает за подключение и какие требования включены в договор аренды.", missingInfoQuestions: ["Есть ли разрешенный слив/канализация?", "Нужны ли фильтры или система оборотной воды?", "Кто отвечает за коммунальные подключения?"] }),
  req({ id: "car_wash_lease_activity", category: "services", subcategory: "car_wash", title: "Договор аренды с правом автомойки", whenRequired: "Если точка арендуется", authority: "Собственник / арендодатель / юрист", action: "Закрепить в договоре право вести автомойку, график, воду, слив, электричество, вывеску, парковку и ответственность сторон", sourceType: "advisory", confidence: "medium", reportText: "Обычный договор аренды помещения недостаточен, если в нем не разрешены вода, слив, химия, шум, очередь автомобилей и вывеска. Эти условия нужно прописать до закупки оборудования.", missingInfoQuestions: ["Разрешена ли автомойка именно в этом помещении?", "Что включено в аренду: вода, электричество, слив, парковка?", "Можно ли разместить вывеску?"] }),
  req({ id: "car_wash_cash_documents", category: "services", subcategory: "car_wash", title: "Касса, чеки, B2B-договоры и акты", whenRequired: "До первых продаж", authority: "Налоговый комитет / бухгалтер", action: "Проверить онлайн-кассу, терминал, чеки для B2C, договоры и акты для автопарков/корпоративных клиентов", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Для автомойки нужно заранее разделить B2C-оплату с чеком и B2B-обслуживание по договору/акту, особенно если планируются таксопарки, доставка или корпоративные клиенты." }),
  req({ id: "car_wash_labor_safety_chemicals", category: "services", subcategory: "car_wash", title: "Охрана труда и безопасное хранение автохимии", whenRequired: "Если есть сотрудники и автохимия", authority: "Работодатель / профильный консультант", action: "Подготовить инструкции по оборудованию высокого давления, электричеству, скользким зонам, СИЗ и хранению химии", sourceType: "advisory", confidence: "medium", reportText: "Автомойка несет операционный риск из-за воды, электричества, давления, химии и скользких поверхностей. Нужны инструкции, СИЗ, обучение сотрудников и зона хранения автохимии." }),
  req({ id: "auto_service_waste_oil", category: "services", subcategory: "auto_service", title: "Обращение с отработанным маслом и отходами", whenRequired: "Если сервис меняет масло, фильтры или расходники", authority: "Экологические органы / арендодатель", action: "Проверить порядок сбора, хранения и передачи отходов лицензированному оператору", sourceType: "official", sourceId: "ecology_uz", sourceName: "Национальный комитет по экологии и изменению климата", confidence: "needs_verification", reportText: "Для автосервиса экологический риск выше из-за масел, фильтров и технических жидкостей; порядок обращения с отходами нужно подтвердить официально.", missingInfoQuestions: ["Кто отвечает за отработанное масло: арендодатель или ваш бокс?", "Есть ли договор на вывоз/утилизацию отходов?"] }),
  req({ id: "auto_service_box_sublease", category: "services", subcategory: "auto_service", operationalModel: "inside_partner_location", title: "Договор аренды/субаренды одного бокса", whenRequired: "Если автосервис работает как один бокс внутри большой СТО", authority: "Собственник/основной арендатор / юрист", action: "Закрепить письменный договор, срок, продление, инфраструктуру, комиссию, право вывески, доступ к клиентам и условия расторжения", sourceType: "advisory", sourceId: "my_gov_uz", sourceName: "Единый портал интерактивных государственных услуг", confidence: "medium", reportText: "Для формата одного бокса ключевой документ - договор аренды/субаренды. Его срок желательно согласовать со сроком окупаемости оборудования, кредита или лизинга.", missingInfoQuestions: ["Есть ли письменный договор?", "Разрешена ли субаренда?", "Срок договора покрывает окупаемость?", "Что включено в инфраструктуру?"] }),
  req({ id: "auto_service_allowed_works", category: "services", subcategory: "auto_service", title: "Разрешенные виды работ на территории сервиса", whenRequired: "Если есть ограничения по шумным, грязным, химическим, кузовным или газовым работам", authority: "Арендодатель / license.gov.uz / профильный консультант", action: "Проверить, разрешены ли выбранные услуги: замена масла, диагностика, ходовая, тормоза, газовое оборудование, кузовные/покрасочные работы или изменение конструкции", sourceType: "official", sourceId: "license_gov_uz", sourceName: "Система электронного лицензирования", confidence: "needs_verification", reportText: "Если в перечне услуг есть изменение конструкции, газовое оборудование, покраска, сварка или химические работы, нужно отдельно проверить разрешительный режим и ограничения помещения.", missingInfoQuestions: ["Будут ли работы по изменению конструкции?", "Будет ли газовое оборудование?", "Будут ли покраска/сварка/химия?", "Есть ли письменное разрешение арендодателя?"] }),
  req({ id: "auto_service_payment_cashier", category: "services", subcategory: "auto_service", title: "Прием оплаты, касса и перечисление доли", whenRequired: "Если оплату принимает предприниматель, общий администратор или большой автосервис", authority: "Налоговый комитет / арендодатель", action: "Закрепить, кто принимает оплату, как оформляются чеки/акты, какая комиссия площадки и когда перечисляется доля бокса", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Для бокса внутри большого сервиса важно заранее разделить денежный поток: прямая оплата предпринимателю, касса большого сервиса или смешанная модель.", missingInfoQuestions: ["Кто принимает оплату?", "Какая комиссия большого сервиса?", "Когда перечисляется доля?", "Кто оформляет чек/акт?"] }),
  req({ id: "auto_service_warranty_order", category: "services", subcategory: "auto_service", title: "Заказ-наряд, акт работ и гарантия клиенту", whenRequired: "Для любых сервисных работ с автомобилем", action: "Подготовить форму заказ-наряда, акт выполненных работ, гарантийные условия и ответственность за детали/работы", sourceType: "advisory", confidence: "medium", reportText: "Автосервис должен фиксировать перечень работ, цену, запчасти, ответственность и гарантию, чтобы снизить спорные ситуации с клиентами.", missingInfoQuestions: ["Есть ли форма заказ-наряда?", "Какая гарантия на работы?", "Кто отвечает за качество деталей?"] }),
  req({ id: "food_sanitary", category: "food_service", title: "Санитарные требования для кухни и пищевых продуктов", whenRequired: "До открытия food service", authority: "Комитет санитарно-эпидемиологического благополучия", action: "Проверить требования к кухне, хранению, персоналу и производственному потоку", sourceType: "official", sourceId: "sanepid_uz", sourceName: "Комитет санитарно-эпидемиологического благополучия и общественного здоровья", confidence: "needs_verification", reportText: "Для кафе/ресторана санитарные требования являются критическим условием запуска; конкретный список нужно проверить по официальным источникам." }),
  req({ id: "ice_cream_trailer_location_permit", category: "food_service", subcategory: "ice_cream_mobile_trailer", title: "Право размещения трейлера и торговой точки", whenRequired: "До покупки/вывода трейлера на точку", authority: "Хокимият / собственник площадки / арендодатель", action: "Письменно подтвердить место стоянки, срок, плату, электричество/генератор, воду, режим работы и право торговли", sourceType: "advisory", confidence: "needs_verification", reportText: "Для мобильного трейлера мороженого ключевой документ — право стоять и продавать именно в выбранной точке. Без договора или разрешения расчет по трафику нельзя считать подтвержденным.", missingInfoQuestions: ["Есть ли договор или разрешение на место?", "Что включено: электричество, вода, охрана, уборка?", "Разрешена ли продажа пищевых продуктов?"] }),
  req({ id: "ice_cream_sanitary_cold_chain", category: "food_service", subcategory: "ice_cream_mobile_trailer", title: "Санитарные требования и холодовая цепь", whenRequired: "До первых продаж", authority: "Санитарно-эпидемиологическая служба / профильный консультант", action: "Проверить требования к хранению мороженого, температурному режиму, воде, персоналу, медкнижкам/санитарным правилам и обработке оборудования", sourceType: "official", sourceId: "sanepid_uz", sourceName: "Комитет санитарно-эпидемиологического благополучия и общественного здоровья", confidence: "needs_verification", reportText: "Для мороженого риск связан с температурным режимом, водой/мойкой, чистотой оборудования и документами поставщика. Требования нужно подтвердить до закупки сырья и запуска точки.", missingInfoQuestions: ["Как контролируется температура?", "Кто поставщик мороженого/смеси и есть ли документы?", "Как организованы вода и санитарная обработка?"] }),
  req({ id: "ice_cream_cash_supplier_docs", category: "food_service", subcategory: "ice_cream_mobile_trailer", title: "Касса, терминал и документы поставщика", whenRequired: "До первых продаж", authority: "Налоговый комитет / бухгалтер", action: "Проверить онлайн-кассу или терминал, чеки, товарные накладные, документы поставщика и учет списаний", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Для точки мороженого нужно заранее оформить кассовую дисциплину, документы на сырье и порядок списаний, чтобы финансовая модель не расходилась с фактическим учетом." }),
  req({ id: "manufacturing_product_certification", category: "manufacturing", title: "Сертификация/соответствие продукции", whenRequired: "Если продукт подлежит обязательным требованиям", action: "Проверить требования к сертификации, маркировке, упаковке и безопасности продукции", sourceType: "legal", sourceId: "lex_uz", sourceName: "Национальная база законодательства lex.uz", confidence: "needs_verification", reportText: "Для производства требования зависят от вида продукции; нельзя считать продукт готовым к продаже без проверки сертификации и маркировки." }),
  req({ id: "manufacturing_environment", category: "manufacturing", title: "Экология, отходы и производственная безопасность", whenRequired: "Если есть отходы, шум, пыль, химия, энергопотребление", authority: "Экологические и профильные органы", action: "Проверить требования к отходам, вентиляции, безопасности оборудования и помещению", sourceType: "official", sourceId: "ecology_uz", sourceName: "Национальный комитет по экологии и изменению климата", confidence: "needs_verification", reportText: "Производственный процесс может создавать экологические и safety-риски; их нужно отдельно закрыть до запуска." }),
  req({ id: "retail_cash_and_goods", category: "retail", title: "Касса, товарные документы и возвраты", whenRequired: "До начала розничных продаж", authority: "Налоговый комитет", action: "Проверить онлайн-кассу, документы поставщиков, учет остатков и правила возврата", sourceType: "official", sourceId: "tax_uz", sourceName: "Налоговый комитет Республики Узбекистан", confidence: "high", reportText: "Для розницы критичны товарные документы, кассовая дисциплина, учет остатков и прозрачная маржа." }),
  req({ id: "ecommerce_payments_delivery", category: "ecommerce", title: "Онлайн-платежи, доставка и возвраты", whenRequired: "До запуска онлайн-продаж", action: "Проверить оферту, платежные документы, доставку, возвраты и обработку данных клиентов", sourceType: "advisory", confidence: "medium", reportText: "Онлайн-торговля требует заранее описать условия оплаты, доставки, возвратов и обработки клиентских данных." }),
  req({ id: "import_export_customs", category: "import_export", title: "Таможня, контракт, сертификация и валюта", whenRequired: "До заключения внешнеторгового контракта", authority: "Таможенный комитет / Центральный банк / профильные органы", action: "Проверить TN VED/HS code, Incoterms, сертификаты, валюту и платежные условия", sourceType: "official", sourceId: "customs_uz", sourceName: "Таможенный комитет Республики Узбекистан", confidence: "needs_verification", reportText: "Для импорта/экспорта документы, таможня и валюта формируют основной compliance и FX-risk." }),
  req({ id: "agriculture_land_vet_phyto", category: "agriculture", title: "Земля, вода, ветеринарные/фитосанитарные требования", whenRequired: "До агропроизводства", authority: "Министерство сельского хозяйства / профильные органы", action: "Проверить право пользования землей/теплицей, воду, ветеринарные или фитосанитарные требования", sourceType: "official", sourceId: "agriculture_ministry_uz", sourceName: "Министерство сельского хозяйства", confidence: "needs_verification", reportText: "В агробизнесе документы зависят от земли, воды, культуры/животных и каналов сбыта." }),
  req({ id: "logistics_transport_documents", category: "logistics", title: "Транспортные разрешения, страховка и путевые документы", whenRequired: "До перевозок", authority: "Министерство транспорта / страховые организации", action: "Проверить разрешения, страховку, документы водителей, маршрутные и путевые документы", sourceType: "official", sourceId: "transport_ministry_uz", sourceName: "Министерство транспорта", confidence: "needs_verification", reportText: "Для логистики важны документы на транспорт, водителей, страхование и безопасность перевозок." }),
  req({ id: "education_license_children", category: "education", title: "Лицензирование/уведомления и безопасность учащихся", whenRequired: "Если деятельность подпадает под регулируемые образовательные услуги", authority: "Система лицензирования / образовательные органы", action: "Проверить, требуется ли лицензия/уведомление, требования к помещению и персоналу", sourceType: "official", sourceId: "license_gov_uz", sourceName: "Система электронного лицензирования", confidence: "needs_verification", reportText: "Для образовательного проекта нужно подтвердить, является ли программа регулируемой и какие требования к помещению/преподавателям применяются." }),
  req({ id: "healthcare_license", category: "healthcare", title: "Медицинская лицензия, персонал, оборудование и медотходы", whenRequired: "До оказания медицинских услуг", authority: "Министерство здравоохранения / система лицензирования", action: "Проверить лицензию, квалификацию персонала, требования к помещению, медоборудованию и отходам", sourceType: "official", sourceId: "health_ministry_uz", sourceName: "Министерство здравоохранения", confidence: "needs_verification", reportText: "Healthcare-проект относится к регулируемым видам деятельности; compliance-risk высокий до подтверждения лицензии и требований." }),
  req({ id: "construction_permits", category: "construction", title: "Разрешения, проектная документация и строительные нормы", whenRequired: "До строительных работ", authority: "Министерство строительства и ЖКХ / профильные органы", action: "Проверить необходимость разрешений, проектной документации, норм безопасности и договоров", sourceType: "official", sourceId: "construction_ministry_uz", sourceName: "Министерство строительства и ЖКХ", confidence: "needs_verification", reportText: "Для строительных проектов нужно отдельно подтвердить разрешительный режим, проектную документацию и ответственность подрядчиков." }),
  req({ id: "beauty_sanitary", category: "beauty_wellness", title: "Санитарные требования, расходники и безопасность услуг", whenRequired: "До открытия салона/барбершопа/SPA", authority: "Санитарные органы", action: "Проверить требования к помещению, инструментам, стерилизации, расходникам и персоналу", sourceType: "official", sourceId: "sanepid_uz", sourceName: "Комитет санитарно-эпидемиологического благополучия", confidence: "needs_verification", reportText: "В beauty/wellness санитарные процедуры и качество расходников напрямую влияют на compliance и репутационный риск." }),
];

export const documentsRegistry = [...generalRequirements, ...categoryRequirements];

function isChildrenClothingProfile(profile: BusinessProfile, input: BusinessProfile | Partial<StructuredProjectData>): boolean {
  const data = input as Partial<StructuredProjectData>;
  const text = `${profile.subcategory ?? ""} ${data.businessType ?? ""} ${data.businessIdea ?? ""}`;
  return profile.subcategory === "children_clothing_store" || /детск.*одежд|одежд.*детск|children.*clothing|kids.*clothing|bolalar.*kiyim/i.test(text);
}

function childrenClothingRetailRequirements(): DocumentRequirement[] {
  return [
    req({
      id: "retail_clothing_registration_choice",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Регистрация ИП или ООО",
      whenRequired: "До подписания аренды и первых продаж",
      authority: "Единый портал интерактивных государственных услуг / my.gov.uz",
      action: "Выбрать ИП или ООО с учетом кредита, сотрудников, ответственности и будущих поставщиков",
      sourceType: "official",
      sourceId: "my_gov_uz",
      sourceName: "Единый портал интерактивных государственных услуг",
      confidence: "high",
      reportText: "Выбрать одну форму регистрации: ИП подходит для одного владельца и простого запуска, ООО практичнее при кредите, партнерах, сотрудниках и повышенной ответственности."
    }),
    req({
      id: "retail_clothing_tax_regime",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Налоговый учёт и налоговый режим",
      whenRequired: "До первых продаж",
      authority: "Налоговый комитет Республики Узбекистан / soliq.uz",
      action: "Проверить постановку на учет, режим налогообложения, чеки и электронные документы",
      sourceType: "official",
      sourceId: "tax_uz",
      sourceName: "Налоговый комитет Республики Узбекистан",
      confidence: "high",
      reportText: "До открытия нужно подтвердить налоговый режим, порядок оформления розничных продаж, чеков, возвратов и платежных документов."
    }),
    req({
      id: "retail_clothing_online_kassa_pos",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Онлайн-касса / фискальный модуль / POS",
      whenRequired: "До приема оплаты от покупателей",
      authority: "Налоговый комитет Республики Узбекистан / soliq.uz",
      action: "Подключить онлайн-кассу, POS-терминал и связать продажи с товарным учетом",
      sourceType: "official",
      sourceId: "tax_uz",
      sourceName: "Налоговый комитет Республики Узбекистан",
      confidence: "high",
      reportText: "Для магазина детской одежды касса должна корректно отражать продажи, возвраты, скидки и движение остатков по размерам."
    }),
    req({
      id: "retail_clothing_lease_agreement",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Договор аренды торговой точки",
      whenRequired: "До ремонта, завоза товара и открытия",
      authority: "Арендодатель / юрист / my.gov.uz для сопутствующих услуг",
      action: "Проверить срок аренды, назначение помещения, вывеску, коммунальные платежи, доступ покупателей и право розничной торговли",
      sourceType: "advisory",
      sourceId: "my_gov_uz",
      sourceName: "Единый портал интерактивных государственных услуг",
      confidence: "medium",
      reportText: "Договор аренды должен прямо разрешать розничную торговлю детской одеждой, вывеску, хранение товара, режим работы и условия расторжения."
    }),
    req({
      id: "retail_clothing_supplier_invoices",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Товарные накладные и документы поставщика",
      whenRequired: "До первой закупки и каждой поставки",
      authority: "Поставщик / бухгалтер / Налоговый комитет",
      action: "Получить договор или счет, накладные, документы оплаты, артикулы/размеры и условия возврата брака",
      sourceType: "official",
      sourceId: "tax_uz",
      sourceName: "Налоговый комитет Республики Узбекистан",
      confidence: "high",
      reportText: "Документы поставщика подтверждают себестоимость, наличие товара, маржу, остатки и возможность обмена брака или неполного размерного ряда."
    }),
    req({
      id: "retail_clothing_import_origin",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Документы происхождения импортного товара",
      whenRequired: "Если закупки идут из Турции, Китая или через импортера",
      authority: "Таможенный комитет / customs.uz / поставщик",
      action: "Проверить контракт, инвойс, таможенные документы, валюту цены и легальность ввоза",
      sourceType: "official",
      sourceId: "customs_uz",
      sourceName: "Таможенный комитет Республики Узбекистан",
      confidence: "needs_verification",
      reportText: "Для импортного ассортимента нужно подтвердить происхождение товара, валюту закупки, таможенное оформление и риск изменения курса."
    }),
    req({
      id: "retail_clothing_labeling_storage",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Маркировка, состав ткани, размер и хранение",
      whenRequired: "До выкладки товара в зал",
      authority: "lex.uz / поставщик / профильный консультант",
      action: "Проверить этикетки, состав ткани, размер, страну происхождения, условия хранения и комплектность партии",
      sourceType: "legal",
      sourceId: "lex_uz",
      sourceName: "Национальная база законодательства Республики Узбекистан",
      confidence: "needs_verification",
      reportText: "Для детской одежды критичны корректная информация на этикетке, размерная сетка, состав ткани, хранение и отсутствие дефектов до продажи."
    }),
    req({
      id: "retail_clothing_returns_policy",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Правила обмена и возврата для розничной торговли",
      whenRequired: "До первых продаж",
      authority: "lex.uz / органы защиты прав потребителей / бухгалтер",
      action: "Описать обмен размера, возврат брака, чек, упаковку, сроки и отражение возврата в кассе",
      sourceType: "legal",
      sourceId: "lex_uz",
      sourceName: "Национальная база законодательства Республики Узбекистан",
      confidence: "needs_verification",
      reportText: "Правила возврата и обмена должны быть понятны покупателю и связаны с кассой/POS, чтобы не искажать выручку и остатки."
    }),
    req({
      id: "retail_clothing_labor_documents",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Трудовые договоры и кадровые документы",
      whenRequired: "До выхода продавцов и администратора",
      authority: "Министерство занятости / mehnat.uz",
      action: "Оформить продавцов, администратора-кассира, график, материальную ответственность и инструкции по возвратам",
      sourceType: "official",
      sourceId: "mehnat_uz",
      sourceName: "Министерство занятости Республики Узбекистан",
      confidence: "high",
      reportText: "Кадровые документы должны закрыть график, обязанности, ответственность за кассу, товарные остатки и работу с возвратами."
    }),
    req({
      id: "retail_clothing_fire_electric_safety",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Пожарная безопасность, электрика и эвакуация",
      whenRequired: "До открытия точки для покупателей",
      authority: "МЧС / favqulodda.uz / арендодатель",
      action: "Проверить требования ТЦ/арендодателя, эвакуацию, электрику, освещение, примерочную и хранение товара",
      sourceType: "official",
      sourceId: "mchs_uz",
      sourceName: "Министерство по чрезвычайным ситуациям Республики Узбекистан",
      confidence: "needs_verification",
      reportText: "Точка должна соответствовать требованиям пожарной безопасности, электрики, эвакуации и условиям арендодателя до допуска покупателей."
    }),
    req({
      id: "retail_clothing_fitting_room_security",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Безопасность примерочной и видеонаблюдение",
      whenRequired: "Если есть примерочная и доступ покупателей к товару",
      authority: "Арендодатель / юрист / внутренний регламент",
      action: "Проверить безопасность примерочной, зону хранения личных вещей, предотвращение краж и соблюдение приватности",
      sourceType: "advisory",
      sourceId: "lex_uz",
      sourceName: "Национальная база законодательства Республики Узбекистан",
      confidence: "medium",
      reportText: "Примерочная и зал должны быть организованы так, чтобы снизить потери товара, сохранить приватность покупателей и не создавать конфликтов с родителями."
    }),
    req({
      id: "retail_clothing_pos_inventory_service",
      category: "retail",
      subcategory: "children_clothing_store",
      title: "Договор обслуживания кассы/POS/складской системы",
      whenRequired: "До запуска учета и продаж",
      authority: "Поставщик кассы/POS / бухгалтер",
      action: "Заключить договор или тариф на обслуживание кассы, POS, складского учета, резервного копирования и отчетности",
      sourceType: "advisory",
      sourceId: "tax_uz",
      sourceName: "Налоговый комитет Республики Узбекистан",
      confidence: "medium",
      reportText: "Для контроля размера, остатков, возвратов и маржи нужен работоспособный POS/складской учет с поддержкой и резервным копированием."
    })
  ];
}

function profileFromInput(input: BusinessProfile | Partial<StructuredProjectData>): BusinessProfile {
  if ("confidence" in input && "category" in input && "relevantInterviewBlocks" in input) {
    return input as BusinessProfile;
  }
  const data = input as Partial<StructuredProjectData>;
  return classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, language: data.userLanguage, answers: data });
}

export function getDocumentRequirements(input: BusinessProfile | Partial<StructuredProjectData>): DocumentRequirement[] {
  const profile = profileFromInput(input);
  if (isChildrenClothingProfile(profile, input)) {
    return childrenClothingRetailRequirements();
  }
  const documentCategories = new Set((profile.documentCategories ?? []).map((item) => item.toLowerCase()));
  const matched = documentsRegistry.filter((item) => {
    if (item.category === "all") return true;
    if (item.category === profile.category) {
      if (item.subcategory && item.subcategory !== profile.subcategory) return false;
      if (item.operationalModel && item.operationalModel !== profile.operationalModel) return false;
      return true;
    }
    if (documentCategories.has(item.id.toLowerCase()) || documentCategories.has(item.category.toLowerCase())) return true;
    if (profile.subcategory && item.subcategory === profile.subcategory) return true;
    return false;
  });
  return Array.from(new Map(matched.map((item) => [item.id, item])).values());
}
