import type { InterviewBlock, InterviewQuestion, Locale } from "../types/project.ts";
import { businessSamples } from "../data/businessSamples/businessSamples.ts";
import { replaceForbiddenUserFacingTerms } from "../i18n/userFacingSanitizer.ts";

type AppLocale = Extract<Locale, "ru" | "uz" | "en">;
type LocalizedCopy = Record<AppLocale, { label: string; question: string; helpText?: string }>;
type ApprovedBlockId =
  | "business_idea"
  | "location"
  | "equipment_launch"
  | "operations"
  | "suppliers_procurement"
  | "sales"
  | "financing"
  | "documents_experience";

type SampleQuestionSeed = {
  ru: string;
  en: string;
};

type SampleQuestionFamily =
  | "retail"
  | "ecommerce"
  | "food_service"
  | "beauty_wellness"
  | "education"
  | "services"
  | "professional_services"
  | "manufacturing"
  | "construction"
  | "agriculture"
  | "entertainment"
  | "tourism_hospitality"
  | "logistics"
  | "transport"
  | "real_estate"
  | "it_digital";

const approvedBlocks: ApprovedBlockId[] = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
];

const blockAffects: Record<ApprovedBlockId, string[]> = {
  business_idea: ["businessProfile", "marketValidation"],
  location: ["location", "opex", "riskScore"],
  equipment_launch: ["capex", "riskScore"],
  operations: ["opex", "staffing", "riskScore"],
  suppliers_procurement: ["cogs", "workingCapital", "riskScore"],
  sales: ["revenue", "marketValidation", "seasonality"],
  financing: ["financing", "workingCapital"],
  documents_experience: ["documents", "riskScore"]
};

const sampleLabelsById = Object.fromEntries(businessSamples.map((sample) => [sample.id, sample.label])) as Record<string, Record<AppLocale, string>>;
const sampleCategoryById = Object.fromEntries(businessSamples.map((sample) => [sample.id, sample.category])) as Record<string, SampleQuestionFamily>;

const sampleQuestionSeeds: Record<string, SampleQuestionSeed> = {
  children_clothing_store_sample: { ru: "возрастная размерная сетка, школьный сезон, примерка и обмен детской одежды", en: "age-size grids, back-to-school season, fitting and exchange rules for children's clothing" },
  women_clothing_store: { ru: "капсульные коллекции, размерный ряд, примерка, сезонные тренды и возвраты женской одежды", en: "capsule drops, size curves, fitting rooms, seasonal trends and returns for women's apparel" },
  men_clothing_store: { ru: "базовый и деловой ассортимент, размерная сетка, подгонка и сезонность мужской одежды", en: "basic and business assortments, size curves, alterations and seasonality for men's apparel" },
  shoe_store: { ru: "размеры обуви, примерка, гарантия на подошву, сезонные модели и коробочное хранение", en: "shoe sizing, try-on flow, sole warranty, seasonal models and box storage" },
  bags_accessories_store: { ru: "модели сумок, фурнитура, витринная выкладка, подарочные продажи и гарантия на замки", en: "bag models, hardware quality, display merchandising, gift sales and lock warranty" },
  cosmetics_perfume_store: { ru: "тестеры, сроки годности, батч-коды, оригинальность товара и консультации по подбору", en: "testers, expiry dates, batch codes, authenticity checks and product matching advice" },
  household_chemicals_store: { ru: "безопасное хранение химии, ходовые фасовки, акции на бытовые товары и возвраты поврежденной упаковки", en: "safe chemical storage, fast-moving pack sizes, household promotions and damaged-pack returns" },
  stationery_store: { ru: "школьный сезон, офисные заказы, мелкий SKU, тетради/ручки/бумага и локальные поставщики", en: "school season, office orders, small-SKU control, notebooks/pens/paper and local suppliers" },
  online_clothing_store: { ru: "онлайн-размеры, фотоконтент, примерка через доставку, возвраты и маркетплейс-комиссии", en: "online sizing, photo content, delivery-based fitting, returns and marketplace commissions" },
  online_home_goods_store: { ru: "габаритные товары для дома, упаковка, брак при доставке, складские ячейки и карточки товара", en: "bulky home goods, packaging, delivery damage, bin storage and product cards" },
  small_coffee_shop: { ru: "эспрессо-меню, поток утро/обед, посадка на вынос, бариста и зерно", en: "espresso menu, morning/lunch traffic, takeaway seating, barista workflow and coffee beans" },
  neighborhood_bakery: { ru: "ежедневная выпечка, ночная/утренняя смена, списания хлеба, мука и печное оборудование", en: "daily baking, night or morning shifts, bread write-offs, flour and oven equipment" },
  mini_confectionery: { ru: "торты и десерты под заказ, кремы, холодовая цепь, витрина и предзаказы", en: "custom cakes and desserts, creams, cold chain, display case and preorders" },
  fast_food_cafe: { ru: "быстрое меню, скорость выдачи, кассовая очередь, полуфабрикаты и контроль food cost", en: "quick-service menu, serving speed, cashier queue, semi-prepped inputs and food-cost control" },
  lavash_shawarma_shop: { ru: "лаваш/шаурма линия, мясо на вертеле, соусы, поток уличной точки и санитария", en: "lavash or shawarma line, rotisserie meat, sauces, street-point flow and sanitation" },
  burger_shop: { ru: "котлеты, булочки, фритюр, сборка бургеров, delivery-упаковка и скорость кухни", en: "patties, buns, fryer, burger assembly, delivery packaging and kitchen speed" },
  pizza_delivery: { ru: "пицца-печь, тесто, топпинги, зона доставки, термосумки и время до клиента", en: "pizza oven, dough, toppings, delivery zone, thermal bags and delivery time" },
  office_canteen: { ru: "комплексные обеды, график офисов, порционность, закупка продуктов и договоры с компаниями", en: "set lunches, office schedules, portioning, food procurement and company contracts" },
  ready_meals_cookery: { ru: "готовые блюда на витрине, срок хранения, фасовка, маркировка и ежедневные списания", en: "ready-meal display, shelf life, packaging, labeling and daily write-offs" },
  ice_cream_point: { ru: "сезонная точка, фризер, холодовая цепь, порции, топпинги и разрешение на место", en: "seasonal point, freezer, cold chain, portions, toppings and location permit" },
  hairdresser: { ru: "стрижки, окрашивание, кресла мастеров, запись, расходники и стерилизация инструмента", en: "haircuts, coloring, stylist chairs, bookings, consumables and tool sterilization" },
  barbershop: { ru: "мужские стрижки, борода, барбер-кресла, лояльность клиентов и санитария инструмента", en: "men's haircuts, beard services, barber chairs, client loyalty and tool sanitation" },
  beauty_salon_sample: { ru: "комплексные beauty-услуги, кабинеты мастеров, кросс-продажи, запись и стерилизация", en: "combined beauty services, master rooms, cross-selling, bookings and sterilization" },
  nail_studio: { ru: "маникюрные столы, материалы для покрытия, стерилизация, запись и повторные визиты", en: "nail desks, coating materials, sterilization, booking flow and repeat visits" },
  eyelash_studio: { ru: "наращивание ресниц, клей и пинцеты, лежанки, аллергические риски и коррекции", en: "eyelash extensions, glue and tweezers, treatment beds, allergy risks and refill visits" },
  brow_studio: { ru: "коррекция и окрашивание бровей, красители, форма лица, запись и повторные процедуры", en: "brow shaping and tinting, dyes, face-shape matching, bookings and repeat procedures" },
  cosmetology_cabinet: { ru: "косметологические процедуры, аппараты, расходники, медицинские ограничения и согласия клиентов", en: "cosmetology procedures, devices, consumables, medical constraints and client consents" },
  massage_cabinet: { ru: "виды массажа, кушетки, масла, длительность сеанса, противопоказания и абонементы", en: "massage types, tables, oils, session duration, contraindications and memberships" },
  fitness_studio: { ru: "групповые тренировки, тренажеры, абонементы, расписание пиковых часов и тренеры", en: "group workouts, machines, memberships, peak-hour schedule and trainers" },
  yoga_studio: { ru: "йога-группы, коврики, малые залы, расписание практик, абонементы и инструкторы", en: "yoga groups, mats, small halls, practice schedule, memberships and instructors" },
  english_language_center: { ru: "уровни английского, группы по возрасту, преподаватели, учебники и retention учеников", en: "English levels, age groups, teachers, textbooks and student retention" },
  ielts_preparation_center: { ru: "IELTS-модули, mock exams, баллы учеников, преподаватели и интенсивные курсы", en: "IELTS modules, mock exams, student scores, teachers and intensive courses" },
  math_tutoring_center: { ru: "школьная математика, подготовка к экзаменам, группы по уровню и результативность учеников", en: "school math, exam prep, level-based groups and student outcomes" },
  children_development_center: { ru: "развивающие занятия, возрастные группы, безопасность детей, материалы и расписание родителей", en: "development classes, age groups, child safety, materials and parent schedules" },
  private_kindergarten: { ru: "дошкольные группы, питание, сон, воспитатели, безопасность и разрешения детсада", en: "preschool groups, meals, nap routine, caregivers, safety and kindergarten permits" },
  robotics_center_children: { ru: "робототехника для детей, наборы LEGO/Arduino, проектные занятия и соревнования", en: "children's robotics, LEGO or Arduino kits, project classes and competitions" },
  it_courses_teenagers: { ru: "подростковые IT-курсы, ноутбуки, учебные проекты, менторы и портфолио", en: "teen IT courses, laptops, learning projects, mentors and portfolios" },
  smm_digital_courses: { ru: "SMM-практика, рекламные кабинеты, кейсы учеников, эксперты и digital-инструменты", en: "SMM practice, ad accounts, student cases, experts and digital tools" },
  music_school_studio: { ru: "музыкальные классы, инструменты, шумоизоляция, индивидуальные уроки и отчетные концерты", en: "music rooms, instruments, soundproofing, individual lessons and recitals" },
  chess_school: { ru: "шахматные группы, рейтинги учеников, турниры, доски/часы и тренеры", en: "chess groups, student ratings, tournaments, boards/clocks and coaches" },
  car_wash_sample: { ru: "моечные посты, вода и слив, автохимия, поток машин и B2B-автопарки", en: "wash bays, water and drainage, car chemicals, car flow and B2B fleets" },
  detailing_center: { ru: "полировка, химчистка салона, керамика, детейлинг-боксы и премиальный чек", en: "polishing, interior cleaning, ceramic coating, detailing bays and premium tickets" },
  tire_service: { ru: "сезонная смена шин, балансировка, хранение колес, компрессор и очередь клиентов", en: "seasonal tire change, balancing, wheel storage, compressor and client queue" },
  auto_repair_shop: { ru: "диагностика и ремонт легковых авто, подъемники, запчасти, мастера и гарантия работ", en: "passenger car diagnostics and repair, lifts, parts, mechanics and work warranty" },
  auto_electrician: { ru: "диагностика электрики, сканеры, проводка, генераторы, аккумуляторы и выездные заявки", en: "auto electrical diagnostics, scanners, wiring, alternators, batteries and mobile calls" },
  auto_parts_store: { ru: "VIN-подбор, ходовые запчасти, совместимость моделей, возвраты и склад остатков", en: "VIN matching, fast-moving parts, model compatibility, returns and stock storage" },
  auto_accessories_store: { ru: "чехлы, коврики, электроника, сезонные аксессуары, витрина и установка на месте", en: "covers, mats, electronics, seasonal accessories, display and on-site installation" },
  car_rental: { ru: "парк автомобилей, залог, страховка, пробег, повреждения и загрузка по дням", en: "vehicle fleet, deposits, insurance, mileage, damages and daily utilization" },
  oil_change_service: { ru: "замена масла, фильтры, подбор по модели, утилизация отработки и быстрый сервис", en: "oil change, filters, model matching, used-oil disposal and quick service" },
  car_audio_alarm_installation: { ru: "автоакустика, сигнализации, проводка, монтаж в салоне и гарантия электроработ", en: "car audio, alarms, wiring, cabin installation and electrical work warranty" },
  phone_repair_workshop: { ru: "экраны и батареи смартфонов, пайка, диагностика, запчасти и гарантийные случаи", en: "smartphone screens and batteries, soldering, diagnostics, spare parts and warranty cases" },
  laptop_repair_workshop: { ru: "ремонт ноутбуков, платы, матрицы, чистка, диагностика и запасные комплектующие", en: "laptop repair, boards, screens, cleaning, diagnostics and spare components" },
  home_appliance_repair: { ru: "ремонт бытовой техники, выезд мастера, запчасти, диагностика и гарантия после ремонта", en: "home-appliance repair, technician visits, spare parts, diagnostics and post-repair warranty" },
  shoe_repair_workshop: { ru: "ремонт обуви, подошвы, набойки, кожа, фурнитура и срочные заказы", en: "shoe repair, soles, heel tips, leather, hardware and urgent orders" },
  key_duplication_service: { ru: "заготовки ключей, станки, домофонные ключи, точность нарезки и быстрый поток", en: "key blanks, cutting machines, intercom keys, cutting accuracy and quick throughput" },
  clothing_alteration_atelier: { ru: "подгонка одежды, ремонт швов, примерки, срочные заказы и мастерские операции", en: "clothing alterations, seam repair, fittings, urgent orders and tailoring operations" },
  dry_cleaning: { ru: "химчистка одежды, пятновыведение, маркировка вещей, химия и ответственность за изделие", en: "dry cleaning, stain removal, item tagging, chemicals and garment liability" },
  mini_laundry: { ru: "стирка и сушка белья, загрузка машин, сортировка, упаковка и регулярные клиенты", en: "washing and drying laundry, machine loads, sorting, packaging and repeat customers" },
  cleaning_company: { ru: "уборка квартир и офисов, бригады, химия, инвентарь, чек-листы и B2B-договоры", en: "home and office cleaning, teams, chemicals, inventory, checklists and B2B contracts" },
  handyman_service: { ru: "мелкий ремонт, выездные заявки, универсальные инструменты, срочность и гарантия работ", en: "minor repairs, mobile jobs, universal tools, urgency and work warranty" },
  photo_studio: { ru: "фотосессии, свет, фоны, аренда зала, ретушь и пакетные продажи", en: "photo sessions, lighting, backdrops, studio rental, retouching and package sales" },
  video_content_studio: { ru: "видео-контент, съемочный свет, звук, монтаж, студийные слоты и бренд-заказы", en: "video content, production lighting, sound, editing, studio slots and brand projects" },
  smm_agency: { ru: "контент-планы, таргет, аккаунты клиентов, KPI, подрядчики и ежемесячные ретейнеры", en: "content plans, paid social, client accounts, KPIs, contractors and monthly retainers" },
  web_studio: { ru: "сайты и лендинги, дизайн, разработка, хостинг, поддержка и проектные сроки", en: "websites and landing pages, design, development, hosting, support and project timelines" },
  design_studio: { ru: "брендинг и графический дизайн, брифы, правки, презентации и права на макеты", en: "branding and graphic design, briefs, revisions, presentations and design rights" },
  accounting_firm: { ru: "учет малого бизнеса, налоговая отчетность, ЭЦП, сроки сдачи и ответственность бухгалтера", en: "small-business accounting, tax filings, digital signatures, deadlines and accountant liability" },
  legal_consulting: { ru: "договоры и консультации, судебные риски, правовой анализ, конфиденциальность и кейсы", en: "contracts and consultations, litigation risks, legal analysis, confidentiality and cases" },
  hr_agency: { ru: "поиск персонала, вакансии, воронка кандидатов, гарантийная замена и success fee", en: "recruitment, vacancies, candidate funnels, replacement warranty and success fees" },
  outsourced_call_center: { ru: "операторы, скрипты, телефония, SLA, запись разговоров и контроль качества звонков", en: "operators, scripts, telephony, SLA, call recording and call-quality control" },
  marketing_agency: { ru: "маркетинговая стратегия, рекламные бюджеты, креативы, аналитика и KPI клиентов", en: "marketing strategy, ad budgets, creatives, analytics and client KPIs" },
  furniture_workshop: { ru: "мебель на заказ, раскрой, кромление, фурнитура, замеры и монтаж у клиента", en: "custom furniture, cutting, edging, hardware, measurements and on-site installation" },
  cabinet_furniture_factory: { ru: "корпусная мебель, серийный раскрой ЛДСП, кромка, фурнитура и производственная линия", en: "cabinet furniture, batch chipboard cutting, edging, hardware and production line" },
  sewing_workshop: { ru: "швейные операции, ткань, лекала, сменная мощность, контроль брака и заказчики", en: "sewing operations, fabric, patterns, shift capacity, defect control and clients" },
  school_uniform_production: { ru: "школьная форма, размерные ряды, сезонные предзаказы, ткань и сертификация", en: "school uniforms, size runs, seasonal preorders, fabric and certification" },
  bed_linen_production: { ru: "постельное белье, ткань по плотности, раскрой комплектов, упаковка и оптовые заказы", en: "bed linen, fabric density, set cutting, packaging and wholesale orders" },
  soft_toys_production: { ru: "мягкие игрушки, лекала, наполнитель, безопасность детей, швы и сертификация", en: "soft toys, patterns, filling, child safety, seams and certification" },
  plastic_windows_production: { ru: "пластиковые окна, профиль, стеклопакеты, замеры, сборка и монтажные бригады", en: "plastic windows, profiles, insulated glass units, measurements, assembly and installation teams" },
  door_production: { ru: "двери, полотна, коробки, фурнитура, окраска, склад и монтаж", en: "doors, leaves, frames, hardware, painting, storage and installation" },
  mini_printing_house: { ru: "печать, резка, ламинация, тиражи, бумага, тонер и корпоративные заказы", en: "printing, cutting, lamination, print runs, paper, toner and corporate orders" },
  packaging_bags_production: { ru: "пакеты и упаковка, пленка, печать, сварка, тиражи и отходы материала", en: "bags and packaging, film, printing, sealing, batches and material waste" },
  apartment_renovation_team: { ru: "ремонт квартир, бригады, сметы, материалы, этапы работ и гарантия", en: "apartment renovation, crews, estimates, materials, work stages and warranty" },
  air_conditioner_installation: { ru: "монтаж кондиционеров, трассы, вакуумирование, выездные бригады и сезонный спрос", en: "air-conditioner installation, line sets, vacuuming, field teams and seasonal demand" },
  cctv_installation: { ru: "IP-камеры, кабельные трассы, регистраторы, монтаж на объекте и сервисные договоры", en: "IP cameras, cable routes, recorders, on-site installation and maintenance contracts" },
  solar_panel_installation: { ru: "солнечные панели, инверторы, крепления, расчет мощности, монтаж и гарантия генерации", en: "solar panels, inverters, mounts, capacity sizing, installation and generation warranty" },
  blinds_production_installation: { ru: "жалюзи, замеры окон, ткань/ламели, карнизы, производство и монтаж", en: "blinds, window measurements, fabric or slats, rails, production and installation" },
  plumbing_services: { ru: "сантехнические заявки, трубы, фитинги, аварийные выезды, гарантия и материалы", en: "plumbing jobs, pipes, fittings, emergency calls, warranty and materials" },
  electrical_installation_services: { ru: "электромонтаж, щиты, кабель, допуски, безопасность и акт выполненных работ", en: "electrical installation, panels, cables, permits, safety and completion acts" },
  real_estate_agency: { ru: "объекты недвижимости, база собственников, показы, комиссия, договоры и проверка документов", en: "real estate listings, owner database, showings, commission, contracts and document checks" },
  rental_property_management: { ru: "управление квартирами, заселение, коммунальные платежи, ремонт и отчеты собственнику", en: "rental apartment management, move-ins, utilities, repairs and owner reporting" },
  interior_design: { ru: "дизайн-проекты, обмеры, визуализации, спецификации материалов и авторский надзор", en: "interior design projects, measurements, visuals, material specifications and site supervision" },
  greenhouse_farm: { ru: "тепличные культуры, отопление, капельный полив, урожайность, рассада и сезонные цены", en: "greenhouse crops, heating, drip irrigation, yields, seedlings and seasonal prices" },
  strawberry_farming: { ru: "клубника, рассада, капельный полив, сбор урожая, холодильное хранение и сезон продаж", en: "strawberries, seedlings, drip irrigation, harvesting, cold storage and sales season" },
  greens_farming: { ru: "зелень, быстрые циклы выращивания, семена, полив, срезка и ресторанные поставки", en: "greens, fast growing cycles, seeds, irrigation, cutting and restaurant supply" },
  poultry_farm: { ru: "птица, корм, вакцинация, яйценоскость/мясной выход, птичник и ветеринария", en: "poultry, feed, vaccination, egg or meat yield, poultry house and veterinary care" },
  quail_farm: { ru: "перепела, клетки, инкубация, корм, яйцо, тушка и ветеринарный контроль", en: "quails, cages, incubation, feed, eggs, carcasses and veterinary control" },
  mini_dairy_farm: { ru: "молочное стадо, корма, доение, охлаждение молока, ветеринария и сбыт", en: "dairy herd, feed, milking, milk cooling, veterinary care and sales" },
  cheese_production: { ru: "сыр, молоко, закваски, созревание, холодильники, санитария и упаковка", en: "cheese, milk, cultures, aging, refrigeration, sanitation and packaging" },
  dried_fruits_production: { ru: "сушка фруктов, сортировка, дегидраторы, влажность, упаковка и сезонное сырье", en: "fruit drying, sorting, dehydrators, moisture control, packaging and seasonal raw material" },
  nuts_dried_fruits_packaging: { ru: "фасовка орехов и сухофруктов, калибровка, упаковка, маркировка и срок хранения", en: "nuts and dried-fruit packing, grading, packaging, labeling and shelf life" },
  honey_apiary: { ru: "пасека, ульи, пчелосемьи, медосбор, тара, ветеринария и сезонность", en: "apiary, hives, bee colonies, honey flow, jars, veterinary checks and seasonality" },
  computer_club: { ru: "игровые ПК, почасовая загрузка, турниры, периферия, интернет и снеки", en: "gaming PCs, hourly utilization, tournaments, peripherals, internet and snacks" },
  playstation_club: { ru: "консоли PlayStation, игровые комнаты, геймпады, почасовая аренда и вечерняя загрузка", en: "PlayStation consoles, game rooms, controllers, hourly rental and evening utilization" },
  children_playroom: { ru: "детская игровая зона, безопасность, игрушки, аниматоры, дни рождения и родители", en: "children's play area, safety, toys, animators, birthdays and parents" },
  trampoline_center: { ru: "батуты, страховочные сетки, инструкторы, травмобезопасность, абонементы и дни рождения", en: "trampolines, safety nets, instructors, injury prevention, memberships and birthdays" },
  kids_party_organization: { ru: "детские праздники, аниматоры, реквизит, сценарии, площадки и сезонные даты", en: "kids parties, animators, props, scripts, venues and seasonal dates" },
  event_agency: { ru: "ивенты, подрядчики, сметы, техника, тайминг, корпоративные клиенты и авансы", en: "events, vendors, estimates, equipment, timing, corporate clients and advances" },
  karaoke_room: { ru: "караоке-залы, звуковое оборудование, бронирования, депозит, напитки и шумовые ограничения", en: "karaoke rooms, sound equipment, bookings, deposits, drinks and noise constraints" },
  board_game_club: { ru: "настольные игры, игротека, ведущие, почасовая посадка, напитки и турниры", en: "board games, game library, hosts, hourly seating, drinks and tournaments" },
  dance_studio: { ru: "танцевальные классы, зеркальный зал, расписание групп, тренеры и аренда зала", en: "dance classes, mirrored hall, group schedule, trainers and hall rental" },
  children_sports_section: { ru: "детская спортивная секция, тренеры, безопасность, инвентарь, расписание и справки", en: "children's sports section, coaches, safety, inventory, schedule and medical notes" },
  mini_hotel: { ru: "номерной фонд, загрузка, уборка номеров, бронирования, завтраки и регистрация гостей", en: "room inventory, occupancy, room cleaning, bookings, breakfasts and guest registration" },
  hostel: { ru: "койко-места, общие зоны, санитария, онлайн-бронирования, правила проживания и загрузка", en: "beds, common areas, sanitation, online bookings, house rules and occupancy" },
  guest_house: { ru: "гостевой дом, семейный сервис, комнаты, завтраки, туристический сезон и отзывы", en: "guest house, family service, rooms, breakfasts, tourist season and reviews" },
  travel_agency: { ru: "турпакеты, авиабилеты, визовая поддержка, поставщики туров, комиссии и предоплата", en: "tour packages, air tickets, visa support, tour suppliers, commissions and prepayment" },
  uzbekistan_tours: { ru: "туры по Узбекистану, гиды, транспорт, маршруты, музеи, сезонность и отзывы туристов", en: "Uzbekistan tours, guides, transport, routes, museums, seasonality and tourist reviews" },
  airport_transfer: { ru: "трансфер из аэропорта, рейсы, водители, ожидание, тарифы и встреча гостей", en: "airport transfer, flights, drivers, waiting time, tariffs and guest pickup" },
  bike_scooter_rental: { ru: "прокат велосипедов и самокатов, парк, залог, ремонт, GPS/учет и сезонная загрузка", en: "bike and scooter rental, fleet, deposits, repairs, GPS/accounting and seasonal utilization" },
  souvenir_shop: { ru: "локальные сувениры, ремесленники, туристический поток, подарочная упаковка и сезонность", en: "local souvenirs, artisans, tourist traffic, gift packaging and seasonality" },
  district_delivery_service: { ru: "локальная доставка, курьеры, радиус района, SLA, топливо и партнерские магазины", en: "local delivery, couriers, district radius, SLA, fuel and partner stores" },
  local_dark_store: { ru: "dark store, ходовые SKU, сборка заказов, курьеры, остатки и доставка за короткое время", en: "dark store, fast-moving SKUs, order picking, couriers, stock and short-time delivery" }
};

type TemplateCopy = Record<ApprovedBlockId, (theme: string, label: string) => { label: string; question: string }>;

function ruTemplates(family: SampleQuestionFamily): TemplateCopy {
  if (family === "retail") return {
    business_idea: (theme) => ({ label: "Ассортиментная матрица", question: `Какая стартовая ассортиментная матрица будет закрывать ${theme}, и какие позиции дадут основной оборот?` }),
    location: (theme) => ({ label: "Зал, витрина и склад", question: `Как торговый зал, витрина, примерочная/консультационная зона и склад должны быть устроены под ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Торговое оснащение", question: `Какие стеллажи, витрины, касса, учет и маркировка нужны, чтобы контролировать ${theme} без пересорта и потерь?` }),
    operations: (theme) => ({ label: "Остатки и обслуживание", question: `Как будет работать приемка, выкладка, консультация клиента, инвентаризация и обработка возвратов по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Закупка и оборачиваемость", question: `У каких поставщиков закупаются ${theme}, какие минимальные партии, наценка, отсрочка оплаты, сезонный запас и риск неликвида?` }),
    sales: (theme) => ({ label: "Продажи и сезонность", question: `Какие каналы и акции подтвердят спрос на ${theme}: трафик точки, соцсети, постоянные клиенты, сезонные пики и средний чек?` }),
    financing: (theme) => ({ label: "Финансирование товарного запаса", question: `Какая часть бюджета уйдет на стартовый запас по ${theme}, витрину, аренду, маркетинг и резерв на медленно продающиеся позиции?` }),
    documents_experience: (theme) => ({ label: "Документы и товарные требования", question: `Какие документы по товару, возвратам, кассе, маркировке, сертификатам или гарантиям нужно проверить для ${theme}?` })
  };
  if (family === "ecommerce") return {
    business_idea: (theme) => ({ label: "Онлайн-предложение", question: `Какие онлайн-категории и карточки товара будут продавать ${theme}, и чем они отличаются от маркетплейс-конкурентов?` }),
    location: (theme) => ({ label: "Склад и fulfillment", question: `Где будут храниться, комплектоваться и упаковываться заказы под ${theme}, и нужна ли точка самовывоза или dark-store зона?` }),
    equipment_launch: (theme) => ({ label: "Digital и упаковка", question: `Какие фото, контент, учет остатков, упаковка, интеграции и CRM нужны для запуска продаж по ${theme}?` }),
    operations: (theme) => ({ label: "Обработка заказов", question: `Как будет организован цикл заказа по ${theme}: прием оплаты, сборка, упаковка, доставка, обмены и возвраты?` }),
    suppliers_procurement: (theme) => ({ label: "Закупка онлайн-товара", question: `Какие поставщики, закупочные цены, минимальные партии, сроки поставки и брак/возвраты нужно заложить для ${theme}?` }),
    sales: (theme) => ({ label: "CAC и конверсия", question: `Какие каналы, контент и метрики подтвердят спрос на ${theme}: CAC, конверсия карточек, повторные заказы и отзывы?` }),
    financing: (theme) => ({ label: "Оборотка и маркетинг", question: `Сколько финансирования нужно на товарный запас, рекламу, упаковку, доставку и cash gap по возвратам для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Оферта и потребительские права", question: `Какие правила оферты, возвратов, персональных данных, чеков и сертификатов нужны для онлайн-продаж ${theme}?` })
  };
  if (family === "food_service") return {
    business_idea: (theme) => ({ label: "Меню и формат", question: `Какие позиции меню, рецептуры и формат обслуживания будут основой продаж для ${theme}?` }),
    location: (theme) => ({ label: "Кухня и поток гостей", question: `Какие требования к кухне, вытяжке, воде, посадке, витрине или delivery-зоне критичны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Кухонное оборудование", question: `Какие печи, холодильники, линии выдачи, POS, вентиляция и стартовый инвентарь нужны именно под ${theme}?` }),
    operations: (theme) => ({ label: "Производственный цикл", question: `Как будет выстроен ежедневный prep, готовка, выдача, контроль порций, график смен и списания по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Сырье и food cost", question: `Какие продукты, упаковка и расходники формируют food cost для ${theme}, кто поставщик и какой процент списаний нужен?` }),
    sales: (theme) => ({ label: "Средний чек и каналы", question: `Какие каналы продаж для ${theme} важнее: посадка, takeaway, доставка, офисные заказы, агрегаторы или повторные гости?` }),
    financing: (theme) => ({ label: "CapEx кухни и оборотка", question: `Какой бюджет нужен на кухонное оборудование, ремонт, санитарный запуск, стартовое сырье и резерв первых месяцев для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Санитария и разрешения", question: `Какие санитарные правила, медкнижки, договоры на вывоз отходов, касса и опыт повара нужны для ${theme}?` })
  };
  if (family === "beauty_wellness") return {
    business_idea: (theme) => ({ label: "Пакеты процедур", question: `Какие процедуры, пакеты и ценовые уровни будут основой предложения по ${theme}?` }),
    location: (theme) => ({ label: "Кабинеты и поток записи", question: `Какая планировка кабинетов, рабочих мест, ожидания и санитарной зоны нужна для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Рабочие места и стерилизация", question: `Какие рабочие места, аппараты, инструменты, стерилизация, расходники и мебель нужны для запуска ${theme}?` }),
    operations: (theme) => ({ label: "Мастера и качество", question: `Как будет считаться загрузка мастеров, длительность процедур, запись, контроль качества и повторные визиты по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Косметика и расходники", question: `Какие материалы, косметика, одноразовые расходники и сервис оборудования регулярно нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Запись и удержание", question: `Как будут привлекаться и возвращаться клиенты по ${theme}: Instagram, рекомендации, абонементы, пакеты или кросс-продажи?` }),
    financing: (theme) => ({ label: "Финансирование кабинетов", question: `Какая часть бюджета нужна на ремонт, кресла/кушетки, аппараты, стерилизацию, обучение мастеров и оборотку для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Санитария и квалификация", question: `Какие санитарные правила, сертификаты мастеров, согласия клиентов и ответственность за процедуру нужны для ${theme}?` })
  };
  if (family === "education") return {
    business_idea: (theme) => ({ label: "Программа и результат", question: `Какая программа, уровни, возрастные группы и измеримый результат обучения заложены в ${theme}?` }),
    location: (theme) => ({ label: "Аудитории и онлайн-формат", question: `Какие аудитории, онлайн-платформа, расписание и безопасность учеников нужны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Учебные материалы", question: `Какие учебники, техника, платформы, демонстрационные материалы и стартовая подготовка нужны для ${theme}?` }),
    operations: (theme) => ({ label: "Группы и преподаватели", question: `Как будут формироваться группы, расписание, нагрузка преподавателей, контроль прогресса и удержание учеников по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Материалы и лицензии", question: `Какие учебные материалы, подписки, расходники или партнерские программы регулярно нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Набор учеников", question: `Какие каналы набора, пробные уроки, результаты выпускников и рекомендации подтвердят спрос на ${theme}?` }),
    financing: (theme) => ({ label: "Финансирование учебного запуска", question: `Сколько нужно на аудитории, оборудование, рекламу набора, зарплаты преподавателей и резерв до набора групп для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Лицензия и договоры", question: `Какие лицензии, договоры с учениками/родителями, политика возвратов и квалификация преподавателей нужны для ${theme}?` })
  };
  if (family === "manufacturing") return {
    business_idea: (theme) => ({ label: "Спецификация продукции", question: `Какие изделия, спецификации, партии и требования клиента определяют производственную модель для ${theme}?` }),
    location: (theme) => ({ label: "Цех и склад", question: `Какая площадь, электричество, вентиляция, зона сырья, зона готовой продукции и логистика нужны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Линия и инструмент", question: `Какие станки, оснастка, монтаж, пусконаладка, сервис и запасные части критичны для ${theme}?` }),
    operations: (theme) => ({ label: "Мощность и брак", question: `Какой техпроцесс, сменность, план выпуска, норматив брака, контроль качества и узкие места есть у ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Сырье и комплектующие", question: `Какое сырье, комплектующие, упаковка, минимальные партии, валютные закупки и складской запас нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Заказы и каналы сбыта", question: `Какие B2B/B2C каналы, предзаказы, дилеры, образцы и цены подтвердят спрос на ${theme}?` }),
    financing: (theme) => ({ label: "CapEx производства", question: `Как финансируются оборудование, монтаж, сырьевой запас, сертификация, зарплаты запуска и оборотный капитал для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Сертификация и охрана труда", question: `Какие сертификаты продукции, требования к цеху, охране труда, маркировке и опыт технолога нужны для ${theme}?` })
  };
  if (family === "agriculture") return {
    business_idea: (theme) => ({ label: "Продукция и сезон", question: `Какая продукция, сезонный цикл, единица урожая/выхода и целевой покупатель заложены в ${theme}?` }),
    location: (theme) => ({ label: "Земля, вода и микроклимат", question: `Какие требования к земле, воде, теплу, вентиляции, пастбищу/помещению или хранению важны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Агрооборудование", question: `Какие теплицы, клетки, доильное/поливное оборудование, холодильники или инвентарь нужны для старта ${theme}?` }),
    operations: (theme) => ({ label: "Цикл выращивания/содержания", question: `Какой цикл производства, уход, ветеринария/агрономия, трудозатраты, потери и сезонные пики у ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Корма, семена и материалы", question: `Какие семена, корма, рассада, упаковка, препараты или тара нужны регулярно для ${theme}?` }),
    sales: (theme) => ({ label: "Сбыт урожая/продукции", question: `Куда будет продаваться продукция ${theme}: рынки, рестораны, опт, переработчики, контракты или прямые продажи?` }),
    financing: (theme) => ({ label: "Сезонная оборотка", question: `Какой запас денег нужен на сезон до выручки: корма/семена, энергия, работники, ветеринария, упаковка и логистика для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Ветеринария/агрономия и документы", question: `Какие ветеринарные, фитосанитарные, земельные, водные или санитарные требования и опыт нужны для ${theme}?` })
  };
  if (family === "entertainment") return {
    business_idea: (theme) => ({ label: "Формат досуга", question: `Какие сценарии посещения, длительность сессии и дополнительные продажи формируют предложение по ${theme}?` }),
    location: (theme) => ({ label: "Площадка и безопасность", question: `Какая площадь, зонирование, шум, безопасность, трафик и доступность нужны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Инвентарь и техника", question: `Какое оборудование, мебель, инвентарь, софт бронирования и обслуживание нужны для запуска ${theme}?` }),
    operations: (theme) => ({ label: "Загрузка и персонал", question: `Как будет считаться почасовая/сменная загрузка, расписание, персонал, контроль безопасности и уборка по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Расходники и сервис", question: `Какие расходники, ремонт, лицензии контента, напитки/снеки или сервисные поставщики нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Бронирования и события", question: `Какие каналы продаж подтвердят спрос на ${theme}: бронирования, дни рождения, турниры, абонементы, корпоративы или отзывы?` }),
    financing: (theme) => ({ label: "Финансирование площадки", question: `Сколько нужно на ремонт площадки, оборудование, депозит аренды, маркетинг открытия и резерв низкой загрузки для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Правила и ответственность", question: `Какие правила посещения, безопасность детей/гостей, договор аренды, касса, музыка/контент и ответственность нужны для ${theme}?` })
  };
  if (family === "tourism_hospitality") return {
    business_idea: (theme) => ({ label: "Гостевой продукт", question: `Какие типы номеров/туров/пакетов и целевые гости определяют выручку по ${theme}?` }),
    location: (theme) => ({ label: "Локация гостя", question: `Какие требования к району, доступу, парковке, санитарии, безопасности и туристическому потоку важны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Оснащение гостевого сервиса", question: `Какое оснащение номеров, reception, белье, транспорт, техника бронирования или экскурсионный инвентарь нужны для ${theme}?` }),
    operations: (theme) => ({ label: "Загрузка и сервис", question: `Как будет считаться загрузка, уборка/маршруты, график персонала, жалобы гостей и стандарты сервиса по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Поставщики гостевого опыта", question: `Какие поставщики белья, завтраков, транспорта, гидов, билетов, уборки или расходников нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Бронирования и сезонность", question: `Какие каналы дадут спрос на ${theme}: Booking/OTA, соцсети, туроператоры, корпоративы, отзывы и сезонные периоды?` }),
    financing: (theme) => ({ label: "Инвестиции в гостевой актив", question: `Сколько нужно на ремонт, оснащение, депозиты, маркетинг, оборотку низкого сезона и страховой резерв для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Регистрация гостей и договоры", question: `Какие требования к регистрации гостей, договорам, кассе, безопасности, страховке и опыту сервиса нужны для ${theme}?` })
  };
  if (family === "logistics" || family === "transport") return {
    business_idea: (theme) => ({ label: "Модель перевозки/доставки", question: `Какая единица услуги, тариф и тип клиента определяют модель выручки по ${theme}?` }),
    location: (theme) => ({ label: "Маршруты и зона", question: `Какая зона обслуживания, маршруты, точки ожидания, парковка, склад или диспетчерская нужны для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Парк и диспетчеризация", question: `Какой транспорт, связь, GPS, приложение, ремонтная база и стартовое оснащение нужны для ${theme}?` }),
    operations: (theme) => ({ label: "SLA и загрузка", question: `Как будут контролироваться загрузка рейсов/курьеров, SLA, график водителей, простои и претензии по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Топливо и сервис", question: `Какие расходы на топливо, ремонт, страховку, запчасти, комиссию агрегаторов и партнеров нужно заложить для ${theme}?` }),
    sales: (theme) => ({ label: "Контракты и повторные рейсы", question: `Какие клиенты, партнерские магазины, B2B-договоры, тарифы и повторные заказы подтвердят спрос на ${theme}?` }),
    financing: (theme) => ({ label: "Финансирование транспорта", question: `Как финансируются транспорт, лизинг, депозит, топливный запас, зарплаты водителей и оборотка для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Разрешения и ответственность", question: `Какие водительские, транспортные, страховые, договорные и кассовые требования нужны для ${theme}?` })
  };
  if (family === "real_estate") return {
    business_idea: (theme) => ({ label: "Объекты и комиссия", question: `Какие типы объектов, комиссия, клиентская сторона и ценность сервиса определяют модель ${theme}?` }),
    location: (theme) => ({ label: "География объектов", question: `В каких районах, сегментах недвижимости и каналах показов будет строиться база объектов для ${theme}?` }),
    equipment_launch: (theme) => ({ label: "CRM и материалы", question: `Какие CRM, телефония, фото/видео, шаблоны договоров и рабочие места нужны для запуска ${theme}?` }),
    operations: (theme) => ({ label: "Процесс сделки/управления", question: `Как будет устроен процесс заявки, проверки объекта, показа, переговоров, отчетности и контроля качества по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Подрядчики и база", question: `Какие партнеры, фотографы, юристы, ремонтники, рекламные площадки или базы объектов нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Лиды и конверсия", question: `Какие каналы лидов, рекомендации, объявления, конверсия показов и повторные клиенты подтвердят спрос на ${theme}?` }),
    financing: (theme) => ({ label: "Финансирование сервиса", question: `Сколько нужно на офис/CRM, рекламу объектов, зарплаты агентов, фото-контент и cash gap до комиссии для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Договоры и проверка документов", question: `Какие договоры с клиентами, акты, проверка права собственности, персональные данные и опыт сделок нужны для ${theme}?` })
  };
  return {
    business_idea: (theme) => ({ label: "Пакеты услуг", question: `Какие конкретные пакеты, сроки, результат для клиента и критерии приемки формируют предложение по ${theme}?` }),
    location: (theme) => ({ label: "Офис или зона выезда", question: `Нужен ли офис, склад, кабинет, выездная зона или удаленная модель для выполнения ${theme}?` }),
    equipment_launch: (theme) => ({ label: "Инструменты запуска", question: `Какие инструменты, транспорт, IT-системы, шаблоны, оборудование или обучение нужны для старта ${theme}?` }),
    operations: (theme) => ({ label: "SLA и качество", question: `Как будут измеряться сроки выполнения, загрузка команды, SLA, качество результата, гарантия и претензии по ${theme}?` }),
    suppliers_procurement: (theme) => ({ label: "Расходники и подрядчики", question: `Какие расходники, запчасти, подрядчики, сервисы или лицензии регулярно нужны для ${theme}?` }),
    sales: (theme) => ({ label: "Лиды и повторные услуги", question: `Какие каналы лидов, рекомендации, B2B-договоры, абонентское обслуживание или повторные заявки подтвердят спрос на ${theme}?` }),
    financing: (theme) => ({ label: "Финансирование сервиса", question: `Сколько нужно на инструменты, транспорт, рекламу, зарплаты, расходники и оборотку до первых оплат для ${theme}?` }),
    documents_experience: (theme) => ({ label: "Договоры и квалификация", question: `Какие договоры, акты, ответственность, квалификация специалистов и отраслевые требования нужны для ${theme}?` })
  };
}

function englishCopy(blockId: ApprovedBlockId, family: SampleQuestionFamily, theme: string): { label: string; question: string } {
  const familyLabel = family.replace(/_/g, " ");
  const labels: Record<ApprovedBlockId, string> = {
    business_idea: "Industry offer",
    location: "Premises and service area",
    equipment_launch: "Launch assets",
    operations: "Operating process",
    suppliers_procurement: "Procurement and unit cost",
    sales: "Demand and channels",
    financing: "Funding need",
    documents_experience: "Documents and expertise"
  };
  const questions: Record<ApprovedBlockId, string> = {
    business_idea: `Which exact ${familyLabel} offer, customer segment, pricing unit and differentiation will be built around ${theme}?`,
    location: `What premises, storage, service area, utilities, safety or customer-flow constraints are critical for ${theme}?`,
    equipment_launch: `Which launch assets, tools, equipment, software, installation, training and warranty support are required for ${theme}?`,
    operations: `How will capacity, staffing, schedule, quality control, warranty handling and bottlenecks be managed for ${theme}?`,
    suppliers_procurement: `Which goods, inputs, consumables, spare parts or subcontractors drive unit cost, payment terms and stock risk for ${theme}?`,
    sales: `Which channels, proof of demand, repeat-sales mechanics, seasonality and price benchmarks validate demand for ${theme}?`,
    financing: `How much funding is needed for launch assets, working capital, deposits, marketing and liquidity reserve for ${theme}?`,
    documents_experience: `Which contracts, permits, certificates, safety rules, tax/cash-register steps and team experience are required for ${theme}?`
  };
  return { label: labels[blockId], question: questions[blockId] };
}

function uzbekCopy(blockId: ApprovedBlockId, labelUz: string): { label: string; question: string } {
  const labels: Record<ApprovedBlockId, string> = {
    business_idea: "Sohaga xos taklif",
    location: "Joy va xizmat zonasi",
    equipment_launch: "Start aktivlari",
    operations: "Operatsion jarayon",
    suppliers_procurement: "Xarid va tannarx",
    sales: "Talab va sotuv kanallari",
    financing: "Moliyalashtirish ehtiyoji",
    documents_experience: "Hujjatlar va tajriba"
  };
  const questions: Record<ApprovedBlockId, string> = {
    business_idea: `${labelUz} bo'yicha aniq mahsulot/xizmat paketi, mijoz segmenti, narxlash birligi va raqobatchilardan farq nimadan iborat?`,
    location: `${labelUz} uchun joy, ombor, xizmat zonasi, kommunal sharoit, xavfsizlik va mijoz oqimi bo'yicha qaysi talablar muhim?`,
    equipment_launch: `${labelUz}ni ishga tushirish uchun qaysi uskuna, asbob, dastur, montaj, o'qitish va kafolat yordami kerak?`,
    operations: `${labelUz} bo'yicha quvvat, xodimlar, jadval, sifat nazorati, kafolat va tor joylar qanday boshqariladi?`,
    suppliers_procurement: `${labelUz} uchun qaysi tovar, xomashyo, sarf materiallari, ehtiyot qismlar yoki pudratchilar tannarx va zaxira riskini belgilaydi?`,
    sales: `${labelUz} bo'yicha talabni qaysi kanallar, test sotuvlar, takroriy mijozlar, mavsumiylik va narx taqqoslari tasdiqlaydi?`,
    financing: `${labelUz} uchun start aktivlari, aylanma kapital, depozit, marketing va likvidlik zaxirasiga qancha mablag' kerak?`,
    documents_experience: `${labelUz} uchun qaysi shartnomalar, ruxsatnomalar, sertifikatlar, xavfsizlik qoidalari, soliq/kassa va jamoa tajribasi kerak?`
  };
  return { label: labels[blockId], question: questions[blockId] };
}


type SampleQuestionBlueprint = {
  suffix: string;
  blockId: ApprovedBlockId;
  label: Record<AppLocale, string>;
  questionRu: (theme: string, sampleLabel: string) => string;
  questionEn: (theme: string, sampleLabel: string) => string;
  questionUz: (theme: string, sampleLabel: string) => string;
  affects?: string[];
  type?: InterviewQuestion["type"];
  unit?: string;
};

const familyIntro: Record<SampleQuestionFamily | "default", string> = {
  retail: "ассортимент, размерный/модельный ряд, сезонность, возвраты, хранение и поставщики",
  ecommerce: "онлайн-каталог, карточки товара, склад, упаковка, доставка, возвраты и маркетинг",
  food_service: "меню, рецептуры, кухня, санитария, списания, поток гостей и доставка",
  beauty_wellness: "услуги мастеров, запись, кабинеты, расходники, стерилизация и повторные визиты",
  education: "программы обучения, группы, преподаватели, расписание, материалы и результаты учеников",
  services: "пакеты услуг, выездная модель, квалификация, расходники, SLA, гарантия и повторные услуги",
  professional_services: "пакеты услуг, экспертиза команды, проектная работа, лиды, договоры и качество результата",
  it_digital: "digital-проекты, стек/инструменты, команда, сроки, SLA, лиды и повторная поддержка",
  manufacturing: "сырье, техпроцесс, оборудование, мощность, брак, склад и сбыт партий",
  construction: "бригады, сметы, объекты, материалы, график, качество работ и акты приемки",
  agriculture: "сезонный цикл, земля/вода, корма/семена, потери, хранение и сбыт урожая/продукции",
  entertainment: "сценарии посещения, площадка, безопасность, бронирования, события и загрузка",
  tourism_hospitality: "гостевой продукт, загрузка, бронирования, сервис, поставщики и сезонность",
  logistics: "маршруты, парк/курьеры, SLA, топливо, диспетчеризация и B2B-договоры",
  transport: "маршруты, транспорт, график водителей, тарифы, безопасность и договоры",
  real_estate: "база объектов, лиды, показы, договоры, проверка документов и комиссия",
  default: "операционная модель, клиенты, активы, закупки, продажи, документы и риски"
};

function themeContext(family: SampleQuestionFamily, seed: SampleQuestionSeed): string {
  const prefix = familyIntro[family] ?? familyIntro.default;
  return `${prefix}; профиль: ${seed.ru}`;
}

function themeContextEn(family: SampleQuestionFamily, seed: SampleQuestionSeed): string {
  const prefix: Record<SampleQuestionFamily | "default", string> = {
    retail: "assortment, size/model range, seasonality, returns, storage and suppliers",
    ecommerce: "online catalog, product cards, storage, packaging, delivery, returns and marketing",
    food_service: "menu, recipes, kitchen workflow, sanitation, write-offs, customer flow and delivery",
    beauty_wellness: "service menu, appointments, rooms, consumables, sterilization and repeat visits",
    education: "programs, groups, teachers, schedule, learning materials and student outcomes",
    services: "service packages, field-service model, qualification, consumables, SLA, warranty and repeat services",
    professional_services: "service packages, expert team, project delivery, leads, contracts and result quality",
    it_digital: "digital projects, stack/tools, team, deadlines, SLA, leads and recurring support",
    manufacturing: "raw materials, process, equipment, capacity, defects, storage and batch sales",
    construction: "teams, estimates, sites, materials, timeline, work quality and acceptance acts",
    agriculture: "seasonal cycle, land/water, feed/seeds, losses, storage and product sales",
    entertainment: "visit scenarios, venue, safety, bookings, events and utilization",
    tourism_hospitality: "guest product, occupancy, bookings, service, suppliers and seasonality",
    logistics: "routes, fleet/couriers, SLA, fuel, dispatching and B2B contracts",
    transport: "routes, vehicles, driver schedule, tariffs, safety and contracts",
    real_estate: "property base, leads, showings, contracts, document checks and commission",
    default: "operating model, customers, assets, procurement, sales, documents and risks"
  };
  return `${prefix[family] ?? prefix.default}; profile: ${seed.en}`;
}

function templateSetForFamily(family: SampleQuestionFamily): SampleQuestionBlueprint[] {
  const common: SampleQuestionBlueprint[] = [
    {
      suffix: "offer_packages",
      blockId: "business_idea",
      label: { ru: "Пакеты и продукт", en: "Offer packages", uz: "Taklif paketlari" },
      questionRu: (theme, sample) => `Какие 3–5 конкретных продукта или пакета будут продаваться в направлении «${sample}», чем отличается каждый пакет и какой результат получает клиент? Контекст проверки: ${theme}.`,
      questionEn: (theme, sample) => `Which 3-5 concrete products or packages will be sold in “${sample}”, how does each package differ, and what result does the customer receive? Validation context: ${theme}.`,
      questionUz: (_theme, sample) => `${sample} bo'yicha 3-5 aniq mahsulot yoki xizmat paketi qaysilar, ular nimasi bilan farq qiladi va mijoz qanday natija oladi?`
    },
    {
      suffix: "target_customer_value",
      blockId: "business_idea",
      label: { ru: "Клиент и ценность", en: "Customer and value", uz: "Mijoz va qiymat" },
      questionRu: (_theme, sample) => `Кто платит за «${sample}» в первую очередь, какая проблема клиента решается и почему он выберет вас, а не ближайших конкурентов?`,
      questionEn: (_theme, sample) => `Who is the primary paying customer in “${sample}”, which customer problem is solved, and why would they choose you over nearby competitors?`,
      questionUz: (_theme, sample) => `${sample} uchun asosiy to'lovchi mijoz kim, uning qaysi muammosi hal qilinadi va nima uchun u raqobatchilar o'rniga sizni tanlaydi?`
    },
    {
      suffix: "launch_format_stage",
      blockId: "business_idea",
      label: { ru: "Формат запуска", en: "Launch format", uz: "Start formati" },
      questionRu: (_theme, sample) => `Это новый запуск, расширение, партнерская модель, семейный бизнес или смешанный формат в проекте «${sample}», и что уже подтверждено на сегодня?`,
      questionEn: (_theme, sample) => `Is “${sample}” a new launch, expansion, partner model, family business, or mixed format, and what has already been confirmed?`,
      questionUz: (_theme, sample) => `${sample} yangi loyiha, kengayish, hamkorlik modeli, oilaviy biznes yoki aralash formatmi va hozirgacha nimalar tasdiqlangan?`
    },
    {
      suffix: "premises_storage_area",
      blockId: "location",
      label: { ru: "Помещение, склад и зона", en: "Premises, storage and area", uz: "Joy, ombor va zona" },
      questionRu: (theme, sample) => `Какая физическая инфраструктура нужна в проекте «${sample}»: торговая точка, офис, склад, цех, кабинет, кухня, зона выдачи или только выездная/онлайн-модель? Учтите: ${theme}.`,
      questionEn: (theme, sample) => `What physical infrastructure is needed in “${sample}”: retail point, office, storage, workshop, room, kitchen, pickup area, or field/online-only model? Consider: ${theme}.`,
      questionUz: (_theme, sample) => `${sample} uchun qaysi jismoniy infratuzilma kerak: savdo nuqtasi, ofis, ombor, sex, kabinet, oshxona, topshirish zonasi yoki faqat sayyor/onlayn model?`
    },
    {
      suffix: "location_constraints",
      blockId: "location",
      label: { ru: "Ограничения локации", en: "Location constraints", uz: "Joy cheklovlari" },
      questionRu: (_theme, sample) => `Какие ограничения локации критичны в проекте «${sample}»: трафик, доступ клиентов, парковка, электричество, вода, вентиляция, безопасность, шум, санитария или зона выезда?`,
      questionEn: (_theme, sample) => `Which location constraints are critical in “${sample}”: traffic, customer access, parking, power, water, ventilation, safety, noise, sanitation or service radius?`,
      questionUz: (_theme, sample) => `${sample} uchun qaysi joy cheklovlari muhim: mijoz oqimi, kirish, avtoturargoh, elektr, suv, ventilyatsiya, xavfsizlik, shovqin, sanitariya yoki xizmat radiusi?`
    },
    {
      suffix: "rent_and_readiness",
      blockId: "location",
      label: { ru: "Аренда и готовность", en: "Rent and readiness", uz: "Ijara va tayyorlik" },
      questionRu: (_theme, sample) => `Какой статус помещения/площадки в проекте «${sample}»: аренда, собственность, субаренда, договор с партнером или домашний формат, и какие вложения нужны до старта?`,
      questionEn: (_theme, sample) => `What is the premises/site status in “${sample}”: rent, ownership, sublease, partner agreement, or home-based format, and what preparation cost is needed before launch?`,
      questionUz: (_theme, sample) => `${sample} uchun joy maqomi qanday: ijara, mulk, subijara, hamkor bilan kelishuv yoki uy formati, va startgacha qanday tayyorgarlik xarajatlari kerak?`
    },
    {
      suffix: "core_assets_list",
      blockId: "equipment_launch",
      label: { ru: "Ключевые активы", en: "Core assets", uz: "Asosiy aktivlar" },
      questionRu: (theme, sample) => `Перечислите ключевые активы для запуска «${sample}»: оборудование, инструменты, IT/POS, транспорт, мебель, инвентарь, монтаж и обучение. Контекст: ${theme}.`,
      questionEn: (theme, sample) => `List the core launch assets in “${sample}”: equipment, tools, IT/POS, vehicles, furniture, inventory, installation and training. Context: ${theme}.`,
      questionUz: (_theme, sample) => `${sample} starti uchun asosiy aktivlarni sanang: uskuna, asboblar, IT/POS, transport, mebel, inventar, montaj va o'qitish.`
    },
    {
      suffix: "capex_service_warranty",
      blockId: "equipment_launch",
      label: { ru: "Стоимость и сервис", en: "Cost and service", uz: "Narx va servis" },
      questionRu: (_theme, sample) => `Какая стоимость стартовых активов в проекте «${sample}», что покупается новым/б/у, кто поставщик, какая гарантия и кто обслуживает оборудование?`,
      questionEn: (_theme, sample) => `What is the cost of launch assets in “${sample}”, what is bought new/used, who is the supplier, what warranty applies, and who services the equipment?`,
      questionUz: (_theme, sample) => `${sample} uchun start aktivlari qancha turadi, nimalar yangi/ishlatilgan olinadi, yetkazib beruvchi kim, kafolat qanday va servisni kim qiladi?`
    },
    {
      suffix: "startup_timeline_reserve",
      blockId: "equipment_launch",
      label: { ru: "Срок запуска и резерв", en: "Launch timeline and reserve", uz: "Start muddati va zaxira" },
      questionRu: (_theme, sample) => `Сколько времени нужно до запуска «${sample}», какие разовые расходы могут быть недооценены и какой резерв нужен на задержки, доставку или настройку?`,
      questionEn: (_theme, sample) => `How long is needed to launch “${sample}”, which one-time costs may be underestimated, and what reserve is needed for delays, delivery or setup?`,
      questionUz: (_theme, sample) => `${sample}ni ishga tushirishga qancha vaqt kerak, qaysi bir martalik xarajatlar kam baholanishi mumkin va kechikish/yetkazish/sozlash uchun qanday zaxira kerak?`
    },
    {
      suffix: "capacity_unit_process",
      blockId: "operations",
      label: { ru: "Мощность и процесс", en: "Capacity and process", uz: "Quvvat va jarayon" },
      questionRu: (theme, sample) => `Какая реалистичная мощность «${sample}» в день/месяц, сколько времени занимает один заказ/единица и какие узкие места ограничивают рост? Учтите: ${theme}.`,
      questionEn: (theme, sample) => `What is the realistic daily/monthly capacity in “${sample}”, how long does one order/unit take, and which bottlenecks limit growth? Consider: ${theme}.`,
      questionUz: (_theme, sample) => `${sample} uchun kunlik/oylik real quvvat qanday, bitta buyurtma/birlik qancha vaqt oladi va o'sishni qaysi tor joylar cheklaydi?`
    },
    {
      suffix: "staff_roles_schedule",
      blockId: "operations",
      label: { ru: "Команда и график", en: "Team and schedule", uz: "Jamoa va jadval" },
      questionRu: (_theme, sample) => `Какие роли нужны в проекте «${sample}», сколько людей на смене/бригаде, какая зарплата по ролям и какой график работы реалистичен?`,
      questionEn: (_theme, sample) => `Which roles are needed in “${sample}”, how many people per shift/team, what payroll by role, and what working schedule is realistic?`,
      questionUz: (_theme, sample) => `${sample} uchun qaysi rollar kerak, smena/brigadada nechta odam bo'ladi, rollar bo'yicha ish haqi va real ish jadvali qanday?`
    },
    {
      suffix: "quality_warranty_losses",
      blockId: "operations",
      label: { ru: "Качество, гарантия и потери", en: "Quality, warranty and losses", uz: "Sifat, kafolat va yo'qotishlar" },
      questionRu: (_theme, sample) => `Как контролируется качество «${sample}», какие ошибки/возвраты/переделки возможны, кто отвечает за гарантию и какой процент потерь допустим?`,
      questionEn: (_theme, sample) => `How is quality controlled in “${sample}”, which errors/returns/rework may occur, who handles warranty, and what loss percentage is acceptable?`,
      questionUz: (_theme, sample) => `${sample} bo'yicha sifat qanday nazorat qilinadi, qaysi xatolar/qaytarishlar/qayta ishlashlar bo'lishi mumkin, kafolatga kim javob beradi va qanday yo'qotish foizi qabul qilinadi?`
    },
    {
      suffix: "recurring_inputs_unit_cost",
      blockId: "suppliers_procurement",
      label: { ru: "Регулярные закупки", en: "Recurring purchases", uz: "Doimiy xaridlar" },
      questionRu: (theme, sample) => `Что регулярно закупается в проекте «${sample}»: товар, сырьё, расходники, комплектующие, упаковка, сервис или подрядчики, и как это влияет на себестоимость единицы? Контекст: ${theme}.`,
      questionEn: (theme, sample) => `What is purchased regularly in “${sample}”: goods, raw materials, consumables, components, packaging, service or subcontractors, and how does it affect unit cost? Context: ${theme}.`,
      questionUz: (_theme, sample) => `${sample} uchun doimiy nima xarid qilinadi: tovar, xomashyo, sarf materiallari, butlovchilar, qadoq, servis yoki pudratchilar, va bu birlik tannarxiga qanday ta'sir qiladi?`
    },
    {
      suffix: "supplier_terms_stock",
      blockId: "suppliers_procurement",
      label: { ru: "Условия поставщиков", en: "Supplier terms", uz: "Yetkazib beruvchi shartlari" },
      questionRu: (_theme, sample) => `Кто основные и запасные поставщики в проекте «${sample}», какие цены, минимальные партии, предоплата, сроки доставки, валюта и риск срыва поставки?`,
      questionEn: (_theme, sample) => `Who are the main and backup suppliers in “${sample}”, and what are prices, MOQs, prepayment, delivery times, currency and supply disruption risk?`,
      questionUz: (_theme, sample) => `${sample} uchun asosiy va zaxira yetkazib beruvchilar kim, narxlar, minimal partiyalar, oldindan to'lov, yetkazish muddati, valuta va uzilish riski qanday?`
    },
    {
      suffix: "inventory_turnover_writeoffs",
      blockId: "suppliers_procurement",
      label: { ru: "Запасы и списания", en: "Inventory and write-offs", uz: "Zaxira va hisobdan chiqarish" },
      questionRu: (_theme, sample) => `Какой минимальный запас нужен в проекте «${sample}», сколько дней он покрывает, что может испортиться/устареть/сломаться и как учитываются списания?`,
      questionEn: (_theme, sample) => `What minimum stock is needed in “${sample}”, how many days does it cover, what can expire/become obsolete/break, and how are write-offs tracked?`,
      questionUz: (_theme, sample) => `${sample} uchun minimal zaxira qanday, u necha kunga yetadi, nima buzilishi/eskirishi/sinishi mumkin va hisobdan chiqarish qanday yuritiladi?`
    },
    {
      suffix: "pricing_revenue_unit",
      blockId: "sales",
      label: { ru: "Цена и единица выручки", en: "Price and revenue unit", uz: "Narx va tushum birligi" },
      questionRu: (theme, sample) => `Как считается цена в «${sample}»: за единицу, чек, час, объект, пакет, подписку или договор, и какой средний чек реалистичен? Контекст спроса: ${theme}.`,
      questionEn: (theme, sample) => `How is pricing calculated in “${sample}”: per unit, ticket, hour, site, package, subscription or contract, and what average ticket is realistic? Demand context: ${theme}.`,
      questionUz: (_theme, sample) => `${sample}da narx qanday hisoblanadi: birlik, chek, soat, obyekt, paket, obuna yoki shartnoma bo'yicha, va real o'rtacha chek qancha?`
    },
    {
      suffix: "channels_conversion",
      blockId: "sales",
      label: { ru: "Каналы и конверсия", en: "Channels and conversion", uz: "Kanallar va konversiya" },
      questionRu: (_theme, sample) => `Какие 3 основных канала продаж дадут заявки в проекте «${sample}», какой бюджет на каждый канал, ожидаемая конверсия и стоимость привлечения клиента?`,
      questionEn: (_theme, sample) => `Which 3 main sales channels will generate leads in “${sample}”, what budget per channel, expected conversion and customer acquisition cost?`,
      questionUz: (_theme, sample) => `${sample} uchun qaysi 3 asosiy sotuv kanali ariza olib keladi, har bir kanal budjeti, kutilgan konversiya va mijoz jalb qilish narxi qanday?`
    },
    {
      suffix: "demand_validation_repeat",
      blockId: "sales",
      label: { ru: "Проверка спроса", en: "Demand validation", uz: "Talabni tekshirish" },
      questionRu: (_theme, sample) => `Как вы подтвердите спрос на «${sample}» до крупных затрат: тестовые продажи, заявки, предзаказы, письма о намерениях, отзывы или регулярные клиенты?`,
      questionEn: (_theme, sample) => `How will you validate demand in “${sample}” before major spending: test sales, leads, preorders, letters of intent, reviews or repeat customers?`,
      questionUz: (_theme, sample) => `${sample} bo'yicha katta xarajatlardan oldin talabni qanday tasdiqlaysiz: test savdo, arizalar, oldindan buyurtmalar, niyat xatlari, sharhlar yoki doimiy mijozlar?`
    },
    {
      suffix: "funding_sources_uses",
      blockId: "financing",
      label: { ru: "Источники и направления средств", en: "Sources and uses", uz: "Manbalar va mablag' yo'nalishi" },
      questionRu: (_theme, sample) => `Какие суммы нужны в проекте «${sample}» по направлениям: оборудование/активы, помещение, стартовый запас, маркетинг, зарплаты запуска и резерв?`,
      questionEn: (_theme, sample) => `What funding is needed in “${sample}” by use: equipment/assets, premises, starting stock, marketing, launch payroll and reserve?`,
      questionUz: (_theme, sample) => `${sample} uchun yo'nalishlar bo'yicha qancha mablag' kerak: uskuna/aktivlar, joy, start zaxirasi, marketing, start ish haqi va rezerv?`
    },
    {
      suffix: "working_capital_gap",
      blockId: "financing",
      label: { ru: "Оборотный капитал", en: "Working capital", uz: "Aylanma kapital" },
      questionRu: (_theme, sample) => `Сколько месяцев расходов должен покрывать резерв в проекте «${sample}», где возможен кассовый разрыв: закупки, зарплаты, аренда, отсрочка оплаты или сезонность?`,
      questionEn: (_theme, sample) => `How many months of expenses should the reserve cover in “${sample}”, and where can a cash gap arise: purchases, payroll, rent, payment delay or seasonality?`,
      questionUz: (_theme, sample) => `${sample} uchun zaxira necha oylik xarajatlarni yopishi kerak, pul uzilishi qayerda paydo bo'lishi mumkin: xaridlar, ish haqi, ijara, to'lov kechikishi yoki mavsumiylik?`
    },
    {
      suffix: "debt_leasing_collateral",
      blockId: "financing",
      label: { ru: "Кредит, лизинг и залог", en: "Loan, leasing and collateral", uz: "Kredit, lizing va garov" },
      questionRu: (_theme, sample) => `Если в проекте «${sample}» нужен кредит или лизинг, какая сумма, срок, ставка, график платежей, залог и запас прочности по платежам?`,
      questionEn: (_theme, sample) => `If “${sample}” needs a loan or leasing, what amount, term, rate, repayment schedule, collateral and payment safety margin are planned?`,
      questionUz: (_theme, sample) => `Agar ${sample} uchun kredit yoki lizing kerak bo'lsa, summa, muddat, stavka, to'lov jadvali, garov va to'lov zaxirasi qanday?`
    },
    {
      suffix: "legal_registration_contracts",
      blockId: "documents_experience",
      label: { ru: "Регистрация и договоры", en: "Registration and contracts", uz: "Ro'yxatdan o'tish va shartnomalar" },
      questionRu: (_theme, sample) => `Какая форма регистрации подходит в проекте «${sample}», какие договоры с клиентами/поставщиками, касса, акты и политика возвратов или гарантий нужны?`,
      questionEn: (_theme, sample) => `Which legal form fits “${sample}”, and which customer/supplier contracts, cash register, acceptance acts and return or warranty policy are needed?`,
      questionUz: (_theme, sample) => `${sample} uchun qaysi huquqiy shakl mos, mijoz/yetkazib beruvchi shartnomalari, kassa, aktlar va qaytarish yoki kafolat siyosati kerak?`
    },
    {
      suffix: "permits_safety_compliance",
      blockId: "documents_experience",
      label: { ru: "Разрешения и безопасность", en: "Permits and safety", uz: "Ruxsatlar va xavfsizlik" },
      questionRu: (_theme, sample) => `Какие отраслевые требования в проекте «${sample}» нужно проверить до запуска: санитария, пожарная безопасность, трудовые правила, лицензии, сертификаты, хранение химии/сырья или охрана труда?`,
      questionEn: (_theme, sample) => `Which industry requirements in “${sample}” must be checked before launch: sanitation, fire safety, labor rules, licenses, certificates, chemical/raw-material storage or occupational safety?`,
      questionUz: (_theme, sample) => `${sample} uchun ishga tushirishdan oldin qaysi soha talablari tekshiriladi: sanitariya, yong'in xavfsizligi, mehnat qoidalari, litsenziya, sertifikat, kimyo/xomashyo saqlash yoki mehnat muhofazasi?`
    },
    {
      suffix: "owner_team_experience",
      blockId: "documents_experience",
      label: { ru: "Опыт команды", en: "Team experience", uz: "Jamoa tajribasi" },
      questionRu: (_theme, sample) => `Какой опыт собственника и ключевых сотрудников подтверждает готовность запустить «${sample}», и каких компетенций пока не хватает?`,
      questionEn: (_theme, sample) => `What owner and key-staff experience proves readiness to launch “${sample}”, and which competencies are still missing?`,
      questionUz: (_theme, sample) => `${sample}ni ishga tushirishga tayyorlikni egasi va asosiy xodimlarning qaysi tajribasi tasdiqlaydi, va qaysi ko'nikmalar yetishmayapti?`
    }
  ];

  const familyAdditions: Partial<Record<SampleQuestionFamily, SampleQuestionBlueprint[]>> = {
    retail: [
      {
        suffix: "retail_size_assortment",
        blockId: "business_idea",
        label: { ru: "Ассортимент и размерный ряд", en: "Assortment and size/model range", uz: "Assortiment va o'lcham/model qatori" },
        questionRu: (theme) => `Какие категории, размерный или модельный ряд, сезонные позиции и товары-локомотивы будут формировать ассортимент? Уточнение: ${theme}.`,
        questionEn: (theme) => `Which categories, size/model range, seasonal items and traffic-driving SKUs will form the assortment? Detail: ${theme}.`,
        questionUz: () => `Assortimentni qaysi kategoriyalar, o'lcham/model qatori, mavsumiy pozitsiyalar va asosiy sotiladigan SKUlar shakllantiradi?`
      },
      {
        suffix: "retail_returns_certification",
        blockId: "documents_experience",
        label: { ru: "Возвраты и сертификаты", en: "Returns and certificates", uz: "Qaytarish va sertifikatlar" },
        questionRu: (_theme, sample) => `Какие правила обмена, возврата, гарантии, маркировки или сертификатов нужны в товарной категории «${sample}»?`,
        questionEn: (_theme, sample) => `Which exchange, return, warranty, labeling or certificate rules are needed in the product category “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} tovar kategoriyasi uchun almashtirish, qaytarish, kafolat, markirovka yoki sertifikat qoidalari qanday?`
      }
    ],
    ecommerce: [
      {
        suffix: "ecommerce_fulfillment_returns",
        blockId: "operations",
        label: { ru: "Fulfillment и возвраты", en: "Fulfillment and returns", uz: "Fulfillment va qaytarish" },
        questionRu: (_theme, sample) => `Как в «${sample}» будут обрабатываться заказ, оплата, сборка, упаковка, доставка, обмены, возвраты и спорные отзывы?`,
        questionEn: (_theme, sample) => `How will “${sample}” handle order intake, payment, picking, packing, delivery, exchanges, returns and disputed reviews?`,
        questionUz: (_theme, sample) => `${sample}da buyurtma, to'lov, yig'ish, qadoqlash, yetkazish, almashtirish, qaytarish va bahsli sharhlar qanday boshqariladi?`
      },
      {
        suffix: "ecommerce_card_metrics",
        blockId: "sales",
        label: { ru: "Карточки товара и метрики", en: "Product cards and metrics", uz: "Tovar kartalari va metrikalar" },
        questionRu: (_theme, sample) => `Какие фото, описания, отзывы, marketplace-комиссии, CAC, конверсия карточек и повторные заказы будут отслеживаться в проекте «${sample}»?`,
        questionEn: (_theme, sample) => `Which photos, descriptions, reviews, marketplace fees, CAC, card conversion and repeat orders will be tracked in “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} uchun foto, tavsif, sharhlar, marketplace komissiyalari, CAC, kartochka konversiyasi va takroriy buyurtmalar qanday kuzatiladi?`
      }
    ],
    food_service: [
      {
        suffix: "food_menu_recipe_cards",
        blockId: "operations",
        label: { ru: "Меню, рецептуры и списания", en: "Menu, recipe cards and waste", uz: "Menyu, retseptura va chiqim" },
        questionRu: (_theme, sample) => `Какие позиции меню в «${sample}» имеют рецептурные карты, порции, время приготовления, food cost и норму списаний?`,
        questionEn: (_theme, sample) => `Which menu items in “${sample}” have recipe cards, portion sizes, preparation time, food cost and write-off norms?`,
        questionUz: (_theme, sample) => `${sample}da qaysi menyu pozitsiyalari retsept kartasi, porsiya, tayyorlash vaqti, food cost va chiqim normasi bilan hisoblanadi?`
      },
      {
        suffix: "food_sanitary_delivery_flow",
        blockId: "location",
        label: { ru: "Кухня, санитария и выдача", en: "Kitchen, sanitation and handoff", uz: "Oshxona, sanitariya va topshirish" },
        questionRu: (_theme, sample) => `Какая кухня, вытяжка, вода, холодильники, витрина, посадка, takeaway/delivery-зона и санитарное разделение нужны в проекте «${sample}»?`,
        questionEn: (_theme, sample) => `Which kitchen, hood, water, refrigeration, display, seating, takeaway/delivery area and sanitary separation are needed in “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} uchun qaysi oshxona, tortish moslamasi, suv, sovutkich, vitrina, o'tirish joyi, takeaway/delivery zonasi va sanitariya ajratilishi kerak?`
      }
    ],
    services: [
      {
        suffix: "service_route_sla",
        blockId: "operations",
        label: { ru: "Выезды, SLA и претензии", en: "Field visits, SLA and claims", uz: "Chiqishlar, SLA va shikoyatlar" },
        questionRu: (_theme, sample) => `Как в проекте «${sample}» считаются выезды/заказы в день, время дороги, SLA, гарантийный повторный выезд и обработка претензий клиента?`,
        questionEn: (_theme, sample) => `How are daily visits/orders, travel time, SLA, warranty revisit and customer claims handled in “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} uchun kunlik chiqishlar/buyurtmalar, yo'l vaqti, SLA, kafolatli qayta chiqish va mijoz shikoyatlari qanday hisoblanadi?`
      },
      {
        suffix: "service_consumables_qualification",
        blockId: "suppliers_procurement",
        label: { ru: "Расходники и квалификация", en: "Consumables and qualification", uz: "Sarf materiallari va malaka" },
        questionRu: (_theme, sample) => `Какие расходники, инструмент, запчасти, допуски или квалификация специалистов напрямую влияют на качество и себестоимость «${sample}»?`,
        questionEn: (_theme, sample) => `Which consumables, tools, spare parts, approvals or specialist qualifications directly affect quality and unit cost in “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} sifati va tannarxiga qaysi sarf materiallari, asboblar, ehtiyot qismlar, ruxsatlar yoki mutaxassis malakasi bevosita ta'sir qiladi?`
      }
    ],
    professional_services: [
      {
        suffix: "professional_scope_deliverables",
        blockId: "business_idea",
        label: { ru: "Scope и результат", en: "Scope and deliverables", uz: "Scope va natija" },
        questionRu: (_theme, sample) => `Какие deliverables входят в «${sample}»: консультация, проект, отчет, креатив, внедрение, сопровождение, и где граница ответственности?`,
        questionEn: (_theme, sample) => `Which deliverables are included in “${sample}”: consultation, project, report, creative, implementation, support, and where does responsibility end?`,
        questionUz: (_theme, sample) => `${sample} tarkibiga qaysi natijalar kiradi: konsultatsiya, loyiha, hisobot, kreativ, joriy etish, qo'llab-quvvatlash, va javobgarlik chegarasi qayerda?`
      },
      {
        suffix: "professional_pipeline_hours",
        blockId: "operations",
        label: { ru: "Загрузка специалистов", en: "Specialist utilization", uz: "Mutaxassislar yuklamasi" },
        questionRu: (_theme, sample) => `Сколько часов специалистов требуется на один проект «${sample}», кто проверяет качество и как управляются дедлайны/правки?`,
        questionEn: (_theme, sample) => `How many specialist hours are needed for one “${sample}” project, who checks quality, and how are deadlines/revisions managed?`,
        questionUz: (_theme, sample) => `${sample}ning bitta loyihasi uchun mutaxassislarning necha soati kerak, sifatni kim tekshiradi va muddat/tuzatishlar qanday boshqariladi?`
      }
    ],
    manufacturing: [
      {
        suffix: "manufacturing_process_defects",
        blockId: "operations",
        label: { ru: "Техпроцесс и брак", en: "Process and defects", uz: "Texjarayon va brak" },
        questionRu: (_theme, sample) => `Какие этапы техпроцесса у «${sample}», где возникает брак, как он измеряется и какая мощность линии реалистична по сменам?`,
        questionEn: (_theme, sample) => `What are the production steps in “${sample}”, where do defects occur, how are they measured, and what line capacity is realistic by shift?`,
        questionUz: (_theme, sample) => `${sample} ishlab chiqarish bosqichlari qanday, brak qayerda paydo bo'ladi, u qanday o'lchanadi va smena bo'yicha liniya quvvati qanday?`
      },
      {
        suffix: "manufacturing_raw_material_waste",
        blockId: "suppliers_procurement",
        label: { ru: "Сырьё и отходы", en: "Raw materials and waste", uz: "Xomashyo va chiqindi" },
        questionRu: (_theme, sample) => `Какое сырьё и комплектующие нужны в проекте «${sample}», каков норматив отходов, минимальная партия закупки и требования к складу?`,
        questionEn: (_theme, sample) => `Which raw materials and components are needed in “${sample}”, what is the waste norm, MOQ and storage requirement?`,
        questionUz: (_theme, sample) => `${sample} uchun qaysi xomashyo va butlovchilar kerak, chiqindi normasi, minimal xarid partiyasi va ombor talablari qanday?`
      }
    ],
    agriculture: [
      {
        suffix: "agro_cycle_losses",
        blockId: "operations",
        label: { ru: "Сезонный цикл и потери", en: "Seasonal cycle and losses", uz: "Mavsumiy sikl va yo'qotishlar" },
        questionRu: (_theme, sample) => `Какой сезонный цикл у «${sample}», когда возникают основные расходы, когда появляется выручка и какие потери/падеж/усушка возможны?`,
        questionEn: (_theme, sample) => `What is the seasonal cycle in “${sample}”, when do major costs occur, when does revenue arrive, and what losses/mortality/shrinkage are possible?`,
        questionUz: (_theme, sample) => `${sample}ning mavsumiy sikli qanday, asosiy xarajatlar qachon bo'ladi, tushum qachon keladi va qaysi yo'qotishlar bo'lishi mumkin?`
      },
      {
        suffix: "agro_inputs_vet_agronomy",
        blockId: "suppliers_procurement",
        label: { ru: "Корма, семена и препараты", en: "Feed, seeds and treatments", uz: "Ozuqa, urug' va preparatlar" },
        questionRu: (_theme, sample) => `Какие корма, семена, рассада, препараты, удобрения, тара или ветеринарные/агрономические услуги нужны в проекте «${sample}» регулярно?`,
        questionEn: (_theme, sample) => `Which feed, seeds, seedlings, treatments, fertilizers, packaging or veterinary/agronomy services are regularly needed in “${sample}”?`,
        questionUz: (_theme, sample) => `${sample} uchun qaysi ozuqa, urug', ko'chat, preparat, o'g'it, tara yoki veterinariya/agronom xizmatlari doimiy kerak?`
      }
    ]
  };

  return [...common, ...(familyAdditions[family] ?? [])];
}


function themeSnippet(theme: string, locale: AppLocale): string {
  const cleaned = replaceForbiddenUserFacingTerms(theme, locale)
    .replace(/^.*?профиль:/i, "")
    .replace(/^.*?profile:/i, "")
    .replace(/^.*?:/i, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return "";
  const parts = cleaned.split(/[;,]/).map((part) => part.trim()).filter(Boolean).slice(0, 3);
  const snippet = (parts.length ? parts.join(", ") : cleaned).slice(0, 92).trim();
  return snippet.replace(/[.;:]$/, "");
}

function conciseQuestionByBlock(locale: AppLocale, blockId: ApprovedBlockId, sampleLabel: string, theme = ""): string {
  const safeSampleLabel = replaceForbiddenUserFacingTerms(sampleLabel, locale);
  const ru: Record<ApprovedBlockId, string> = {
    business_idea: `Какие продукты, услуги или пакеты будут продаваться в проекте «${safeSampleLabel}»?`,
    location: `Какая инфраструктура нужна проекту «${safeSampleLabel}»?`,
    equipment_launch: `Какие активы и оборудование нужны проекту «${safeSampleLabel}»?`,
    operations: `Как будет устроена ежедневная работа «${safeSampleLabel}»?`,
    suppliers_procurement: `Что закупается регулярно в проекте «${safeSampleLabel}»?`,
    sales: `Как подтвердить спрос, цену и каналы продаж в проекте «${safeSampleLabel}»?`,
    financing: `Какая структура финансирования нужна проекту «${safeSampleLabel}»?`,
    documents_experience: `Какие документы, требования и опыт нужны проекту «${safeSampleLabel}»?`
  };
  const uz: Record<ApprovedBlockId, string> = {
    business_idea: `«${safeSampleLabel}» loyihasida qaysi mahsulot, xizmat yoki paketlar sotiladi?`,
    location: `«${safeSampleLabel}»ni boshlash uchun qanday infratuzilma kerak?`,
    equipment_launch: `«${safeSampleLabel}»ni boshlash uchun qaysi aktivlar va uskunalar kerak?`,
    operations: `«${safeSampleLabel}» bo'yicha kundalik ish jarayoni qanday bo'ladi?`,
    suppliers_procurement: `«${safeSampleLabel}» uchun muntazam nimalar xarid qilinadi?`,
    sales: `«${safeSampleLabel}» bo'yicha talab, narx va sotuv kanallari qanday tasdiqlanadi?`,
    financing: `«${safeSampleLabel}»ni boshlash uchun qanday moliyalashtirish tuzilmasi kerak?`,
    documents_experience: `«${safeSampleLabel}»ni boshlash uchun qaysi hujjatlar, talablar va tajriba kerak?`
  };
  const en: Record<ApprovedBlockId, string> = {
    business_idea: `Which products, services or packages will be sold in “${safeSampleLabel}”?`,
    location: `What infrastructure is needed to launch “${safeSampleLabel}”?`,
    equipment_launch: `Which assets and equipment are needed to launch “${safeSampleLabel}”?`,
    operations: `How will daily operations work in “${safeSampleLabel}”?`,
    suppliers_procurement: `What will be purchased regularly for “${safeSampleLabel}”?`,
    sales: `How will demand, price and sales channels be validated for “${safeSampleLabel}”?`,
    financing: `What financing structure is needed to launch “${safeSampleLabel}”?`,
    documents_experience: `Which documents, requirements and experience are needed to launch “${safeSampleLabel}”?`
  };
  const base = locale === "uz" ? uz[blockId] : locale === "en" ? en[blockId] : ru[blockId];
  const snippet = themeSnippet(theme, locale);
  if (!snippet) return base;
  const suffix = locale === "en" ? ` Consider: ${snippet}.` : locale === "uz" ? ` Hisobga oling: ${snippet}.` : ` Учитывайте: ${snippet}.`;
  const candidate = `${base.replace(/[?.؟]$/, "?")} ${suffix}`.replace(/\s+/g, " ").trim();
  return candidate.length <= 220 ? candidate : base;
}

function appendThemeToQuestion(question: string, locale: AppLocale, theme: string): string {
  const snippet = themeSnippet(theme, locale);
  if (!snippet) return question;
  const normalizedQuestion = question.replace(/\s+/g, " ").trim();
  if (normalizedQuestion.toLowerCase().includes(snippet.toLowerCase().slice(0, 24))) return normalizedQuestion;
  const suffix = locale === "en" ? ` Consider: ${snippet}.` : locale === "uz" ? ` Hisobga oling: ${snippet}.` : ` Учитывайте: ${snippet}.`;
  return `${normalizedQuestion.replace(/[?.؟]$/, "?")} ${suffix}`.replace(/\s+/g, " ").trim();
}


function addLabelFocusToQuestion(question: string, locale: AppLocale, label: string): string {
  const cleanedLabel = replaceForbiddenUserFacingTerms(label, locale).replace(/[?.؟:]+$/g, "").trim();
  if (!cleanedLabel) return question;
  const suffix = locale === "en" ? ` Focus: ${cleanedLabel}.` : locale === "uz" ? ` Diqqat: ${cleanedLabel}.` : ` Уточните: ${cleanedLabel}.`;
  const candidate = `${question.replace(/[?.؟]$/, "?")}${suffix}`.replace(/\s+/g, " ").trim();
  return candidate.length <= 220 ? candidate : question;
}

function conciseHelpText(locale: AppLocale, blockId: ApprovedBlockId, theme: string): string {
  const intro = locale === "en" ? "Add practical details:" : locale === "uz" ? "Amaliy tafsilotlarni kiriting:" : "Укажите практические детали:";
  const fallback = locale === "en"
    ? "customers, price, costs, suppliers, documents and evidence."
    : locale === "uz"
      ? "mijozlar, narx, xarajatlar, yetkazib beruvchilar, hujjatlar va tasdiqlar."
      : "клиенты, цена, расходы, поставщики, документы и подтверждения.";
  const cleaned = replaceForbiddenUserFacingTerms(theme.replace(/^.*?профиль:/i, "профиль:").replace(/^.*?profile:/i, "profile:"), locale).trim();
  const text = cleaned ? `${intro} ${cleaned}.` : `${intro} ${fallback}`;
  return text.length > 700 ? `${text.slice(0, 697).trim()}...` : text;
}


function fieldSpecificFallbackQuestion(locale: AppLocale, blockId: ApprovedBlockId, sampleLabel: string, label: string): string {
  const safeLabel = replaceForbiddenUserFacingTerms(label, locale).replace(/[?.؟:]+$/g, "").trim();
  const safeSample = replaceForbiddenUserFacingTerms(sampleLabel, locale);
  if (locale === "uz") {
    const lower = safeLabel.toLowerCase();
    if (lower.includes("mijoz")) return "Asosiy mijoz kim va nima uchun sizni tanlaydi?";
    if (lower.includes("format")) return "Bu yangi start, kengayish, hamkorlik yoki oilaviy biznesmi?";
    if (lower.includes("narx")) return "Narx qanday belgilanadi va o'rtacha chek qancha?";
    if (lower.includes("talab")) return "Talabni qaysi dalillar bilan tasdiqlaysiz?";
    return `${safeLabel} bo'yicha qaysi ma'lumotlar va tasdiqlar bor?`;
  }
  if (locale === "en") {
    const lower = safeLabel.toLowerCase();
    if (lower.includes("customer")) return "Who is the main customer and why will they choose you?";
    if (lower.includes("launch")) return "Is this a new launch, expansion, partnership model or family business?";
    if (lower.includes("price")) return "How will pricing be set and what average ticket is realistic?";
    if (lower.includes("demand")) return "What evidence will validate demand before major spending?";
    return `What data and evidence do you have for ${safeLabel.toLowerCase()}?`;
  }
  const lower = safeLabel.toLowerCase();
  if (lower.includes("пакет") || lower.includes("продукт")) return "Какие 3-5 продукта, услуги или пакета вы будете продавать?";
  if (lower.includes("клиент") || lower.includes("ценност")) return "Кто основной покупатель и почему он выберет вас?";
  if (lower.includes("формат")) return "Это новый запуск, расширение, партнёрская модель или семейный бизнес?";
  if (lower.includes("инфраструктур")) return "Какая инфраструктура нужна для запуска?";
  if (lower.includes("локац") || lower.includes("огранич")) return "Какие ограничения локации нужно проверить до запуска?";
  if (lower.includes("аренд") || lower.includes("коммун")) return "Какие условия аренды и коммунальные расходы нужно подтвердить?";
  if (lower.includes("актив") || lower.includes("оборуд")) return "Какие активы и оборудование критичны для запуска?";
  if (lower.includes("стоимость") || lower.includes("сервис")) return "Какая стоимость, гарантия и сервис нужны по ключевым активам?";
  if (lower.includes("процесс") || lower.includes("мощност")) return "Какой процесс и месячная мощность реалистичны?";
  if (blockId === "operations" && (lower.includes("команд") || lower.includes("график") || lower.includes("роль") || lower.includes("смен"))) return "Какие роли, смены, зарплаты и график работы нужны для запуска?";
  if (lower.includes("персонал") || lower.includes("качество") || lower.includes("мастер")) return "Кто выполняет работу и как контролируется качество?";
  if (lower.includes("закуп")) return "Что закупается регулярно и как это влияет на себестоимость?";
  if (lower.includes("поставщик")) return "Кто основные и запасные поставщики и какие условия поставки?";
  if (lower.includes("запас") || lower.includes("списан")) return "Какой запас нужен и какие списания возможны?";
  if (lower.includes("цена") || lower.includes("выруч")) return "Как считается цена и какая единица выручки используется?";
  if (lower.includes("канал") || lower.includes("конверс")) return "Какие каналы продаж дадут заявки и как измеряется конверсия?";
  if (lower.includes("спрос")) return "Какими фактами будет подтверждён спрос до крупных затрат?";
  if (lower.includes("источник") || lower.includes("направлен")) return "Какие источники средств и направления расходов запланированы?";
  if (lower.includes("оборот")) return "Сколько месяцев расходов должен покрывать денежный резерв?";
  if (lower.includes("кредит") || lower.includes("лизинг") || lower.includes("залог")) return "Какие условия кредита, лизинга и залога нужно подтвердить?";
  if (lower.includes("регистрац") || lower.includes("договор")) return "Какая регистрация и какие договоры нужны до запуска?";
  if (lower.includes("разреш") || lower.includes("безопас")) return "Какие разрешения и требования безопасности нужно проверить?";
  if (lower.includes("опыт") || lower.includes("команд")) return "Какой опыт команды подтверждает готовность проекта?";
  return `Какие данные и подтверждения есть по теме «${safeLabel}»?`;
}

function stripEmbeddedContext(question: string): string {
  return question
    .replace(/\s*(Контекст проверки|Контекст спроса|Контекст|Уточнение|Учтите|Validation context|Demand context|Context|Detail|Consider):[\s\S]*$/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeLocalizedQuestion(locale: AppLocale, blockId: ApprovedBlockId, sampleLabel: string, label: string, question: string, theme: string) {
  const cleanedLabel = replaceForbiddenUserFacingTerms(label, locale).slice(0, 60).trim();
  const stripped = stripEmbeddedContext(replaceForbiddenUserFacingTerms(question, locale));
  const maxLength = locale === "en" ? 220 : 220;
  const themedQuestion = appendThemeToQuestion(stripped, locale, theme);
  const conciseFallback = fieldSpecificFallbackQuestion(locale, blockId, sampleLabel, cleanedLabel || label);
  const fallbackWithTheme = appendThemeToQuestion(conciseFallback, locale, theme);
  const finalQuestion = themedQuestion.length > maxLength ? (fallbackWithTheme.length <= maxLength ? fallbackWithTheme : conciseFallback) : themedQuestion;
  return {
    label: cleanedLabel || conciseFallback.split("?")[0],
    question: finalQuestion,
    helpText: conciseHelpText(locale, blockId, theme)
  };
}

function questionForBlueprint(sampleId: string, seed: SampleQuestionSeed, family: SampleQuestionFamily, blueprint: SampleQuestionBlueprint): InterviewQuestion {
  const labels = sampleLabelsById[sampleId] ?? { ru: sampleId, en: sampleId, uz: sampleId };
  const ruTheme = themeContext(family, seed);
  const enTheme = themeContextEn(family, seed);
  const ru = normalizeLocalizedQuestion("ru", blueprint.blockId, labels.ru, blueprint.label.ru, blueprint.questionRu(ruTheme, labels.ru), ruTheme);
  const en = normalizeLocalizedQuestion("en", blueprint.blockId, labels.en, blueprint.label.en, blueprint.questionEn(enTheme, labels.en), enTheme);
  const uz = normalizeLocalizedQuestion("uz", blueprint.blockId, labels.uz, blueprint.label.uz, blueprint.questionUz(labels.uz, labels.uz), labels.uz);
  const localizedCopy: LocalizedCopy = { ru, en, uz };
  return {
    key: `sample_${sampleId}_${blueprint.blockId}_${blueprint.suffix}`,
    label: ru.label,
    question: ru.question,
    type: blueprint.type ?? "textarea",
    unit: blueprint.unit,
    helpText: ru.helpText,
    optional: true,
    required: false,
    blockId: blueprint.blockId,
    semanticGroup: `sample_specific_${sampleId}_${blueprint.blockId}_${blueprint.suffix}`,
    affects: blueprint.affects ?? blockAffects[blueprint.blockId],
    localizedCopy,
    source: "sample",
    capabilityTags: ["sample_specific", sampleId, family, blueprint.blockId]
  };
}

export function sampleSpecificQuestionsForProfile(sampleId: string | undefined): InterviewQuestion[] {
  if (!sampleId) return [];
  const seed = sampleQuestionSeeds[sampleId];
  if (!seed) return [];
  const family = sampleCategoryById[sampleId] ?? "services";
  return templateSetForFamily(family).map((blueprint) => questionForBlueprint(sampleId, seed, family, blueprint));
}

export function sampleSpecificQuestionBlocks(sampleId: string | undefined): InterviewBlock[] {
  const questions = sampleSpecificQuestionsForProfile(sampleId);
  return approvedBlocks.map((id) => ({ id, name: id, description: id, questions: questions.filter((question) => question.blockId === id) }));
}

export function hasSampleSpecificSeed(sampleId: string): boolean {
  return Boolean(sampleQuestionSeeds[sampleId]);
}

export function sampleSpecificSeedCount(): number {
  return Object.keys(sampleQuestionSeeds).length;
}
