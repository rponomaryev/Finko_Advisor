import type { Locale } from "../types/project.ts";

export type UserFacingLocale = Extract<Locale, "ru" | "uz" | "en">;

type Replacement = { pattern: RegExp; ru: string; uz: string; en?: string; term: string };

// Ordered from specific phrases to shorter tokens to avoid partial replacements.
const replacements: Replacement[] = [
  { term: "Single Portal of Interactive Public Services", pattern: /\bSingle\s+Portal\s+of\s+Interactive\s+Public\s+Services\b/gi, ru: "Единый портал интерактивных государственных услуг", uz: "Yagona interaktiv davlat xizmatlari portali", en: "Single Portal of Interactive Public Services"},
  { term: "services_tailoring_alteration", pattern: /\bservices_tailoring_alteration\b/gi, ru: "Услуги: ремонт и подгонка одежды", uz: "Xizmatlar: kiyim ta'miri va moslashtirish", en: "Services: tailoring and clothing alteration" },
  { term: "services_bike_scooter_rental", pattern: /\bservices_bike_scooter_rental\b/gi, ru: "Услуги: прокат велосипедов и самокатов", uz: "Xizmatlar: velosiped va samokat ijarasi", en: "Services: bike and scooter rental" },
  { term: "bike_scooter_rental", pattern: /\bbike_scooter_rental\b/gi, ru: "Прокат велосипедов и самокатов", uz: "Velosiped va samokat ijarasi", en: "Bike and scooter rental" },
  { term: "asset_rental_service", pattern: /\basset_rental_service\b/gi, ru: "Сервис проката активов", uz: "Aktivlar ijarasi xizmati", en: "Asset rental service" },
  { term: "rental_session", pattern: /\brental_session\b/gi, ru: "Сессия проката", uz: "Ijara sessiyasi", en: "Rental session" },
  { term: "rental_sessions", pattern: /\brental_sessions\b/gi, ru: "Сессии проката", uz: "Ijara sessiyalari", en: "Rental sessions" },
  { term: "rental_sessions_per_month", pattern: /\brental_sessions_per_month\b/gi, ru: "Сессии проката в месяц", uz: "Oyiga ijara sessiyalari", en: "Rental sessions per month" },
  { term: "asset_purchase_capex", pattern: /\basset_purchase_capex\b/gi, ru: "Покупка парка активов", uz: "Aktivlar parkini xarid qilish", en: "Asset fleet purchase" },
  { term: "maintenance_repairs", pattern: /\bmaintenance_repairs\b/gi, ru: "Обслуживание и ремонт", uz: "Texnik xizmat va ta'mirlash", en: "Maintenance and repairs" },
  { term: "charging_or_storage", pattern: /\bcharging_or_storage\b/gi, ru: "Зарядка или хранение", uz: "Zaryadlash yoki saqlash", en: "Charging or storage" },
  { term: "location_fee", pattern: /\blocation_fee\b/gi, ru: "Плата за локацию", uz: "Joy uchun to'lov", en: "Location fee" },
  { term: "utilization_rate", pattern: /\butilization_rate\b/gi, ru: "Загрузка парка", uz: "Park yuklanishi", en: "Utilization rate" },
  { term: "asset_damage", pattern: /\basset_damage\b/gi, ru: "Повреждение активов", uz: "Aktiv shikastlanishi", en: "Asset damage" },
  { term: "safety_liability", pattern: /\bsafety_liability\b/gi, ru: "Безопасность и ответственность", uz: "Xavfsizlik va javobgarlik", en: "Safety and liability" },
  { term: "insurance_or_liability", pattern: /\binsurance_or_liability\b/gi, ru: "Страхование или ответственность", uz: "Sug'urta yoki javobgarlik", en: "Insurance or liability" },
  { term: "staff_payroll", pattern: /\bstaff_payroll\b/gi, ru: "Фонд оплаты труда", uz: "Ish haqi fondi", en: "Staff payroll" },
  { term: "Raw enum mixed", pattern: /\bmixed\b/gi, ru: "Смешанное", uz: "Aralash", en: "Mixed" },
  { term: "Raw enum used", pattern: /\bused\b/gi, ru: "Б/у", uz: "Ishlatilgan", en: "Used" },
  { term: "Raw enum new", pattern: /\bnew\b/gi, ru: "Новое", uz: "Yangi", en: "New" },
  { term: "Raw enum individuals", pattern: /\bindividuals\b/gi, ru: "Физические лица", uz: "Jismoniy shaxslar", en: "Individuals" },
  { term: "Raw enum men", pattern: /\bmen\b/gi, ru: "Мужчины", uz: "Erkaklar", en: "Men" },
  { term: "Raw enum women", pattern: /\bwomen\b/gi, ru: "Женщины", uz: "Ayollar", en: "Women" },
  { term: "Raw enum families", pattern: /\bfamilies\b/gi, ru: "Семьи", uz: "Oilalar", en: "Families" },
  { term: "Raw enum nearbyResidents", pattern: /\bnearbyResidents\b/gi, ru: "Жители рядом", uz: "Yaqin atrofdagi aholi", en: "Nearby residents" },
  { term: "Raw enum officeEmployees", pattern: /\bofficeEmployees\b/gi, ru: "Офисные сотрудники", uz: "Ofis xodimlari", en: "Office employees" },
  { term: "Raw enum recommendations", pattern: /\brecommendations\b/gi, ru: "Рекомендации", uz: "Tavsiyalar", en: "Recommendations" },
  { term: "Raw enum partners", pattern: /\bpartners\b/gi, ru: "Партнёры", uz: "Hamkorlar", en: "Partners" },
  { term: "Raw enum maps", pattern: /\bmaps\b/gi, ru: "2GIS / Google / Yandex карты", uz: "2GIS / Google / Yandex xaritalari", en: "2GIS / Google / Yandex Maps" },
  { term: "No sample reached confidence threshold", pattern: /\bNo\s+sample\s+reached\s+confidence\s+threshold;?\s*AI\s+fallback\s+required\b/gi, ru: "Подходящий шаблон не найден с достаточной уверенностью; данные нужно подтвердить", uz: "Yetarli ishonch bilan mos namuna topilmadi; sun'iy intellekt tasnifini tekshirish kerak" },
  { term: "AI fallback required", pattern: /\bAI\s+fallback\s+required\b/gi, ru: "данные нужно подтвердить", uz: "sun'iy intellekt tasnifini tekshirish kerak" },
  { term: "Verified contextual source", pattern: /Проверенный\s+контекстный\s+источник/gi, ru: "Официальная статистика", uz: "Rasmiy statistika" },
  { term: "Official statistics phrase", pattern: /\bOfficial\s+statistics\b/gi, ru: "Официальная статистика", uz: "Rasmiy statistika" },
  { term: "Official data phrase", pattern: /\bOfficial\s+data\b/gi, ru: "Официальные данные", uz: "Rasmiy ma'lumotlar" },
  { term: "Data status placeholder", pattern: /Статус\s+данных:\s+показатель/gi, ru: "Статус данных: данные нужно подтвердить", uz: "Ma'lumot holati: qo'lda tekshirish kerak" },

  { term: "new business", pattern: /\bnew\s+business\b/gi, ru: "новый бизнес", uz: "yangi biznes" },
  { term: "new placeholder", pattern: /\bnew\s+показатель\b/gi, ru: "новый проект", uz: "yangi loyiha" },

  { term: "B2B/B2C analytical services", pattern: /\bB2B\s*\/\s*B2C\s+analytical\s+services\b/gi, ru: "корпоративные и розничные аналитические услуги", uz: "korporativ va chakana mijozlar uchun tahliliy xizmatlar" },
  { term: "B2B contracts", pattern: /\bB2B[- ]contracts\b/gi, ru: "корпоративные договоры", uz: "korporativ shartnomalar" },
  { term: "B2B/B2C", pattern: /\bB2B\s*\/\s*B2C\b/gi, ru: "корпоративные и розничные клиенты", uz: "korporativ va chakana mijozlar" },
  { term: "B2B", pattern: /\bB2B\b/gi, ru: "корпоративные клиенты", uz: "korporativ mijozlar" },
  { term: "B2C", pattern: /\bB2C\b/gi, ru: "розничные клиенты", uz: "chakana mijozlar" },

  { term: "Supplier currency mixed", pattern: /Валюта\s+поставщика:\s*mixed/gi, ru: "Валюта поставщика: смешанная", uz: "Yetkazib beruvchi valyutasi: aralash" },
  { term: "Supplier currency mixed raw", pattern: /\bSupplier\s+currency\s+mixed\b/gi, ru: "Валюта поставщика: смешанная", uz: "Yetkazib beruvchi valyutasi: aralash" },
  { term: "mixed supplier currency", pattern: /mixed\s+supplier\s+currency/gi, ru: "смешанная валюта поставщика", uz: "yetkazib beruvchi valyutasi aralash" },

  { term: "low_ebitda_margin", pattern: /\blow_ebitda_margin\b/gi, ru: "Низкая EBITDA-маржа", uz: "Past EBITDA marjasi" },
  { term: "low_dscr_bank_readiness", pattern: /\blow_dscr_bank_readiness\b/gi, ru: "Низкое покрытие долга", uz: "Qarz qoplamasi past" },

  { term: "Low ebitda margin", pattern: /\bLow\s+ebitda\s+margin\b/gi, ru: "Низкая EBITDA-маржа", uz: "Past EBITDA marjasi" },
  { term: "Low dscr bank readiness", pattern: /\bLow\s+dscr\s+bank\s+readiness\b/gi, ru: "Низкое покрытие долга", uz: "Qarz qoplamasi past" },
  { term: "EBITDA margin is below", pattern: /\bEBITDA\s+margin\s+is\s+below\s+5%/gi, ru: "EBITDA-маржа ниже 5%", uz: "EBITDA marjasi 5% dan past" },
  { term: "DSCR is below", pattern: /\bDSCR\s+is\s+below\s+1\.2/gi, ru: "DSCR ниже 1,2", uz: "DSCR 1,2 dan past" },
  { term: "DSCR high indicator", pattern: /\bDscr\s+high\s+(?:indicator|показатель)(?=\s|$)|\bDSCR\s+high\s+(?:indicator|показатель)(?=\s|$)|\bdscr_high_indicator\b/gi, ru: "DSCR: высокий показатель", uz: "DSCR: yuqori ko'rsatkich" },
  { term: "DSCR high", pattern: /\bDscr\s+high\b|\bDSCR\s+high\b|\bdscr_high\b/gi, ru: "Высокий показатель DSCR", uz: "Yuqori DSCR ko'rsatkichi" },

  { term: "Food manufacturing production volume", pattern: /\bFood\s+manufacturing\s+production\s+volume\b/gi, ru: "Объём производства пищевой продукции", uz: "Oziq-ovqat mahsulotlari ishlab chiqarish hajmi" },
  { term: "Currency exposure for imported parts", pattern: /\bCurrency\s+exposure\s+for\s+imported\s+parts\b/gi, ru: "Валютный риск по импортным запчастям", uz: "Import ehtiyot qismlar bo'yicha valyuta riski" },
  { term: "Food manufacturing production volume partial", pattern: /\bFood\s+manufacturing\s+производство\s+volume\b/gi, ru: "Объём производства пищевой продукции", uz: "Oziq-ovqat mahsulotlari ishlab chiqarish hajmi" },
  { term: "Currency exposure imported parts partial", pattern: /\bCurrency\s+exposure\s+for\s+импортные\s+запчасти\b/gi, ru: "Валютный риск по импортным запчастям", uz: "Import ehtiyot qismlar bo'yicha valyuta riski" },
  { term: "crop output", pattern: /\bcrop\s+output\b/gi, ru: "объём сельхозпроизводства", uz: "qishloq xo'jaligi ishlab chiqarish hajmi" },
  { term: "crop production", pattern: /\bcrop\s+(?:производство|production)\b/gi, ru: "сельхозпроизводство", uz: "qishloq xo'jaligi ishlab chiqarishi" },
  { term: "Market services / vehicle repair", pattern: /\bMarket\s+services\s*\/\s*vehicle\s+repair(?:\s+proxy)?\b/gi, ru: "Рыночные услуги / ремонт автомобилей", uz: "Bozor xizmatlari / avtomobil ta'miri" },
  { term: "Services value added", pattern: /\bServices\s+value\s+added\b/gi, ru: "Добавленная стоимость сектора услуг", uz: "Xizmatlar sektorida qo'shilgan qiymat" },
  { term: "Broad services-sector context", pattern: /\bBroad\s+services[- ]sector\s+context\b/gi, ru: "Динамика сектора услуг", uz: "Xizmatlar sektori dinamikasi" },
  { term: "not product specific statistic", pattern: /\bnot\s+a\s+product[- ]specific\s+statistic\b/gi, ru: "не является статистикой по конкретному продукту", uz: "aniq mahsulot bo'yicha statistika emas" },
  { term: "World Bank Open Data", pattern: /\bWorld\s+Bank\s+Open\s+Data\b/gi, ru: "Открытые данные Всемирного банка", uz: "Jahon banki ochiq ma'lumotlari" },
  { term: "multilateral statistics", pattern: /\bmultilateral_statistics\b|\bmultilateral\s+statistics\b/gi, ru: "международная статистика", uz: "xalqaro statistika" },
  { term: "hospitality demand context", pattern: /(?:общепит и размещение|hospitality)\s+demand\s+context/gi, ru: "контекст спроса в общепите и размещении", uz: "mehmondo'stlik talabi konteksti" },
  { term: "demand context", pattern: /\bdemand\s+context\b/gi, ru: "контекст спроса", uz: "talab konteksti" },
  { term: "demand proxy", pattern: /\bdemand\s+(?:косвенный\s+ориентир|proxy)\b/gi, ru: "косвенный ориентир спроса", uz: "talab bo'yicha bilvosita orientir" },
  { term: "demand", pattern: /\bdemand\b/gi, ru: "спрос", uz: "talab" },
  { term: "affordability proxy", pattern: /\baffordability\s+(?:косвенный\s+ориентир|proxy)\b/gi, ru: "косвенный ориентир доступности", uz: "narx qulayligi bo'yicha bilvosita orientir" },
  { term: "affordability", pattern: /\baffordability\b/gi, ru: "доступность", uz: "narx qulayligi" },
  { term: "population", pattern: /\bpopulation\b/gi, ru: "население", uz: "aholi" },
  { term: "retail", pattern: /\bretail\b/gi, ru: "розница", uz: "chakana savdo" },
  { term: "turnover", pattern: /\bturnover\b/gi, ru: "оборот", uz: "aylanma" },
  { term: "household consumption expenditure", pattern: /\bhousehold\s+consumption\s+expenditure\b/gi, ru: "расходы домохозяйств на потребление", uz: "uy xo'jaliklari iste'mol xarajatlari" },
  { term: "consumer spending", pattern: /(?:потребительский|consumer)\s+spending/gi, ru: "потребительские расходы", uz: "iste'mol xarajatlari" },
  { term: "household income", pattern: /\bhousehold\s+income\b/gi, ru: "доходы домохозяйств", uz: "uy xo'jaliklari daromadi" },
  { term: "poverty income indicators", pattern: /\bpoverty\s*\/\s*income\s+indicators\b/gi, ru: "показатели бедности и доходов", uz: "kambag'allik va daromad ko'rsatkichlari" },
  { term: "income indicators", pattern: /\bincome\s+indicators\b/gi, ru: "показатели доходов", uz: "daromad ko'rsatkichlari" },
  { term: "poverty", pattern: /\bpoverty\b/gi, ru: "бедность", uz: "kambag'allik" },
  { term: "income", pattern: /\bincome\b/gi, ru: "доходы", uz: "daromad" },
  { term: "indicators", pattern: /\bindicators\b/gi, ru: "показатели", uz: "ko'rsatkichlar" },
  { term: "indicator", pattern: /\bindicator\b/gi, ru: "показатель", uz: "ko'rsatkich" },
  { term: "household", pattern: /\bhouseholds?\b/gi, ru: "домохозяйства", uz: "uy xo'jaliklari" },
  { term: "consumption", pattern: /\bconsumption\b/gi, ru: "потребление", uz: "iste'mol" },
  { term: "expenditure", pattern: /\bexpenditure\b/gi, ru: "расходы", uz: "xarajatlar" },
  { term: "spending", pattern: /\bspending\b/gi, ru: "расходы", uz: "xarajatlar" },
  { term: "consumer", pattern: /\bconsumer\b/gi, ru: "потребительский", uz: "iste'mol" },
  { term: "prices", pattern: /\bprices\b/gi, ru: "цены", uz: "narxlar" },
  { term: "price", pattern: /\bprice\b/gi, ru: "цена", uz: "narx" },
  { term: "inflation", pattern: /\binflation\b/gi, ru: "инфляция", uz: "inflyatsiya" },
  { term: "demographics", pattern: /\bdemographics\b/gi, ru: "демография", uz: "demografiya" },
  { term: "demography", pattern: /\bdemography\b/gi, ru: "демография", uz: "demografiya" },
  { term: "and", pattern: /\band\b/gi, ru: "и", uz: "va" },
  { term: "electricity gas steam supply", pattern: /\belectricity\s*,\s*gas\s*,\s*steam\s+поставка\b/gi, ru: "поставка электроэнергии, газа и пара", uz: "elektr, gaz va bug' ta'minoti" },
  { term: "electricity gas steam", pattern: /\belectricity\s*,\s*gas\s*,\s*steam\b/gi, ru: "электроэнергия, газ и пар", uz: "elektr, gaz va bug'" },
  { term: "electricity", pattern: /\belectricity\b/gi, ru: "электроэнергия", uz: "elektr" },
  { term: "steam", pattern: /\bsteam\b/gi, ru: "пар", uz: "bug'" },
  { term: "gas", pattern: /\bgas\b/gi, ru: "газ", uz: "gaz" },
  { term: "utility risk", pattern: /\butility\s+risk\b/gi, ru: "риск коммунальных услуг", uz: "kommunal xizmatlar riski" },
  { term: "utility", pattern: /\butility\b/gi, ru: "коммунальные услуги", uz: "kommunal xizmatlar" },
  { term: "risk", pattern: /\brisk\b/gi, ru: "риск", uz: "risk" },
  { term: "energy supply", pattern: /\benergy\s+supply\b/gi, ru: "энергоснабжение", uz: "energiya ta'minoti" },
  { term: "energy", pattern: /\benergy\b/gi, ru: "энергия", uz: "energiya" },
  { term: "supply", pattern: /\bsupply\b/gi, ru: "поставка", uz: "ta'minot" },
  { term: "agro supply context", pattern: /\bagro\s+supply\s+context\b/gi, ru: "контекст поставок сельхозсырья", uz: "agro ta'minot konteksti" },
  { term: "supply context", pattern: /\bsupply\s+context\b/gi, ru: "контекст поставок", uz: "ta'minot konteksti" },
  { term: "agro", pattern: /\bagro\b/gi, ru: "агро", uz: "agro" },
  { term: "yield", pattern: /\byield\b/gi, ru: "урожайность", uz: "hosildorlik" },
  { term: "agriculture", pattern: /\bagriculture\b/gi, ru: "сельское хозяйство", uz: "qishloq xo'jaligi" },
  { term: "production", pattern: /\bproduction\b/gi, ru: "производство", uz: "ishlab chiqarish" },
  { term: "manufacturing", pattern: /\bmanufacturing\b/gi, ru: "производство", uz: "ishlab chiqarish" },
  { term: "repair", pattern: /\brepair\b/gi, ru: "ремонт", uz: "ta'mirlash" },
  { term: "vehicle", pattern: /\bvehicle\b/gi, ru: "автомобили", uz: "avtomobil" },
  { term: "parts", pattern: /\bparts\b/gi, ru: "запчасти", uz: "ehtiyot qismlar" },
  { term: "imported", pattern: /\bimported\b/gi, ru: "импортные", uz: "import" },
  { term: "Market services / vehicle repair partial", pattern: /\bMarket\s+услуги\s*\/\s*vehicle\s+repair\b/gi, ru: "Рыночные услуги / ремонт автомобилей", uz: "Bozor xizmatlari / avtomobil ta'miri" },
  { term: "accommodation and food services", pattern: /\baccommodation\s+(?:and|и)\s+food\s+(?:услуги|services)\b/gi, ru: "услуги проживания и питания", uz: "joylashtirish va ovqatlanish xizmatlari" },
  { term: "accommodation and food", pattern: /\baccommodation\s+(?:and|и)\s+food\b/gi, ru: "проживание и питание", uz: "joylashtirish va ovqatlanish" },
  { term: "accommodation", pattern: /\baccommodation\b/gi, ru: "проживание", uz: "joylashtirish" },
  { term: "food", pattern: /\bfood\b/gi, ru: "питание", uz: "ovqatlanish" },
  { term: "hospitality services", pattern: /\bhospitality\s+services\b/gi, ru: "услуги общественного питания и размещения", uz: "mehmondo'stlik xizmatlari" },
  { term: "services", pattern: /\bservices\b/gi, ru: "услуги", uz: "xizmatlar" },
  { term: "hospitality", pattern: /\bhospitality\b/gi, ru: "общепит и размещение", uz: "mehmondo'stlik" },
  { term: "payroll benchmark", pattern: /\bpayroll\s+benchmark\b/gi, ru: "ориентир по фонду оплаты труда", uz: "ish haqi fondi mezoni" },
  { term: "payroll", pattern: /\bpayroll\b/gi, ru: "фонд оплаты труда", uz: "ish haqi fondi" },
  { term: "benchmark", pattern: /\bbenchmark\b/gi, ru: "ориентир", uz: "mezon" },
  { term: "official statistics labor market", pattern: /\bofficial\s+statistics\s*:\s*labor\s+market\b/gi, ru: "официальная статистика: рынок труда", uz: "rasmiy statistika: mehnat bozori" },
  { term: "official statistics", pattern: /\bofficial\s+statistics\b/gi, ru: "официальная статистика", uz: "rasmiy statistika" },
  { term: "labor market", pattern: /\blabor\s+market\b/gi, ru: "рынок труда", uz: "mehnat bozori" },
  { term: "quarterly", pattern: /\bquarterly\b/gi, ru: "ежеквартально", uz: "har chorakda" },
  { term: "annual", pattern: /\bannual\b/gi, ru: "ежегодно", uz: "har yili" },
  { term: "yearly", pattern: /\byearly\b/gi, ru: "ежегодно", uz: "har yili" },
  { term: "region", pattern: /\bregion\b/gi, ru: "регион", uz: "hudud" },
  { term: "wages", pattern: /\bwages\b/gi, ru: "зарплаты", uz: "ish haqi" },
  { term: "employment", pattern: /\bemployment\b/gi, ru: "занятость", uz: "bandlik" },
  { term: "occupation", pattern: /\boccupation\b/gi, ru: "профессия", uz: "kasb" },
  { term: "salary benchmarks", pattern: /\bsalary\s+benchmarks\b/gi, ru: "ориентиры по зарплатам", uz: "ish haqi mezonlari" },
  { term: "staffing assumptions", pattern: /\bstaffing\s+assumptions\b/gi, ru: "допущения по персоналу", uz: "xodimlar bo'yicha farazlar" },
  { term: "Food manufacturing production volume", pattern: /\bFood\s+manufacturing\s+production\s+volume\b/gi, ru: "Объём производства пищевой продукции", uz: "Oziq-ovqat mahsulotlari ishlab chiqarish hajmi" },
  { term: "Market services / vehicle repair", pattern: /\bMarket\s+services\s*\/\s*vehicle\s+repair(?:\s+proxy)?\b/gi, ru: "Рыночные услуги / ремонт автомобилей", uz: "Bozor xizmatlari / avtomobil ta'miri" },
  { term: "Currency exposure for imported parts", pattern: /\bCurrency\s+exposure\s+for\s+imported\s+parts\b/gi, ru: "Валютный риск по импортным запчастям", uz: "Import ehtiyot qismlar bo'yicha valyuta riski" },
  { term: "CBU / supplier quotation", pattern: /\bCBU\s*\/\s*supplier\s+quotation(?:\s+proxy)?\b/gi, ru: "Курс ЦБ / коммерческое предложение поставщика", uz: "Markaziy bank kursi / yetkazib beruvchi tijorat taklifi" },
  { term: "supplier quotation", pattern: /\bsupplier\s+quotation(?:\s+proxy)?\b/gi, ru: "коммерческое предложение поставщика", uz: "yetkazib beruvchi tijorat taklifi" },
  { term: "Project evidence", pattern: /\bProject\s+evidence\b/gi, ru: "Подтверждения по проекту", uz: "Loyiha bo'yicha tasdiqlar" },
  { term: "Currency snapshot", pattern: /\bCurrency\s+snapshot\b/gi, ru: "Снимок курса валюты", uz: "Valyuta kursi surati" },
  { term: "Monthly OpEx", pattern: /\bMonthly\s+Op\s*Ex\b|\bMonthly\s+OpEx\b/gi, ru: "Ежемесячные операционные расходы", uz: "Oylik operatsion xarajatlar" },
  { term: "Monthly операционные расходы", pattern: /\bMonthly\s+операционные\s+расходы\b/gi, ru: "Ежемесячные операционные расходы", uz: "Oylik operatsion xarajatlar" },
  { term: "Monthly", pattern: /\bMonthly\b/gi, ru: "Ежемесячные", uz: "Oylik" },
  { term: "gapPct", pattern: /\bgapPct\b/g, ru: "Отклонение, %", uz: "Og'ish, %" },
  { term: "100 index", pattern: /\b100\s+index\b/gi, ru: "Индекс 100", uz: "100 indeks" },
  { term: "index", pattern: /\bindex\b/gi, ru: "индекс", uz: "indeks" },
  { term: "StatUz", pattern: /\bStatUz\b/g, ru: "Национальный комитет статистики Республики Узбекистан", uz: "O'zbekiston Respublikasi Statistika qo'mitasi" },
  { term: "Yandex Maps", pattern: /\bYandex\s+Maps\b/gi, ru: "Яндекс.Карты", uz: "Yandex xaritalari" },
  { term: "Google Maps", pattern: /\bGoogle\s+Maps\b/gi, ru: "Google Карты", uz: "Google xaritalari" },
  { term: "Maps", pattern: /\bMaps\b/g, ru: "карты", uz: "xaritalar" },
  { term: "B2B", pattern: /\bB2B(?!\s*\/)[- ]?(?:заказы|клиенты|договора|контракты)?\b/gi, ru: "корпоративные клиенты", uz: "korporativ mijozlar" },
  { term: "B2C", pattern: /(?<!\/)\bB2C[- ]?(?:заказы|клиенты)?\b/gi, ru: "розничные клиенты", uz: "chakana mijozlar" },
  { term: "NDVI", pattern: /\bNDVI\b/g, ru: "индекс растительности", uz: "vegetatsiya indeksi" },
  { term: "CRM", pattern: /\bCRM\b/g, ru: "система учёта клиентов", uz: "mijozlar hisobi tizimi" },
  { term: "HR", pattern: /\bHR\b/g, ru: "персонал", uz: "xodimlar" },
  { term: "FX", pattern: /\bFX\b/g, ru: "валютный риск", uz: "valyuta riski" },
  { term: "AI classification", pattern: /\bAI\s+classification\b/gi, ru: "ИИ-классификация", uz: "sun'iy intellekt tasnifi" },
  { term: "Business profile", pattern: /\bBusiness\s+profile\b/gi, ru: "Бизнес-профиль", uz: "Biznes profili" },
  { term: "customer acquisition cost", pattern: /\bcustomer\s+acquisition\s+cost\b/gi, ru: "стоимость привлечения клиента", uz: "mijoz jalb qilish qiymati" },
  { term: "customer acquisition", pattern: /\bcustomer\s+acquisition\b/gi, ru: "привлечение клиента", uz: "mijoz jalb qilish" },
  { term: "market test", pattern: /\bmarket\s+test\b/gi, ru: "проверка рынка", uz: "bozor sinovi" },
  { term: "input", pattern: /\binput\b/gi, ru: "вводные данные", uz: "kiritilgan ma'lumot" },
  { term: "proxy", pattern: /\bproxy\b/gi, ru: "косвенный ориентир", uz: "bilvosita orientir" },
  { term: "user_input", pattern: /\buser_input\b/gi, ru: "данные пользователя", uz: "foydalanuvchi ma'lumotlari" },
  { term: "unit_cost", pattern: /\bunit_cost\b/gi, ru: "себестоимость единицы", uz: "birlik tannarxi" },
  { term: "food_service", pattern: /\bfood_service\b/gi, ru: "общепит", uz: "umumiy ovqatlanish" },
  { term: "sample_food_service_business", pattern: /\bsample_food_service_business\b/gi, ru: "типовая модель общепита", uz: "umumiy ovqatlanish namunaviy modeli" },
  { term: "cost_per_check", pattern: /\bcost_per_check\b/gi, ru: "себестоимость среднего чека", uz: "o'rtacha chek tannarxi" },
  { term: "percent_of_revenue", pattern: /\bpercent_of_revenue\b/gi, ru: "процент от выручки", uz: "tushum foizi" },
  { term: "cogs_assumption", pattern: /\bcogs_assumption\b/gi, ru: "допущение по себестоимости", uz: "tannarx farazi" },
  { term: "monthlyFixedOpex", pattern: /\bmonthlyFixedOpex\b/gi, ru: "ежемесячные операционные расходы", uz: "oylik operatsion xarajatlar" },
  { term: "bufferMonths", pattern: /\bbufferMonths\b/gi, ru: "месяцы буфера", uz: "zaxira oylari" },
  { term: "initialInventory", pattern: /\binitialInventory\b/gi, ru: "первоначальный запас", uz: "boshlang'ich zaxira" },
  { term: "accountsReceivableBuffer", pattern: /\baccountsReceivableBuffer\b/gi, ru: "буфер дебиторской задолженности", uz: "debitorlik buferi" },
  { term: "accountsPayableBuffer", pattern: /\baccountsPayableBuffer\b/gi, ru: "буфер кредиторской отсрочки", uz: "kreditorlik buferi" },
  { term: "seasonalStockBuffer", pattern: /\bseasonalStockBuffer\b/gi, ru: "сезонный запас", uz: "mavsumiy zaxira" },

  { term: "channels", pattern: /\bchannels?\b/gi, ru: "каналы", uz: "kanallar" },
  { term: "consumer market proxy", pattern: /(?:потребительский|consumer)\s+market\s+(?:косвенный\s+ориентир|proxy)\b/gi, ru: "косвенный ориентир потребительского рынка", uz: "iste'mol bozori bo'yicha bilvosita orientir" },
  { term: "market proxy", pattern: /\bmarket\s+(?:косвенный\s+ориентир|proxy)\b/gi, ru: "косвенный рыночный ориентир", uz: "bozor bo'yicha bilvosita orientir" },
  { term: "market", pattern: /\bmarket\b/gi, ru: "рынок", uz: "bozor" },
  { term: "market sizing context partial", pattern: /рынок\s+sizing\s+контекст/gi, ru: "контекст оценки размера рынка", uz: "bozor hajmini baholash konteksti" },
  { term: "sizing context", pattern: /\bsizing\s+контекст\b/gi, ru: "контекст оценки размера", uz: "hajmni baholash konteksti" },
  { term: "sizing", pattern: /\bsizing\b/gi, ru: "оценка размера", uz: "hajmni baholash" },
  { term: "market sizing context", pattern: /\bmarket\s+sizing\s+context\b/gi, ru: "контекст оценки размера рынка", uz: "bozor hajmini baholash konteksti" },
  { term: "market sizing", pattern: /\bmarket\s+sizing\b/gi, ru: "оценка размера рынка", uz: "bozor hajmini baholash" },
  { term: "context", pattern: /\bcontext\b/gi, ru: "контекст", uz: "kontekst" },
  { term: "marketplace-комиссии", pattern: /\bmarketplace[- ]комисси[ияеюйями]*\b/giu, ru: "комиссии онлайн-площадок", uz: "onlayn maydoncha komissiyalari" },
  { term: "takeaway/delivery", pattern: /\btakeaway\s*\/\s*delivery\b/gi, ru: "выдача навынос и доставка", uz: "olib ketish va yetkazib berish" },
  { term: "cash flow", pattern: /\bcash\s+flow\b/gi, ru: "денежный поток", uz: "pul oqimi" },
  { term: "cash gap", pattern: /\bcash\s+gap\b/gi, ru: "кассовый разрыв", uz: "pul uzilishi" },
  { term: "cash buffer", pattern: /\bcash\s+buffer\b/gi, ru: "денежный резерв", uz: "pul zaxirasi" },
  { term: "unit economics", pattern: /\bunit\s+economics[a-z']*\b/gi, ru: "экономика единицы продажи", uz: "sotuv birligi iqtisodiyoti" },
  { term: "structured fields", pattern: /\bstructured\s+fields\b/gi, ru: "числовые поля формы", uz: "formaning raqamli maydonlari" },
  { term: "Gross margin", pattern: /\bgross\s+margin\b/gi, ru: "валовая маржа", uz: "yalpi marja" },
  { term: "food cost assumptions", pattern: /(?:питание|food)\s+cost\s+assumptions/gi, ru: "допущения по себестоимости питания", uz: "ovqatlanish tannarxi farazlari" },
  { term: "cost assumptions", pattern: /\bcost\s+assumptions\b/gi, ru: "допущения по себестоимости", uz: "tannarx farazlari" },
  { term: "assumptions", pattern: /\bassumptions\b/gi, ru: "допущения", uz: "farazlar" },
  { term: "cost", pattern: /\bcost\b/gi, ru: "себестоимость", uz: "tannarx" },
  { term: "food cost", pattern: /\bfood\s*[- ]?cost\b/gi, ru: "себестоимость продаж", uz: "sotuv tannarxi" },
  { term: "Scope", pattern: /\bscope\b/gi, ru: "объём работ", uz: "ish hajmi" },
  { term: "deliverables", pattern: /\bdeliverables\b/gi, ru: "результаты работ", uz: "ish natijalari" },
  { term: "Fulfillment", pattern: /\bfulfillment\b/gi, ru: "сборка и отправка заказов", uz: "buyurtmalarni yig'ish va jo'natish" },
  { term: "marketplace", pattern: /\bmarketplaces?\b/gi, ru: "онлайн-площадки", uz: "onlayn maydonchalar" },
  { term: "CAC", pattern: /\bCAC\b/g, ru: "стоимость привлечения клиента", uz: "mijoz jalb qilish qiymati" },
  { term: "takeaway", pattern: /\btakeaway\b/gi, ru: "выдача навынос", uz: "olib ketish" },
  { term: "delivery", pattern: /\bdelivery\b/gi, ru: "доставка", uz: "yetkazib berish" },
  { term: "compliance", pattern: /\bcompliance\b/gi, ru: "соответствие требованиям", uz: "talablarga muvofiqlik" },
  { term: "Retention", pattern: /\bretention\b/gi, ru: "повторные продажи", uz: "mijozlarni ushlab qolish" },
  { term: "Supervisor", pattern: /\bsupervisor\b/gi, ru: "старший смены", uz: "smena mas'uli" },
  { term: "CapEx", pattern: /\bCap\s*Ex\b|\bCapEx\b/gi, ru: "стартовые вложения", uz: "boshlang'ich investitsiyalar" },
  { term: "OpEx", pattern: /\bOp\s*Ex\b|\bOpEx\b/gi, ru: "операционные расходы", uz: "operatsion xarajatlar" },
  { term: "COGS", pattern: /\bCOGS\b/g, ru: "себестоимость продаж", uz: "sotuv tannarxi" },
  { term: "AI", pattern: /\bAI\b/g, ru: "ИИ", uz: "sun'iy intellekt" },
  { term: "Digital", pattern: /\bdigital\b/gi, ru: "цифровые", uz: "raqamli" },
  { term: "dark store", pattern: /\bdark\s+store\b/gi, ru: "склад быстрой доставки", uz: "tezkor yetkazish ombori" },
  { term: "SLA", pattern: /\bSLA\b/g, ru: "сроки выполнения", uz: "xizmat muddati" },
  { term: "SKU", pattern: /\bSKUs?\b/g, ru: "товарные позиции", uz: "tovar pozitsiyalari" },
  { term: "POS", pattern: /\bPOS\b/g, ru: "кассовая система", uz: "kassa tizimi" },
  { term: "IT", pattern: /\bIT\b/g, ru: "цифровая система", uz: "raqamli tizim" }
];

const urlPattern = /https?:\/\/\S+|\b[a-z0-9.-]+\.(?:uz|com|org|net|ru|io)\S*/gi;
export const localeLatinWhitelist = ["UZS", "USD", "EUR", "EBITDA", "DSCR", "B2B", "B2C", "FINKO", "Telegram", "Instagram", "Google", "Yandex", "2GIS", "URL", "PDF", "Excel", "API", "POS", "QR", "CRM", "ID", "pH", "Uzum", "Wildberries", "OpenAI", "ChatGPT", "Cobalt", "Chevrolet", "Nexia", "Lacetti", "Gentra", "Spark", "Damas"];
const allowedTokens = [...localeLatinWhitelist];
const allowedPattern = new RegExp(`\\b(?:${allowedTokens.map((item) => item.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")).join("|")})\\b`, "gi");

export const forbiddenUserFacingTerms = replacements.map((item) => item.term);
const allowedUzbekReplacementTerms = new Set(["agro", "risk", "gas", "transport", "digital"]);

function preserveUrls(value: string) {
  const urls: string[] = [];
  const text = value.replace(urlPattern, (match) => {
    const token = `__URL_${urls.length}__`;
    urls.push(match);
    return token;
  });
  return { text, urls };
}

function restoreUrls(value: string, urls: string[]) {
  return urls.reduce((acc, url, index) => acc.replaceAll(`__URL_${index}__`, url), value);
}

export function manualVerificationFallback(locale: Locale): string {
  if (locale === "en") return "Needs clarification";
  if (locale === "uz") return "Aniqlashtirish kerak";
  return "Требует уточнения";
}

const rawInternalPatterns = [
  /\b__money\b/,
  /\bexchangeRateSnapshot\b/,
  /\bstaffPlan\s*:/,
  /\b(?:targetCustomers|customerAcquisitionChannels|monthlyCapacity|averagePrice|sourceAmount|sourceCurrency|amountUZS)\s*:/,
  /\bqualityControlPlan\s*:/,
  /\bsectionNotes\./,
  /\bsample_[a-z0-9_]+\b/i,
  /\b[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\b/i
];

function containsRawInternalText(value: string): boolean {
  return rawInternalPatterns.some((pattern) => pattern.test(value)) || /\{\s*"?[A-Za-z0-9_]+"?\s*:/.test(value);
}

function isDebugAnswerSummary(value: string): boolean {
  const internalKeys = [
    "targetCustomers",
    "customerAcquisitionChannels",
    "monthlyCapacity",
    "averagePrice",
    "sourceAmount",
    "sourceCurrency",
    "amountUZS",
    "hasBuyerAgreements",
    "sectionNotes",
    "ownContributionAmount",
    "requestedLoanAmount"
  ];
  const hits = internalKeys.filter((key) => new RegExp(`\\b${key}\\s*:`, "i").test(value)).length;
  return hits >= 2 || (/\{\s*"?sourceAmount"?\s*:/.test(value) && /\b[a-z][A-Za-z0-9]+\s*:/.test(value));
}

function sectionNoteKeyFromField(fieldKey?: string): string | null {
  const key = String(fieldKey ?? "");
  if (/finance|финанс/i.test(key)) return "finance";
  if (/productionCapacity|process|operation|capacity|операц|процесс|мощност/i.test(key)) return "productionCapacity";
  if (/sales|продаж/i.test(key)) return "sales";
  if (/location|premises|помещ|локац/i.test(key)) return "location";
  return null;
}

function extractHumanSectionNote(value: string, fieldKey?: string): string | null {
  const noteKey = sectionNoteKeyFromField(fieldKey);
  const candidates: string[] = [];
  const keys = noteKey ? [noteKey] : ["finance", "productionCapacity", "sales", "location"];
  for (const key of keys) {
    const regex = new RegExp(`sectionNotes\\.${key}:\\s*([\\s\\S]*?)(?=;\\s*(?:sample_[A-Za-z0-9_]+|sectionNotes\\.|[A-Za-z][A-Za-z0-9_]*\\s*:\\s*\\{|[A-Za-z][A-Za-z0-9_]*\\s*:)|$)`, "gi");
    let match: RegExpExecArray | null;
    while ((match = regex.exec(value)) !== null) {
      const candidate = (match[1] ?? "").trim();
      if (candidate) candidates.push(candidate);
    }
  }
  const human = [...candidates].reverse().find((candidate) => !/[{}]|__money|requestedLoanAmount|ownContributionAmount|collateralEstimatedValue|exchangeRateSnapshot|sample_/i.test(candidate));
  return human ?? null;
}

function removeRawInternalSegments(value: string): string {
  let result = value;
  result = result.replace(/\b(?:staffPlan|exchangeRateSnapshot|ownContributionAmount|requestedLoanAmount|collateralEstimatedValue|sectionNotes\.finance|sectionNotes\.productionCapacity|qualityControlPlan)\s*:\s*\{[\s\S]*?\}\s*;?/gi, " ");
  result = result.replace(/\bsample_[A-Za-z0-9_]+\s*:\s*[\s\S]*?(?=;\s*sample_|;\s*sectionNotes\.|$)/gi, " ");
  result = result.replace(/\b[a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}\b/gi, " ");
  result = result.replace(/\b__money\b/gi, " ");
  result = result.replace(/\{\s*"?[A-Za-z0-9_]+"?\s*:[\s\S]*?\}/g, " ");
  return result;
}

function cleanPlaceholderLeaks(value: string, locale: Locale): string {
  const fallback = manualVerificationFallback(locale);
  let result = value;
  if (locale === "ru") {
    result = result.replace(/показатель\s+статистика\s+показатель(?:\s+показатель)*/gi, "Официальная статистика требует ручной проверки");
    result = result.replace(/\bпоказатель(?:\s+показатель){1,}\b/gi, fallback);
    result = result.replace(/\bпоказатель\s+и\s+показатель\b/gi, fallback);
    result = result.replace(/^\s*показатель\s*$/g, fallback);
    result = result.replace(/\bпоказатель\s*-\s*(?=кредит|лизинг|собственные)/gi, "");
  }
  result = result.replace(/\b(?:sample_[A-Za-z0-9_]+|sectionNotes\.[A-Za-z0-9_.]+|__[A-Za-z0-9_]+)\b/g, fallback);
  result = result.replace(/\b[A-Za-z][A-Za-z0-9]*_[A-Za-z0-9_]+\b/g, fallback);
  result = result.replace(/\s{2,}/g, " ").replace(/\s+([.,;:])/g, "$1").trim();
  return result;
}

export function sanitizeUserFacingText(value: string, locale: Locale, fieldKey?: string): string {
  const original = String(value ?? "");
  let result = original;
  if (containsRawInternalText(result)) {
    result = extractHumanSectionNote(result, fieldKey) ?? removeRawInternalSegments(result);
  }
  result = cleanPlaceholderLeaks(result, locale);
  if (!result && containsRawInternalText(original)) return manualVerificationFallback(locale);
  return result;
}

export function sanitizeUserFacingTextareaValue(value: unknown, options: { fieldKey?: string; locale?: Locale } = {}): string {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string") return "";
  if (isDebugAnswerSummary(value)) return "";
  return sanitizeUserFacingText(value, options.locale ?? "ru", options.fieldKey);
}

export function sanitizeSectionNotesForStorage(sectionNotes: StructuredCloneableSectionNotes | undefined, locale: Locale = "ru") {
  if (!sectionNotes || typeof sectionNotes !== "object") return sectionNotes;
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(sectionNotes as Record<string, unknown>)) {
    result[key] = typeof value === "string" ? sanitizeUserFacingTextareaValue(value, { fieldKey: `sectionNotes.${key}`, locale }) : value;
  }
  return result as typeof sectionNotes;
}

type StructuredCloneableSectionNotes = Record<string, unknown>;

export function replaceForbiddenUserFacingTerms(value: string, locale: Locale): string {
  const { text: withoutUrls, urls } = preserveUrls(String(value ?? ""));
  let result = withoutUrls;
  for (const replacement of replacements) {
    result = result.replace(replacement.pattern, locale === "uz" ? replacement.uz : locale === "en" ? (replacement.en ?? replacement.ru) : replacement.ru);
  }
  if (locale === "ru") {
    result = replaceUnexpectedLatinTokensForRussian(result);
  }
  return sanitizeUserFacingText(restoreUrls(result, urls), locale);
}

export function findForbiddenUserFacingTerms(value: string, locale: Locale): string[] {
  if (locale === "en") return [];
  const { text: withoutUrls } = preserveUrls(String(value ?? ""));
  const text = withoutUrls.replace(allowedPattern, "");
  const matches: string[] = [];
  for (const replacement of replacements) {
    if (locale === "uz" && allowedUzbekReplacementTerms.has(replacement.term)) {
      replacement.pattern.lastIndex = 0;
      continue;
    }
    if (replacement.pattern.test(text)) matches.push(replacement.term);
    replacement.pattern.lastIndex = 0;
  }
  return Array.from(new Set(matches));
}

export function hasForbiddenUserFacingTerms(value: string, locale: Locale): boolean {
  return findForbiddenUserFacingTerms(value, locale).length > 0;
}

export function sanitizeUserFacingObject<T>(value: T, locale: Locale): T {
  if (typeof value === "string") return replaceForbiddenUserFacingTerms(value, locale) as T;
  if (Array.isArray(value)) return value.map((item) => sanitizeUserFacingObject(item, locale)) as T;
  if (value && typeof value === "object") {
    const result: Record<string, unknown> = {};
    for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
      result[key] = sanitizeUserFacingObject(item, locale);
    }
    return result as T;
  }
  return value;
}



const sanitizerInternalEnumValues = new Set(["assumption", "calculated", "user_input", "manual", "profile", "yes", "no", "annuity", "equal_principal", "rent", "mixed", "ru", "uz", "en"]);

const russianUnexpectedLatinFallbacks: Record<string, string> = {
  livestock: "животноводство",
  output: "объём",
  volume: "объём",
  index: "индекс",
  base: "база",
  category: "категория",
  categories: "категории",
  source: "источник",
  sources: "источники",
  evidence: "подтверждение",
  snapshot: "снимок",
  quotation: "коммерческое предложение",
  supplier: "поставщик",
  service: "услуга",
  services: "услуги",
  vehicle: "автомобиль",
  repair: "ремонт",
  parts: "запчасти",
  imported: "импортные",
  exposure: "риск",
  currency: "валюта",
  monthly: "ежемесячный",
  high: "высокий",
  medium: "средний",
  low: "низкий",
  dscr: "DSCR",
  new: "новый",
  annual: "ежегодный",
  quarterly: "ежеквартальный",
  demand: "спрос",
  affordability: "доступность",
  market: "рынок",
  sizing: "оценка размера",
  income: "доходы",
  poverty: "бедность",
  indicators: "показатели",
  indicator: "показатель",
  labor: "труд",
  payroll: "фонд оплаты труда",
  benchmark: "ориентир",
  context: "контекст",
  proxy: "косвенный ориентир",
  official: "официальный",
  statistics: "статистика",
  food: "питание",
  accommodation: "проживание",
  hospitality: "общепит и размещение",
  manufacturing: "производство",
  production: "производство",
  agriculture: "сельское хозяйство",
  crop: "урожай",
  yield: "урожайность",
  consumer: "потребительский",
  retail: "розница",
  turnover: "оборот",
  price: "цена",
  prices: "цены",
  inflation: "инфляция",
  demography: "демография",
  demographics: "демография"
};

function unknownLatinTokenFallbackForRussian(token: string): string {
  const normalized = token
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .replace(/[/-]+/g, "_")
    .toLowerCase();
  const parts = normalized.split("_").filter(Boolean);
  const translated = parts.map((part) => russianUnexpectedLatinFallbacks[part] ?? "").filter(Boolean);
  if (translated.length) return Array.from(new Set(translated)).join(" ");
  return "профильный показатель";
}

function cleanRepeatedClarificationNoise(value: string): string {
  return value
    .replace(/(?:Требует\s+уточнения\s*){2,}/gi, "данные требуют подтверждения")
    .replace(/Требует\s+уточнения\s+(?=(?:вода|слив|стоки|электроэнергия|химия|автохимия|аренда|маркетинг|трафик|клиенты|договоры))/gi, "")
    .replace(/(мойка|авто|рынок)\s+Требует\s+уточнения/gi, "$1")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .trim();
}

function replaceUnexpectedLatinTokensForRussian(value: string): string {
  const canonicalWhitelist = new Map(localeLatinWhitelist.map((item) => [item.toLowerCase(), item]));
  const whitelist = new Set(canonicalWhitelist.keys());
  const replaced = value.replace(latinTokenPattern, (token) => {
    const lower = token.toLowerCase();
    if (whitelist.has(lower)) return canonicalWhitelist.get(lower) ?? token;
    if (sanitizerInternalEnumValues.has(lower) || /^URL_\d+$/.test(token)) return token;
    if (token.includes("/")) {
      const parts = token.split("/").filter(Boolean);
      if (parts.length > 1 && parts.every((part) => whitelist.has(part.toLowerCase()))) return token;
      return parts.map((part) => russianUnexpectedLatinFallbacks[part.toLowerCase()] ?? unknownLatinTokenFallbackForRussian(part)).join(" / ");
    }
    return russianUnexpectedLatinFallbacks[lower] ?? unknownLatinTokenFallbackForRussian(token);
  });
  return cleanRepeatedClarificationNoise(replaced);
}

const emailPattern = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const latinTokenPattern = /\b[A-Za-z][A-Za-z0-9/_-]*\b/g;

export function findUnexpectedLatinTokens(value: string, locale: Locale): string[] {
  if (locale === "en" || locale === "uz") return [];
  const { text: noUrls } = preserveUrls(String(value ?? ""));
  const withoutEmails = noUrls.replace(emailPattern, " ");
  const whitelist = new Set(localeLatinWhitelist.map((item) => item.toLowerCase()));
  const matches = withoutEmails.match(latinTokenPattern) ?? [];
  return Array.from(new Set(matches.filter((token) => {
    if (whitelist.has(token.toLowerCase())) return false;
    if (token.includes("/")) {
      const parts = token.split("/").filter(Boolean);
      if (parts.length > 1 && parts.every((part) => whitelist.has(part.toLowerCase()))) return false;
    }
    return true;
  })));
}

export function hasUnexpectedLatinTokens(value: string, locale: Locale): boolean {
  return findUnexpectedLatinTokens(value, locale).length > 0;
}
