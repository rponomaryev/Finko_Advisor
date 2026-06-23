import type { BusinessCategory, BusinessProfile, OperationalModel } from "../../business/businessClassifier.ts";
type AppLocale = "ru" | "uz" | "en";
type LocalizedLabel = Record<AppLocale, string>;
type SampleProfile = Partial<Omit<BusinessProfile, "category" | "confidence">>;
const approvedSampleInterviewBlocks = [
  "business_idea",
  "location",
  "equipment_launch",
  "operations",
  "suppliers_procurement",
  "sales",
  "financing",
  "documents_experience"
] as const;

type BusinessSampleDefinition = {
  id: string;
  category: BusinessCategory;
  subcategory: string;
  label: LocalizedLabel;
  aliases: string[];
  profile?: SampleProfile;
  aiHints?: LocalizedLabel;
  sectorRisks?: Record<AppLocale, string[]>;
  keyDocuments?: string[];
};
const commonProfileLabels: Record<string, LocalizedLabel> = {
  ecommerce: { ru: "E-commerce", uz: "E-commerce", en: "E-commerce" },
  education: { ru: "Образование", uz: "Ta'lim", en: "Education" },
  beauty_wellness: { ru: "Beauty / wellness", uz: "Go'zallik / wellness", en: "Beauty / Wellness" },
  tourism_hospitality: { ru: "Туризм и гостиницы", uz: "Turizm va mehmonxona", en: "Tourism and Hospitality" },
  logistics: { ru: "Логистика", uz: "Logistika", en: "Logistics" },
  transport: { ru: "Транспорт", uz: "Transport", en: "Transport" },
  construction: { ru: "Строительство и ремонт", uz: "Qurilish va ta'mirlash", en: "Construction" },
  real_estate: { ru: "Недвижимость", uz: "Ko'chmas mulk", en: "Real Estate" },
  entertainment: { ru: "Развлечения и досуг", uz: "Ko'ngilochar xizmatlar", en: "Entertainment" },
  agriculture: { ru: "Сельское хозяйство", uz: "Qishloq xo'jaligi", en: "Agriculture" },
  it_digital: { ru: "IT и digital", uz: "IT va digital", en: "IT and Digital" },
  sample_retail_business: { ru: "Розничная торговля", uz: "Chakana savdo modeli", en: "Retail business" },
  sample_ecommerce_business: { ru: "Онлайн-торговля", uz: "Onlayn savdo modeli", en: "E-commerce business" },
  sample_food_service_business: { ru: "Общепит / готовая еда", uz: "Umumiy ovqatlanish modeli", en: "Food service business" },
  sample_service_business: { ru: "Сервисный бизнес", uz: "Xizmat biznesi", en: "Service business" },
  sample_beauty_business: { ru: "Beauty-сервис", uz: "Go'zallik xizmati", en: "Beauty service" },
  sample_education_business: { ru: "Образовательный центр", uz: "Ta'lim markazi", en: "Education center" },
  sample_professional_service_business: { ru: "Профессиональные услуги", uz: "Professional xizmatlar", en: "Professional services" },
  sample_manufacturing_business: { ru: "Производственный цех", uz: "Ishlab chiqarish sexi", en: "Manufacturing workshop" },
  sample_construction_business: { ru: "Строительно-монтажные услуги", uz: "Qurilish-montaj xizmatlari", en: "Construction services" },
  sample_agriculture_business: { ru: "Агробизнес", uz: "Agrobiznes", en: "Agribusiness" },
  sample_entertainment_location: { ru: "Развлекательная точка", uz: "Ko'ngilochar joy", en: "Entertainment venue" },
  sample_hospitality_business: { ru: "Гостинично-туристический бизнес", uz: "Mehmonxona-turizm biznesi", en: "Hospitality business" },
  sample_logistics_business: { ru: "Логистическая услуга", uz: "Logistika xizmati", en: "Logistics service" },
  sample_real_estate_service: { ru: "Услуги недвижимости", uz: "Ko'chmas mulk xizmatlari", en: "Real estate service" },
  retail_sale: { ru: "Розничная продажа", uz: "Chakana sotuv", en: "Retail sale" },
  online_sale: { ru: "Онлайн-продажа", uz: "Onlayn sotuv", en: "Online sale" },
  food_order: { ru: "Заказ еды", uz: "Ovqat buyurtmasi", en: "Food order" },
  subscription_or_lesson: { ru: "Абонемент / занятие", uz: "Abonement / dars", en: "Subscription / lesson" },
  rental_or_hourly_session: { ru: "Почасовая сессия / аренда", uz: "Soatlik sessiya / ijara", en: "Hourly session / rental" },
  production_order: { ru: "Производственный заказ", uz: "Ishlab chiqarish buyurtmasi", en: "Production order" },
  visit_or_booking: { ru: "Визит / бронирование", uz: "Tashrif / bron", en: "Visit / booking" },
  trip_or_delivery: { ru: "Рейс / доставка", uz: "Reys / yetkazib berish", en: "Trip / delivery" },
  sales_per_month: { ru: "Продаж в месяц", uz: "Oylik sotuvlar", en: "Sales per month" },
  orders_per_month: { ru: "Заказов в месяц", uz: "Oylik buyurtmalar", en: "Orders per month" },
  students_per_month: { ru: "Учеников в месяц", uz: "Oylik o'quvchilar", en: "Students per month" },
  sessions_per_month: { ru: "Сессий в месяц", uz: "Oylik sessiyalar", en: "Sessions per month" },
  production_units_per_month: { ru: "Единиц в месяц", uz: "Oylik birliklar", en: "Units per month" },
  bookings_per_month: { ru: "Бронирований в месяц", uz: "Oylik bronlar", en: "Bookings per month" },
  deliveries_per_month: { ru: "Доставок в месяц", uz: "Oylik yetkazib berishlar", en: "Deliveries per month" },
  customer_flow: { ru: "Поток клиентов", uz: "Mijozlar oqimi", en: "Customer flow" },
  utilization: { ru: "Загрузка мощности", uz: "Quvvatdan foydalanish", en: "Utilization" },
  pricing_model: { ru: "Модель цены", uz: "Narxlash modeli", en: "Pricing model" },
  equipment: { ru: "Оборудование", uz: "Uskunalar", en: "Equipment" },
  payroll: { ru: "Фонд оплаты труда", uz: "Ish haqi fondi", en: "Payroll" },
  marketing: { ru: "Маркетинг", uz: "Marketing", en: "Marketing" },
  utilities: { ru: "Коммунальные расходы", uz: "Kommunal xarajatlar", en: "Utilities" },
  working_capital: { ru: "Оборотный капитал", uz: "Aylanma kapital", en: "Working capital" },
  documents_compliance: { ru: "Документы и требования", uz: "Hujjatlar va talablar", en: "Documents and compliance" },
  location: { ru: "Локация", uz: "Lokatsiya", en: "Location" },
  inventory_turnover: { ru: "Оборачиваемость запасов", uz: "Zaxira aylanishi", en: "Inventory turnover" },
  equipment_service: { ru: "Сервис оборудования", uz: "Uskuna servisi", en: "Equipment service" },
  low_utilization: { ru: "Низкая загрузка", uz: "Past yuklama", en: "Low utilization" },
  licensing: { ru: "Лицензирование", uz: "Litsenziyalash", en: "Licensing" },
};

const baseBusinessSamples = [
  {
    id: "children_clothing_store_sample",
    category: "retail",
    subcategory: "children_clothing_store_sample",
    label: { ru: "Магазин детской одежды", uz: "Bolalar kiyimi do'koni", en: "Children's clothing store" },
    aliases: ["магазин детской одежды", "детская одежда", "bolalar kiyimi", "children clothing store"]
  },
  {
    id: "women_clothing_store",
    category: "retail",
    subcategory: "women_clothing_store",
    label: { ru: "Магазин женской одежды", uz: "Ayollar kiyimi do'koni", en: "Women's clothing store" },
    aliases: ["магазин женской одежды", "женская одежда", "ayollar kiyimi", "women clothing store"]
  },
  {
    id: "men_clothing_store",
    category: "retail",
    subcategory: "men_clothing_store",
    label: { ru: "Магазин мужской одежды", uz: "Erkaklar kiyimi do'koni", en: "Men's clothing store" },
    aliases: ["магазин мужской одежды", "мужская одежда", "erkaklar kiyimi", "men clothing store"]
  },
  {
    id: "shoe_store",
    category: "retail",
    subcategory: "shoe_store",
    label: { ru: "Магазин обуви", uz: "Poyabzal do'koni", en: "Shoe store" },
    aliases: ["магазин обуви", "обувной магазин", "poyabzal do'koni", "shoe store"]
  },
  {
    id: "bags_accessories_store",
    category: "retail",
    subcategory: "bags_accessories_store",
    label: { ru: "Магазин аксессуаров и сумок", uz: "Sumka va aksessuarlar do'koni", en: "Bags and accessories store" },
    aliases: ["магазин аксессуаров и сумок", "сумки и аксессуары", "bags accessories store"]
  },
  {
    id: "cosmetics_perfume_store",
    category: "retail",
    subcategory: "cosmetics_perfume_store",
    label: { ru: "Магазин косметики и парфюмерии", uz: "Kosmetika va parfyumeriya do'koni", en: "Cosmetics and perfume store" },
    aliases: ["магазин косметики", "парфюмерии", "косметика и парфюмерия", "cosmetics perfume store"]
  },
  {
    id: "household_chemicals_store",
    category: "retail",
    subcategory: "household_chemicals_store",
    label: { ru: "Магазин бытовой химии", uz: "Maishiy kimyo do'koni", en: "Household chemicals store" },
    aliases: ["магазин бытовой химии", "бытовая химия", "household chemicals store"]
  },
  {
    id: "stationery_store",
    category: "retail",
    subcategory: "stationery_store",
    label: { ru: "Магазин канцтоваров", uz: "Kanselyariya do'koni", en: "Stationery store" },
    aliases: ["магазин канцтоваров", "канцтовары", "stationery store"]
  },
  {
    id: "online_clothing_store",
    category: "ecommerce",
    subcategory: "online_clothing_store",
    label: { ru: "Интернет-магазин одежды", uz: "Onlayn kiyim do'koni", en: "Online clothing store" },
    aliases: ["интернет-магазин одежды", "онлайн магазин одежды", "online clothing store"]
  },
  {
    id: "online_home_goods_store",
    category: "ecommerce",
    subcategory: "online_home_goods_store",
    label: { ru: "Интернет-магазин товаров для дома", uz: "Uy uchun tovarlar onlayn do'koni", en: "Online home goods store" },
    aliases: ["интернет-магазин товаров для дома", "товары для дома онлайн", "online home goods store"]
  },
  {
    id: "small_coffee_shop",
    category: "food_service",
    subcategory: "small_coffee_shop",
    label: { ru: "Небольшая кофейня", uz: "Kichik qahvaxona", en: "Small coffee shop" },
    aliases: ["небольшая кофейня", "кофейня", "small coffee shop"]
  },
  {
    id: "neighborhood_bakery",
    category: "food_service",
    subcategory: "neighborhood_bakery",
    label: { ru: "Пекарня у дома", uz: "Mahalla nonvoyxonasi", en: "Neighborhood bakery" },
    aliases: ["пекарня у дома", "мини-пекарня", "пекарня", "bakery"]
  },
  {
    id: "mini_confectionery",
    category: "food_service",
    subcategory: "mini_confectionery",
    label: { ru: "Мини-кондитерская", uz: "Mini qandolatchilik", en: "Mini confectionery" },
    aliases: ["мини-кондитерская", "кондитерская", "confectionery"]
  },
  {
    id: "fast_food_cafe",
    category: "food_service",
    subcategory: "fast_food_cafe",
    label: { ru: "Кафе быстрого питания", uz: "Fast food kafesi", en: "Fast food cafe" },
    aliases: ["кафе быстрого питания", "фастфуд", "fast food cafe"]
  },
  {
    id: "lavash_shawarma_shop",
    category: "food_service",
    subcategory: "lavash_shawarma_shop",
    label: { ru: "Лавашная / шаурмичная", uz: "Lavash va shaorma nuqtasi", en: "Lavash / shawarma shop" },
    aliases: ["лавашная", "шаурмичная", "лаваш", "shawarma", "lavash"]
  },
  {
    id: "burger_shop",
    category: "food_service",
    subcategory: "burger_shop",
    label: { ru: "Бургерная", uz: "Burgerxona", en: "Burger shop" },
    aliases: ["бургерная", "бургер", "burger shop"]
  },
  {
    id: "pizza_delivery",
    category: "food_service",
    subcategory: "pizza_delivery",
    label: { ru: "Пиццерия с доставкой", uz: "Yetkazib berishli pitseriya", en: "Pizza delivery shop" },
    aliases: ["пиццерия с доставкой", "пиццерия", "pizza delivery"]
  },
  {
    id: "office_canteen",
    category: "food_service",
    subcategory: "office_canteen",
    label: { ru: "Столовая для офисов", uz: "Ofislar uchun oshxona", en: "Office canteen" },
    aliases: ["столовая для офисов", "офисная столовая", "office canteen"]
  },
  {
    id: "ready_meals_cookery",
    category: "food_service",
    subcategory: "ready_meals_cookery",
    label: { ru: "Кулинария с готовой едой", uz: "Tayyor ovqatlar do'koni", en: "Ready-meals cookery" },
    aliases: ["кулинария с готовой едой", "готовая еда", "ready meals"]
  },
  {
    id: "ice_cream_point",
    category: "food_service",
    subcategory: "ice_cream_point",
    label: { ru: "Точка по продаже мороженого", uz: "Muzqaymoq savdo nuqtasi", en: "Ice cream sales point" },
    aliases: ["точка по продаже мороженого", "мороженое", "ice cream point"]
  },
  {
    id: "hairdresser",
    category: "beauty_wellness",
    subcategory: "hairdresser",
    label: { ru: "Парикмахерская", uz: "Sartaroshxona", en: "Hairdresser" },
    aliases: ["парикмахерская", "салон парикмахерская", "hairdresser"]
  },
  {
    id: "barbershop",
    category: "beauty_wellness",
    subcategory: "barbershop",
    label: { ru: "Мужской барбершоп", uz: "Erkaklar barbershopi", en: "Men's barbershop" },
    aliases: ["барбершоп", "мужской барбершоп", "barbershop"]
  },
  {
    id: "beauty_salon_sample",
    category: "beauty_wellness",
    subcategory: "beauty_salon_sample",
    label: { ru: "Салон красоты", uz: "Go'zallik saloni", en: "Beauty salon" },
    aliases: ["салон красоты", "beauty salon"]
  },
  {
    id: "nail_studio",
    category: "beauty_wellness",
    subcategory: "nail_studio",
    label: { ru: "Маникюрный салон", uz: "Manikyur saloni", en: "Nail salon" },
    aliases: ["маникюрный салон", "маникюр", "nail salon"]
  },
  {
    id: "eyelash_studio",
    category: "beauty_wellness",
    subcategory: "eyelash_studio",
    label: { ru: "Студия наращивания ресниц", uz: "Kiprik uzaytirish studiyasi", en: "Eyelash extension studio" },
    aliases: ["студия наращивания ресниц", "наращивание ресниц", "eyelash studio"]
  },
  {
    id: "brow_studio",
    category: "beauty_wellness",
    subcategory: "brow_studio",
    label: { ru: "Студия бровей", uz: "Qosh studiyasi", en: "Brow studio" },
    aliases: ["студия бровей", "брови", "brow studio"]
  },
  {
    id: "cosmetology_cabinet",
    category: "beauty_wellness",
    subcategory: "cosmetology_cabinet",
    label: { ru: "Косметологический кабинет", uz: "Kosmetologiya kabineti", en: "Cosmetology cabinet" },
    aliases: ["косметологический кабинет", "косметология", "cosmetology"]
  },
  {
    id: "massage_cabinet",
    category: "beauty_wellness",
    subcategory: "massage_cabinet",
    label: { ru: "Массажный кабинет", uz: "Massaj kabineti", en: "Massage cabinet" },
    aliases: ["массажный кабинет", "массаж", "massage cabinet"]
  },
  {
    id: "fitness_studio",
    category: "beauty_wellness",
    subcategory: "fitness_studio",
    label: { ru: "Фитнес-студия", uz: "Fitnes studiya", en: "Fitness studio" },
    aliases: ["фитнес-студия", "фитнес студия", "fitness studio"]
  },
  {
    id: "yoga_studio",
    category: "beauty_wellness",
    subcategory: "yoga_studio",
    label: { ru: "Йога-студия", uz: "Yoga studiyasi", en: "Yoga studio" },
    aliases: ["йога-студия", "йога студия", "yoga studio"]
  },
  {
    id: "english_language_center",
    category: "education",
    subcategory: "english_language_center",
    label: { ru: "Учебный центр английского языка", uz: "Ingliz tili o'quv markazi", en: "English language center" },
    aliases: ["учебный центр английского языка", "английский язык", "english language center"]
  },
  {
    id: "ielts_preparation_center",
    category: "education",
    subcategory: "ielts_preparation_center",
    label: { ru: "Центр подготовки к IELTS", uz: "IELTS tayyorlov markazi", en: "IELTS preparation center" },
    aliases: ["центр подготовки к ielts", "подготовка к ielts", "ielts preparation"]
  },
  {
    id: "math_tutoring_center",
    category: "education",
    subcategory: "math_tutoring_center",
    label: { ru: "Репетиторский центр по математике", uz: "Matematika repetitorlik markazi", en: "Math tutoring center" },
    aliases: ["репетиторский центр по математике", "математика репетитор", "math tutoring"]
  },
  {
    id: "children_development_center",
    category: "education",
    subcategory: "children_development_center",
    label: { ru: "Детский развивающий центр", uz: "Bolalar rivojlantirish markazi", en: "Children development center" },
    aliases: ["детский развивающий центр", "развивающий центр", "children development center"]
  },
  {
    id: "private_kindergarten",
    category: "education",
    subcategory: "private_kindergarten",
    label: { ru: "Частный детский сад", uz: "Xususiy bolalar bog'chasi", en: "Private kindergarten" },
    aliases: ["частный детский сад", "детский сад", "private kindergarten"]
  },
  {
    id: "robotics_center_children",
    category: "education",
    subcategory: "robotics_center_children",
    label: { ru: "Центр робототехники для детей", uz: "Bolalar robototexnika markazi", en: "Robotics center for children" },
    aliases: ["центр робототехники для детей", "робототехника", "robotics center"]
  },
  {
    id: "it_courses_teenagers",
    category: "education",
    subcategory: "it_courses_teenagers",
    label: { ru: "IT-курсы для подростков", uz: "O'smirlar uchun IT kurslari", en: "IT courses for teenagers" },
    aliases: ["it-курсы для подростков", "it курсы", "it courses for teenagers"]
  },
  {
    id: "smm_digital_courses",
    category: "education",
    subcategory: "smm_digital_courses",
    label: { ru: "Курсы SMM и digital marketing", uz: "SMM va digital marketing kurslari", en: "SMM and digital marketing courses" },
    aliases: ["курсы smm", "digital marketing courses", "smm courses"]
  },
  {
    id: "music_school_studio",
    category: "education",
    subcategory: "music_school_studio",
    label: { ru: "Музыкальная школа / студия", uz: "Musiqa maktabi / studiyasi", en: "Music school / studio" },
    aliases: ["музыкальная школа", "музыкальная студия", "music school"]
  },
  {
    id: "chess_school",
    category: "education",
    subcategory: "chess_school",
    label: { ru: "Шахматная школа", uz: "Shaxmat maktabi", en: "Chess school" },
    aliases: ["шахматная школа", "шахматы", "chess school"]
  },
  {
    id: "car_wash_sample",
    category: "services",
    subcategory: "car_wash_sample",
    label: { ru: "Автомойка", uz: "Avto yuvish", en: "Car wash" },
    aliases: ["автомойка", "car wash"]
  },
  {
    id: "detailing_center",
    category: "services",
    subcategory: "detailing_center",
    label: { ru: "Детейлинг-центр", uz: "Deteyling markazi", en: "Detailing center" },
    aliases: ["детейлинг-центр", "детейлинг", "detailing center"]
  },
  {
    id: "tire_service",
    category: "services",
    subcategory: "tire_service",
    label: { ru: "Шиномонтаж", uz: "Shina montaj xizmati", en: "Tire service" },
    aliases: ["шиномонтаж", "tire service"]
  },
  {
    id: "auto_repair_shop",
    category: "services",
    subcategory: "auto_repair_shop",
    label: { ru: "СТО для легковых авто", uz: "Yengil avtomobillar uchun STO", en: "Passenger car repair shop" },
    aliases: ["сто для легковых авто", "автосервис легковых авто", "auto repair shop"]
  },
  {
    id: "auto_electrician",
    category: "services",
    subcategory: "auto_electrician",
    label: { ru: "Автоэлектрик", uz: "Avtoelektrik", en: "Auto electrician" },
    aliases: ["автоэлектрик", "auto electrician"]
  },
  {
    id: "auto_parts_store",
    category: "retail",
    subcategory: "auto_parts_store",
    label: { ru: "Магазин автозапчастей", uz: "Avto ehtiyot qismlar do'koni", en: "Auto parts store" },
    aliases: ["магазин автозапчастей", "автозапчасти", "auto parts store"]
  },
  {
    id: "auto_accessories_store",
    category: "retail",
    subcategory: "auto_accessories_store",
    label: { ru: "Продажа автоаксессуаров", uz: "Avto aksessuarlar savdosi", en: "Auto accessories sales" },
    aliases: ["продажа автоаксессуаров", "автоаксессуары", "auto accessories"]
  },
  {
    id: "car_rental",
    category: "services",
    subcategory: "car_rental",
    label: { ru: "Прокат автомобилей", uz: "Avtomobil ijarasi", en: "Car rental" },
    aliases: ["прокат автомобилей", "аренда автомобилей", "car rental"]
  },
  {
    id: "oil_change_service",
    category: "services",
    subcategory: "oil_change_service",
    label: { ru: "Сервис по замене масла", uz: "Moy almashtirish xizmati", en: "Oil change service" },
    aliases: ["сервис по замене масла", "замена масла", "oil change service"]
  },
  {
    id: "car_audio_alarm_installation",
    category: "services",
    subcategory: "car_audio_alarm_installation",
    label: { ru: "Установка автоакустики и сигнализации", uz: "Avtoakustika va signalizatsiya o'rnatish", en: "Car audio and alarm installation" },
    aliases: ["установка автоакустики", "установка сигнализации", "car audio alarm installation"]
  },
  {
    id: "phone_repair_workshop",
    category: "services",
    subcategory: "phone_repair_workshop",
    label: { ru: "Мастерская по ремонту телефонов", uz: "Telefon ta'mirlash ustaxonasi", en: "Phone repair workshop" },
    aliases: ["мастерская по ремонту телефонов", "ремонт телефонов", "phone repair"]
  },
  {
    id: "laptop_repair_workshop",
    category: "services",
    subcategory: "laptop_repair_workshop",
    label: { ru: "Мастерская по ремонту ноутбуков", uz: "Noutbuk ta'mirlash ustaxonasi", en: "Laptop repair workshop" },
    aliases: ["мастерская по ремонту ноутбуков", "ремонт ноутбуков", "laptop repair"]
  },
  {
    id: "home_appliance_repair",
    category: "services",
    subcategory: "home_appliance_repair",
    label: { ru: "Ремонт бытовой техники", uz: "Maishiy texnika ta'miri", en: "Home appliance repair" },
    aliases: ["ремонт бытовой техники", "бытовая техника ремонт", "home appliance repair"]
  },
  {
    id: "shoe_repair_workshop",
    category: "services",
    subcategory: "shoe_repair_workshop",
    label: { ru: "Мастерская по ремонту обуви", uz: "Poyabzal ta'mirlash ustaxonasi", en: "Shoe repair workshop" },
    aliases: ["мастерская по ремонту обуви", "ремонт обуви", "shoe repair"]
  },
  {
    id: "key_duplication_service",
    category: "services",
    subcategory: "key_duplication_service",
    label: { ru: "Изготовление ключей", uz: "Kalit nusxalash xizmati", en: "Key duplication service" },
    aliases: ["изготовление ключей", "дубликаты ключей", "key duplication"]
  },
  {
    id: "clothing_alteration_atelier",
    category: "services",
    subcategory: "clothing_alteration_atelier",
    label: { ru: "Ателье по ремонту одежды", uz: "Kiyim ta'mirlash atelyesi", en: "Clothing alteration atelier" },
    aliases: ["ателье по ремонту одежды", "ремонт одежды", "clothing alteration"]
  },
  {
    id: "dry_cleaning",
    category: "services",
    subcategory: "dry_cleaning",
    label: { ru: "Химчистка одежды", uz: "Kiyim kimyoviy tozalash", en: "Dry cleaning" },
    aliases: ["химчистка одежды", "химчистка", "dry cleaning"]
  },
  {
    id: "mini_laundry",
    category: "services",
    subcategory: "mini_laundry",
    label: { ru: "Мини-прачечная", uz: "Mini kir yuvish xizmati", en: "Mini laundry" },
    aliases: ["мини-прачечная", "прачечная", "mini laundry"]
  },
  {
    id: "cleaning_company",
    category: "services",
    subcategory: "cleaning_company",
    label: { ru: "Клининговая компания", uz: "Tozalash kompaniyasi", en: "Cleaning company" },
    aliases: ["клининговая компания", "клининговая служба", "клининговый сервис", "клининг", "cleaning company", "cleaning service"]
  },
  {
    id: "handyman_service",
    category: "services",
    subcategory: "handyman_service",
    label: { ru: "Сервис муж на час", uz: "Mayda ta'mir ustasi xizmati", en: "Handyman service" },
    aliases: ["муж на час", "мастер на час", "handyman service"]
  },
  {
    id: "photo_studio",
    category: "professional_services",
    subcategory: "photo_studio",
    label: { ru: "Фотостудия", uz: "Fotostudiya", en: "Photo studio" },
    aliases: ["фотостудия", "photo studio"]
  },
  {
    id: "video_content_studio",
    category: "professional_services",
    subcategory: "video_content_studio",
    label: { ru: "Видеостудия для контента", uz: "Kontent uchun video studiya", en: "Video content studio" },
    aliases: ["видеостудия для контента", "видеостудия", "video content studio"]
  },
  {
    id: "smm_agency",
    category: "professional_services",
    subcategory: "smm_agency",
    label: { ru: "SMM-агентство", uz: "SMM agentligi", en: "SMM agency" },
    aliases: ["smm-агентство", "smm агентство", "smm agency"]
  },
  {
    id: "web_studio",
    category: "it_digital",
    subcategory: "web_studio",
    label: { ru: "Веб-студия", uz: "Web studiya", en: "Web studio" },
    aliases: ["веб-студия", "web studio"]
  },
  {
    id: "design_studio",
    category: "professional_services",
    subcategory: "design_studio",
    label: { ru: "Дизайн-студия", uz: "Dizayn studiyasi", en: "Design studio" },
    aliases: ["дизайн-студия", "дизайн студия", "design studio"]
  },
  {
    id: "accounting_firm",
    category: "professional_services",
    subcategory: "accounting_firm",
    label: { ru: "Бухгалтерская фирма для малого бизнеса", uz: "Kichik biznes uchun buxgalteriya firmasi", en: "Accounting firm for small business" },
    aliases: ["бухгалтерская фирма", "бухгалтерские услуги", "accounting firm"]
  },
  {
    id: "legal_consulting",
    category: "professional_services",
    subcategory: "legal_consulting",
    label: { ru: "Юридическая консультация", uz: "Yuridik maslahat", en: "Legal consulting" },
    aliases: ["юридическая консультация", "юридические услуги", "legal consulting"]
  },
  {
    id: "hr_agency",
    category: "professional_services",
    subcategory: "hr_agency",
    label: { ru: "HR-агентство / подбор персонала", uz: "HR agentligi / xodim tanlash", en: "HR agency / recruitment" },
    aliases: ["hr-агентство", "подбор персонала", "hr agency", "recruitment"]
  },
  {
    id: "outsourced_call_center",
    category: "professional_services",
    subcategory: "outsourced_call_center",
    label: { ru: "Call-center на аутсорсе", uz: "Autsors call-center", en: "Outsourced call center" },
    aliases: ["call-center на аутсорсе", "колл центр аутсорс", "outsourced call center"]
  },
  {
    id: "marketing_agency",
    category: "professional_services",
    subcategory: "marketing_agency",
    label: { ru: "Маркетинговое агентство", uz: "Marketing agentligi", en: "Marketing agency" },
    aliases: ["маркетинговое агентство", "marketing agency"]
  },
  {
    id: "furniture_workshop",
    category: "manufacturing",
    subcategory: "furniture_workshop",
    label: { ru: "Мебельная мастерская", uz: "Mebel ustaxonasi", en: "Furniture workshop" },
    aliases: ["мебельная мастерская", "мебельная", "furniture workshop"]
  },
  {
    id: "cabinet_furniture_factory",
    category: "manufacturing",
    subcategory: "cabinet_furniture_factory",
    label: { ru: "Цех по производству корпусной мебели", uz: "Korpus mebel ishlab chiqarish sexi", en: "Cabinet furniture production workshop" },
    aliases: ["цех по производству корпусной мебели", "корпусная мебель", "cabinet furniture"]
  },
  {
    id: "sewing_workshop",
    category: "manufacturing",
    subcategory: "sewing_workshop",
    label: { ru: "Швейный цех", uz: "Tikuv sexi", en: "Sewing workshop" },
    aliases: ["швейный цех", "sewing workshop"]
  },
  {
    id: "school_uniform_production",
    category: "manufacturing",
    subcategory: "school_uniform_production",
    label: { ru: "Производство школьной формы", uz: "Maktab formasi ishlab chiqarish", en: "School uniform production" },
    aliases: ["производство школьной формы", "школьная форма", "school uniform production"]
  },
  {
    id: "bed_linen_production",
    category: "manufacturing",
    subcategory: "bed_linen_production",
    label: { ru: "Производство постельного белья", uz: "Choyshab ishlab chiqarish", en: "Bed linen production" },
    aliases: ["производство постельного белья", "постельное белье", "bed linen production"]
  },
  {
    id: "soft_toys_production",
    category: "manufacturing",
    subcategory: "soft_toys_production",
    label: { ru: "Производство мягких игрушек", uz: "Yumshoq o'yinchoqlar ishlab chiqarish", en: "Soft toys production" },
    aliases: ["производство мягких игрушек", "мягкие игрушки", "soft toys production"]
  },
  {
    id: "plastic_windows_production",
    category: "manufacturing",
    subcategory: "plastic_windows_production",
    label: { ru: "Производство пластиковых окон", uz: "Plastik derazalar ishlab chiqarish", en: "Plastic windows production" },
    aliases: ["производство пластиковых окон", "пластиковые окна", "plastic windows"]
  },
  {
    id: "door_production",
    category: "manufacturing",
    subcategory: "door_production",
    label: { ru: "Производство дверей", uz: "Eshik ishlab chiqarish", en: "Door production" },
    aliases: ["производство дверей", "двери производство", "door production"]
  },
  {
    id: "mini_printing_house",
    category: "manufacturing",
    subcategory: "mini_printing_house",
    label: { ru: "Мини-типография", uz: "Mini tipografiya", en: "Mini printing house" },
    aliases: ["мини-типография", "типография", "mini printing house"]
  },
  {
    id: "packaging_bags_production",
    category: "manufacturing",
    subcategory: "packaging_bags_production",
    label: { ru: "Производство упаковки и пакетов", uz: "Qadoqlash va paketlar ishlab chiqarish", en: "Packaging and bags production" },
    aliases: ["производство упаковки и пакетов", "упаковка и пакеты", "packaging bags production"]
  },
  {
    id: "apartment_renovation_team",
    category: "construction",
    subcategory: "apartment_renovation_team",
    label: { ru: "Бригада по ремонту квартир", uz: "Kvartira ta'mirlash brigadasi", en: "Apartment renovation team" },
    aliases: ["бригада по ремонту квартир", "ремонт квартир", "apartment renovation"]
  },
  {
    id: "air_conditioner_installation",
    category: "services",
    subcategory: "air_conditioner_installation",
    label: { ru: "Компания по установке кондиционеров", uz: "Konditsioner o'rnatish kompaniyasi", en: "Air conditioner installation company" },
    aliases: [
      "установка кондиционеров",
      "установка кондиционера",
      "монтаж кондиционеров",
      "монтаж кондиционера",
      "обслуживание кондиционеров",
      "кондиционер установка",
      "кондиционеры установка",
      "air conditioner installation",
      "air conditioning installation",
      "konditsioner o'rnatish"
    ],
    profile: {
      operationalModel: "mobile_service",
      businessModel: "air_conditioner_installation_service",
      primaryRevenueModel: "installation_project",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasInventory: true,
      sellsGoods: true,
      hasB2BContracts: true
    }
  },
  {
    id: "cctv_installation",
    category: "services",
    subcategory: "cctv_installation",
    label: { ru: "Установка видеонаблюдения", uz: "Videokuzatuv o'rnatish", en: "CCTV installation" },
    aliases: [
      "установка видеонаблюдения",
      "видеонаблюдение",
      "видеонаблюдения",
      "услуги видеонаблюдения",
      "монтаж видеонаблюдения",
      "монтаж камер видеонаблюдения",
      "установка камер видеонаблюдения",
      "ip камеры",
      "ip-камеры",
      "видеокамеры",
      "системы видеонаблюдения",
      "cctv installation",
      "cctv services",
      "video surveillance installation",
      "security camera installation",
      "videokuzatuv",
      "videokuzatuv o'rnatish"
    ],
    profile: {
      operationalModel: "mobile_service",
      businessModel: "cctv_installation_service",
      primaryRevenueModel: "installation_project",
      revenueUnit: "installation_project",
      capacityUnit: "projects_per_month",
      providesServices: true,
      sellsGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: false,
      usesPremises: false,
      usesMobileService: true,
      hasStaff: true,
      hasB2BContracts: true,
      hasWalkInTraffic: false,
      hasCustomerFlowDependency: false,
      hasCurrencyExposure: true,
      hasCreditOrLeasingNeed: true,
      keyCostDrivers: ["cameras_recorders_cable", "installation_team", "transport", "tools", "warranty_service", "marketing"],
      keyRevenueDrivers: ["objects_per_month", "average_project_ticket", "b2b_contracts", "maintenance_contracts", "equipment_margin"],
      keyRisks: ["installation_quality_claims", "equipment_warranty", "supplier_availability", "travel_time", "low_b2b_pipeline"],
      additionalInterviewTopics: ["camera_types", "objects_per_month", "installation_crews", "cable_and_camera_stock", "warranty_policy", "maintenance_contracts", "b2b_client_segments"],
      documentCategories: ["registration", "tax", "contracts", "warranty_terms", "labor_safety", "cash_register", "no_special_license"],
      documentProfile: "standard_service",
      needsSpecialLicense: false
    }
  },
  {
    id: "solar_panel_installation",
    category: "services",
    subcategory: "solar_panel_installation",
    label: { ru: "Установка солнечных панелей", uz: "Quyosh panellari o'rnatish", en: "Solar panel installation" },
    aliases: ["установка солнечных панелей", "установка солнечной панели", "монтаж солнечных панелей", "монтаж солнечной панели", "солнечные панели", "солнечных панелей", "solar panel installation", "solar panels installation", "quyosh panellari o'rnatish"],
    profile: {
      operationalModel: "mobile_service",
      businessModel: "solar_panel_installation_service",
      primaryRevenueModel: "installation_project",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasInventory: true,
      sellsGoods: true,
      hasB2BContracts: true
    }
  },
  {
    id: "blinds_production_installation",
    category: "manufacturing",
    subcategory: "blinds_production_installation",
    label: { ru: "Производство и монтаж жалюзи", uz: "Jalyuzi ishlab chiqarish va o'rnatish", en: "Blinds production and installation" },
    aliases: ["производство и монтаж жалюзи", "жалюзи", "blinds production installation"]
  },
  {
    id: "plumbing_services",
    category: "services",
    subcategory: "plumbing_services",
    label: { ru: "Сантехнические услуги", uz: "Santexnika xizmatlari", en: "Plumbing services" },
    aliases: ["сантехнические услуги", "сантехнических услуг", "услуги сантехника", "сантехник", "сантехника", "сантехники", "монтаж сантехники", "plumbing services", "plumber services", "santexnika xizmatlari"],
    profile: {
      operationalModel: "mobile_service",
      businessModel: "plumbing_mobile_service",
      primaryRevenueModel: "service_visit",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasInventory: true,
      hasB2BContracts: true
    }
  },
  {
    id: "electrical_installation_services",
    category: "services",
    subcategory: "electrical_installation_services",
    label: { ru: "Электромонтажные услуги", uz: "Elektr montaj xizmatlari", en: "Electrical installation services" },
    aliases: ["электромонтажные услуги", "электромонтажных услуг", "услуги электрика", "электрик", "электрика", "электрики", "монтаж электрики", "электромонтаж", "electrical installation", "electrician services", "elektr montaj xizmatlari"],
    profile: {
      operationalModel: "mobile_service",
      businessModel: "electrical_installation_service",
      primaryRevenueModel: "service_project",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasInventory: true,
      hasB2BContracts: true
    }
  },
  {
    id: "real_estate_agency",
    category: "real_estate",
    subcategory: "real_estate_agency",
    label: { ru: "Агентство недвижимости", uz: "Ko'chmas mulk agentligi", en: "Real estate agency" },
    aliases: ["агентство недвижимости", "риэлторское агентство", "real estate agency"]
  },
  {
    id: "rental_property_management",
    category: "real_estate",
    subcategory: "rental_property_management",
    label: { ru: "Управление арендными квартирами", uz: "Ijaradagi kvartiralarni boshqarish", en: "Rental property management" },
    aliases: ["управление арендными квартирами", "арендные квартиры управление", "rental property management"]
  },
  {
    id: "interior_design",
    category: "professional_services",
    subcategory: "interior_design",
    label: { ru: "Дизайн интерьера", uz: "Interyer dizayni", en: "Interior design" },
    aliases: ["дизайн интерьера", "interior design"]
  },
  {
    id: "greenhouse_farm",
    category: "agriculture",
    subcategory: "greenhouse_farm",
    label: { ru: "Тепличное хозяйство", uz: "Issiqxona xo'jaligi", en: "Greenhouse farm" },
    aliases: ["тепличное хозяйство", "теплица", "greenhouse farm"]
  },
  {
    id: "strawberry_farming",
    category: "agriculture",
    subcategory: "strawberry_farming",
    label: { ru: "Выращивание клубники", uz: "Qulupnay yetishtirish", en: "Strawberry farming" },
    aliases: ["выращивание клубники", "клубника", "strawberry farming"]
  },
  {
    id: "greens_farming",
    category: "agriculture",
    subcategory: "greens_farming",
    label: { ru: "Выращивание зелени", uz: "Ko'kat yetishtirish", en: "Greens farming" },
    aliases: ["выращивание зелени", "зелень", "greens farming"]
  },
  {
    id: "poultry_farm",
    category: "agriculture",
    subcategory: "poultry_farm",
    label: { ru: "Птицеферма", uz: "Parrandachilik fermasi", en: "Poultry farm" },
    aliases: ["птицеферма", "poultry farm"]
  },
  {
    id: "quail_farm",
    category: "agriculture",
    subcategory: "quail_farm",
    label: { ru: "Перепелиная ферма", uz: "Bedana fermasi", en: "Quail farm" },
    aliases: ["перепелиная ферма", "перепела", "quail farm"]
  },
  {
    id: "mini_dairy_farm",
    category: "agriculture",
    subcategory: "mini_dairy_farm",
    label: { ru: "Мини-молочная ферма", uz: "Mini sut fermasi", en: "Mini dairy farm" },
    aliases: ["мини-молочная ферма", "молочная ферма", "mini dairy farm"]
  },
  {
    id: "cheese_production",
    category: "manufacturing",
    subcategory: "cheese_production",
    label: { ru: "Производство сыра", uz: "Pishloq ishlab chiqarish", en: "Cheese production" },
    aliases: ["производство сыра", "сыр производство", "cheese production"]
  },
  {
    id: "dried_fruits_production",
    category: "manufacturing",
    subcategory: "dried_fruits_production",
    label: { ru: "Производство сухофруктов", uz: "Quritilgan mevalar ishlab chiqarish", en: "Dried fruits production" },
    aliases: ["производство сухофруктов", "сухофрукты производство", "dried fruits production"]
  },
  {
    id: "nuts_dried_fruits_packaging",
    category: "manufacturing",
    subcategory: "nuts_dried_fruits_packaging",
    label: { ru: "Фасовка орехов и сухофруктов", uz: "Yong'oq va quritilgan mevalarni qadoqlash", en: "Nuts and dried fruits packaging" },
    aliases: ["фасовка орехов и сухофруктов", "фасовка орехов", "nuts dried fruits packaging"]
  },
  {
    id: "honey_apiary",
    category: "agriculture",
    subcategory: "honey_apiary",
    label: { ru: "Медовая пасека", uz: "Asalarichilik xo'jaligi", en: "Honey apiary" },
    aliases: ["медовая пасека", "пасека", "honey apiary"]
  },
  {
    id: "computer_club",
    category: "entertainment",
    subcategory: "computer_club",
    label: { ru: "Компьютерный клуб", uz: "Kompyuter klubi", en: "Computer club" },
    aliases: ["компьютерный клуб", "компьютерный клуб и игровая зона", "игровой компьютерный клуб", "computer club", "gaming club"]
  },
  {
    id: "playstation_club",
    category: "entertainment",
    subcategory: "playstation_club",
    label: { ru: "PlayStation-клуб", uz: "PlayStation klubi", en: "PlayStation club" },
    aliases: ["playstation-клуб", "playstation клуб", "ps клуб", "playstation club"]
  },
  {
    id: "children_playroom",
    category: "entertainment",
    subcategory: "children_playroom",
    label: { ru: "Детская игровая комната", uz: "Bolalar o'yin xonasi", en: "Children playroom" },
    aliases: ["детская игровая комната", "игровая комната", "children playroom"]
  },
  {
    id: "trampoline_center",
    category: "entertainment",
    subcategory: "trampoline_center",
    label: { ru: "Батутный центр", uz: "Batut markazi", en: "Trampoline center" },
    aliases: ["батутный центр", "батут", "trampoline center"]
  },
  {
    id: "kids_party_organization",
    category: "entertainment",
    subcategory: "kids_party_organization",
    label: { ru: "Организация детских праздников", uz: "Bolalar bayramlarini tashkil etish", en: "Kids party organization" },
    aliases: ["организация детских праздников", "детские праздники", "kids party organization"]
  },
  {
    id: "event_agency",
    category: "entertainment",
    subcategory: "event_agency",
    label: { ru: "Event-агентство", uz: "Event agentligi", en: "Event agency" },
    aliases: ["event-агентство", "ивент агентство", "event agency"]
  },
  {
    id: "karaoke_room",
    category: "entertainment",
    subcategory: "karaoke_room",
    label: { ru: "Караоке-комната", uz: "Karaoke xonasi", en: "Karaoke room" },
    aliases: ["караоке-комната", "караоке", "karaoke room"]
  },
  {
    id: "board_game_club",
    category: "entertainment",
    subcategory: "board_game_club",
    label: { ru: "Настольный игровой клуб", uz: "Stol o'yinlari klubi", en: "Board game club" },
    aliases: ["настольный игровой клуб", "настольные игры", "board game club"]
  },
  {
    id: "dance_studio",
    category: "entertainment",
    subcategory: "dance_studio",
    label: { ru: "Танцевальная студия", uz: "Raqs studiyasi", en: "Dance studio" },
    aliases: ["танцевальная студия", "танцы", "dance studio"]
  },
  {
    id: "children_sports_section",
    category: "entertainment",
    subcategory: "children_sports_section",
    label: { ru: "Спортивная секция для детей", uz: "Bolalar sport seksiyasi", en: "Children sports section" },
    aliases: ["спортивная секция для детей", "детская спортивная секция", "children sports section"]
  },
  {
    id: "mini_hotel",
    category: "tourism_hospitality",
    subcategory: "mini_hotel",
    label: { ru: "Мини-гостиница", uz: "Mini mehmonxona", en: "Mini hotel" },
    aliases: ["мини-гостиница", "мини гостиница", "mini hotel"]
  },
  {
    id: "hostel",
    category: "tourism_hospitality",
    subcategory: "hostel",
    label: { ru: "Хостел", uz: "Hostel", en: "Hostel" },
    aliases: ["хостел", "hostel"]
  },
  {
    id: "guest_house",
    category: "tourism_hospitality",
    subcategory: "guest_house",
    label: { ru: "Гостевой дом", uz: "Mehmon uyi", en: "Guest house" },
    aliases: ["гостевой дом", "guest house"]
  },
  {
    id: "travel_agency",
    category: "tourism_hospitality",
    subcategory: "travel_agency",
    label: { ru: "Туристическое агентство", uz: "Turistik agentlik", en: "Travel agency" },
    aliases: ["туристическое агентство", "турагентство", "travel agency"]
  },
  {
    id: "uzbekistan_tours",
    category: "tourism_hospitality",
    subcategory: "uzbekistan_tours",
    label: { ru: "Организация туров по Узбекистану", uz: "O'zbekiston bo'ylab turlar tashkil etish", en: "Tours around Uzbekistan" },
    aliases: ["организация туров по узбекистану", "туры по узбекистану", "uzbekistan tours"]
  },
  {
    id: "airport_transfer",
    category: "transport",
    subcategory: "airport_transfer",
    label: { ru: "Трансфер из аэропорта", uz: "Aeroport transferi", en: "Airport transfer" },
    aliases: ["трансфер из аэропорта", "airport transfer"]
  },
  {
    id: "bike_scooter_rental",
    category: "services",
    subcategory: "bike_scooter_rental",
    label: { ru: "Прокат велосипедов и самокатов", uz: "Velosiped va samokat ijarasi", en: "Bike and scooter rental" },
    aliases: ["прокат велосипедов и самокатов", "прокат самокатов", "прокат велосипедов", "bike scooter rental"]
  },
  {
    id: "souvenir_shop",
    category: "retail",
    subcategory: "souvenir_shop",
    label: { ru: "Сувенирный магазин", uz: "Suvenirlar do'koni", en: "Souvenir shop" },
    aliases: ["сувенирный магазин", "сувениры", "souvenir shop"]
  },
  {
    id: "district_delivery_service",
    category: "logistics",
    subcategory: "district_delivery_service",
    label: { ru: "Сервис доставки по району", uz: "Mahalla bo'ylab yetkazib berish xizmati", en: "District delivery service" },
    aliases: ["сервис доставки по району", "доставка по району", "district delivery service"]
  },
  {
    id: "local_dark_store",
    category: "ecommerce",
    subcategory: "local_dark_store",
    label: { ru: "Dark store для локальной доставки товаров", uz: "Lokal yetkazib berish uchun dark store", en: "Local delivery dark store" },
    aliases: ["dark store", "dark store для локальной доставки", "local dark store"]
  },
] satisfies BusinessSampleDefinition[];

const sampleAliasAdditions: Record<(typeof baseBusinessSamples)[number]["id"], string[]> = {
  children_clothing_store_sample: ["bolalar kiyimi do'koni", "bolalar kiyimlari", "bolalar uchun kiyim", "kids clothing store", "children clothes shop", "kidswear store"],
  women_clothing_store: ["ayollar kiyimi do'koni", "ayollar kiyimlari", "ayollar uchun kiyim", "womens clothing store", "women clothes shop", "ladies clothing store"],
  men_clothing_store: ["erkaklar kiyimi do'koni", "erkaklar kiyimlari", "erkaklar uchun kiyim", "mens clothing store", "men clothes shop", "male clothing store"],
  shoe_store: ["poyabzal dokoni", "poyabzal magazini", "oyoq kiyim do'koni", "oyoq kiyim", "footwear shop", "shoe shop"],
  bags_accessories_store: ["sumka va aksessuarlar do'koni", "sumkalar do'koni", "aksessuarlar do'koni", "bag shop", "accessories shop", "bags and accessories shop"],
  cosmetics_perfume_store: ["kosmetika do'koni", "parfyumeriya do'koni", "kosmetika va atir do'koni", "perfume store", "cosmetics store", "beauty products shop"],
  household_chemicals_store: ["maishiy kimyo do'koni", "maishiy kimyo", "tozalash vositalari do'koni", "household goods chemicals", "cleaning products store", "home chemicals shop"],
  stationery_store: ["kanselyariya do'koni", "kanselyariya", "o'quv qurollari do'koni", "office supplies store", "school supplies shop", "stationery shop"],
  online_clothing_store: ["onlayn kiyim do'koni", "onlayn kiyim", "internet kiyim do'koni", "online clothes shop", "online fashion store", "clothing ecommerce"],
  online_home_goods_store: ["uy uchun tovarlar onlayn do'koni", "uy tovarlari onlayn", "maishiy tovarlar onlayn", "online home products store", "home goods ecommerce", "online household goods store"],
  small_coffee_shop: ["kichik qahvaxona", "qahvaxona", "kofe do'koni", "kofexona", "kofe", "coffee shop", "cafe", "small cafe"],
  neighborhood_bakery: ["mahalla nonvoyxonasi", "nonvoyxona", "non do'koni", "mini nonvoyxona", "bread shop", "neighborhood bakery", "mini bakery"],
  mini_confectionery: ["mini qandolatchilik", "qandolatchilik", "shirinlik sexi", "konditer", "pastry shop", "confectionery shop", "small confectionery"],
  fast_food_cafe: ["tezkor ovqat kafesi", "fastfud", "tez ovqat", "tezkor ovqat", "fast food", "snack bar", "quick service cafe"],
  lavash_shawarma_shop: ["lavash do'koni", "shaorma do'koni", "lavash va shaorma", "lavashxona", "shawarma shop", "lavash shop", "doner shop"],
  burger_shop: ["burger do'koni", "burgerxona", "gamburger do'koni", "hamburger", "hamburger shop", "burger cafe", "burger stand"],
  pizza_delivery: ["pitsa", "pitsa yetkazib berish", "pitseriya", "pitsa do'koni", "pizza shop", "pizzeria", "pizza delivery service"],
  office_canteen: ["ofis oshxonasi", "ofislar uchun oshxona", "korporativ ovqatlanish", "tashkilot uchun ovqatlanish", "corporate catering", "office cafeteria", "staff canteen"],
  ready_meals_cookery: ["tayyor ovqatlar do'koni", "tayyor ovqat", "kulinar do'kon", "cookery shop", "ready food shop", "prepared meals store"],
  ice_cream_point: ["muzqaymoq nuqtasi", "muzqaymoq savdosi", "muzqaymoq do'koni", "ice cream", "ice cream stand", "ice cream shop", "ice cream kiosk"],
  hairdresser: ["sartaroshxona", "soch kesish", "soch turmaklash", "ayollar sartaroshi", "hair salon", "hairdresser salon", "haircut salon"],
  barbershop: ["erkaklar barbershopi", "erkaklar sartaroshi", "barbershop", "erkaklar soch kesish", "men hair salon", "men's hair salon", "barber shop"],
  beauty_salon_sample: ["go'zallik saloni", "gozallik saloni", "go'zallik xizmati", "salon krasoti", "beauty salon", "spa salon", "beauty studio"],
  nail_studio: ["manikyur saloni", "tirnoq saloni", "manikur", "tirnoq xizmati", "nail studio", "manicure", "manicure salon", "nail salon", "nail service"],
  eyelash_studio: ["kiprik uzaytirish studiyasi", "kiprik uzaytirish", "kiprik saloni", "lash studio", "eyelash extension", "eyelash salon"],
  brow_studio: ["qosh studiyasi", "qosh saloni", "qosh bo'yash", "brow salon", "eyebrow studio", "brow service"],
  cosmetology_cabinet: ["kosmetologiya kabineti", "kosmetolog", "kosmetologiya xizmati", "cosmetology cabinet", "cosmetology clinic", "beauty cosmetology"],
  massage_cabinet: ["massaj kabineti", "massaj xonasi", "massaj", "massage", "massage salon", "massage room", "massage service"],
  fitness_studio: ["fitnes studiya", "sport zali", "fitnes zal", "trenajyor zali", "gym", "fitness club", "fitness classes"],
  yoga_studio: ["yoga studiyasi", "yoga darslari", "yoga", "yoga classes", "yoga center", "yoga club"],
  english_language_center: ["ingliz tili o'quv markazi", "ingliz tili kurslari", "ingliz tili", "language school", "english courses", "english learning center"],
  ielts_preparation_center: ["ielts tayyorlov markazi", "ielts tayyorlov", "ielts kursi", "ielts preparation center", "ielts prep", "ielts courses", "exam preparation"],
  math_tutoring_center: ["matematika repetitorlik markazi", "matematika kurslari", "matematika repetitor", "math courses", "math tutor center", "mathematics tutoring"],
  children_development_center: ["bolalar rivojlantirish markazi", "bolalar markazi", "rivojlantirish markazi", "kids development", "kids development center", "children center", "child development center"],
  private_kindergarten: ["xususiy bolalar bog'chasi", "xususiy bog'cha", "bolalar bog'chasi", "daycare", "private daycare", "nursery school"],
  robotics_center_children: ["bolalar robototexnika markazi", "robototexnika kurslari", "robototexnika", "robotics classes", "kids robotics", "robotics school"],
  it_courses_teenagers: ["o'smirlar uchun it kurslari", "it kurslari", "dasturlash kurslari", "coding courses", "programming courses", "teen it courses"],
  smm_digital_courses: ["smm kurslari", "digital marketing kurslari", "smm va marketing kurslari", "digital marketing school", "smm school", "social media marketing courses"],
  music_school_studio: ["musiqa maktabi", "musiqa studiyasi", "musiqa darslari", "music studio", "music classes", "music lessons"],
  chess_school: ["shaxmat maktabi", "shaxmat kurslari", "shaxmat", "chess classes", "chess club", "chess lessons"],
  car_wash_sample: ["avto yuvish", "mashina yuvish", "moyka", "avtomoyka", "auto wash", "car washing", "vehicle wash"],
  detailing_center: ["deteyling markazi", "avto deteyling", "detailing xizmati", "car detailing", "auto detailing", "detailing service"],
  tire_service: ["shina montaj xizmati", "shinomontaj", "g'ildirak xizmati", "tire fitting", "tire repair", "tyre service"],
  auto_repair_shop: ["yengil avtomobillar uchun sto", "avtoservis", "mashina ta'miri", "avto ta'mir", "car repair", "auto service", "car service station"],
  auto_electrician: ["avtoelektrik", "avto elektrik", "mashina elektrigi", "car electrician", "auto electrical service", "vehicle electrician"],
  auto_parts_store: ["avto ehtiyot qismlar do'koni", "avtozapchast", "ehtiyot qismlar", "car parts shop", "auto spare parts", "auto parts shop"],
  auto_accessories_store: ["avto aksessuarlar savdosi", "avto aksessuarlar", "mashina aksessuarlari", "car accessories shop", "auto accessories store", "vehicle accessories"],
  car_rental: ["avtomobil ijarasi", "mashina ijarasi", "avto ijara", "rent a car", "vehicle rental", "car hire"],
  oil_change_service: ["moy almashtirish xizmati", "moy almashtirish", "avto moy almashtirish", "engine oil change", "car oil change", "oil service"],
  car_audio_alarm_installation: ["avtoakustika o'rnatish", "signalizatsiya o'rnatish", "avto signalizatsiya", "car audio installation", "car alarm installation", "auto sound installation"],
  phone_repair_workshop: ["telefon ta'mirlash ustaxonasi", "telefon ta'miri", "smartfon ta'miri", "mobile phone repair", "cell phone repair", "smartphone repair", "device repair"],
  laptop_repair_workshop: ["noutbuk ta'mirlash ustaxonasi", "noutbuk ta'miri", "kompyuter ta'miri", "computer repair", "notebook repair", "laptop service"],
  home_appliance_repair: ["maishiy texnika ta'miri", "texnika ta'miri", "uy texnikasi ta'miri", "appliance repair", "home appliances repair", "electronics repair"],
  shoe_repair_workshop: ["poyabzal ta'mirlash ustaxonasi", "poyabzal ta'miri", "oyoq kiyim ta'miri", "shoe repair shop", "footwear repair", "shoe service"],
  key_duplication_service: ["kalit nusxalash xizmati", "kalit yasash", "kalit dublikati", "key making", "key copy service", "lock key duplication"],
  clothing_alteration_atelier: ["kiyim ta'mirlash atelyesi", "kiyim ta'miri", "kiyim moslash", "tailoring repair", "clothing repair", "alteration atelier"],
  dry_cleaning: ["kiyim kimyoviy tozalash", "ximchistka", "kimyoviy tozalash", "clothes dry cleaning", "garment dry cleaning", "dry cleaner"],
  mini_laundry: ["mini kir yuvish xizmati", "kir yuvish", "kirxona", "laundry service", "small laundry", "laundromat"],
  cleaning_company: ["tozalash kompaniyasi", "klining xizmati", "tozalash xizmati", "cleaning agency", "cleaning business", "commercial cleaning"],
  handyman_service: ["mayda ta'mir ustasi xizmati", "usta xizmati", "mayda ta'mir", "master na chas", "home repair service", "minor repair service", "handyman"],
  photo_studio: ["fotostudiya", "foto studiya", "rasmga olish studiyasi", "photography studio", "photo service", "photo shoot studio"],
  video_content_studio: ["kontent uchun video studiya", "video studiya", "video kontent studiyasi", "video production studio", "content studio", "video shooting studio"],
  smm_agency: ["smm agentligi", "smm xizmatlari", "ijtimoiy tarmoq marketingi", "social media agency", "social media marketing agency", "smm services"],
  web_studio: ["web studiya", "veb studiya", "sayt yaratish", "website studio", "web development studio", "website development"],
  design_studio: ["dizayn studiyasi", "dizayn xizmati", "grafik dizayn", "graphic design studio", "design agency", "creative studio"],
  accounting_firm: ["kichik biznes uchun buxgalteriya firmasi", "buxgalteriya xizmatlari", "buxgalter", "bookkeeping service", "accounting services", "small business accounting"],
  legal_consulting: ["yuridik maslahat", "yuridik xizmatlar", "huquqiy maslahat", "legal services", "law consulting", "legal advice"],
  hr_agency: ["hr agentligi", "xodim tanlash", "kadrlar agentligi", "recruitment agency", "staffing agency", "personnel recruitment"],
  outsourced_call_center: ["autsors call-center", "call markaz", "kol markaz", "call center outsourcing", "outsourced support center", "customer support center"],
  marketing_agency: ["marketing agentligi", "marketing xizmatlari", "reklama agentligi", "advertising agency", "marketing services", "promo agency"],
  furniture_workshop: ["mebel ustaxonasi", "mebel ishlab chiqarish", "mebel tayyorlash", "furniture making", "furniture shop workshop", "wood furniture workshop"],
  cabinet_furniture_factory: ["korpus mebel ishlab chiqarish sexi", "korpus mebel", "shkaf mebel ishlab chiqarish", "cabinet furniture factory", "cabinetry workshop", "built in furniture production"],
  sewing_workshop: ["tikuv sexi", "tikuvchilik sexi", "kiyim tikish sexi", "sewing factory", "garment workshop", "tailoring workshop"],
  school_uniform_production: ["maktab formasi ishlab chiqarish", "maktab formasi", "forma tikish", "school uniform sewing", "uniform production", "school clothes production"],
  bed_linen_production: ["choyshab ishlab chiqarish", "postel ishlab chiqarish", "yotoq choyshabi tikish", "bedding production", "bed sheets production", "linen manufacturing"],
  soft_toys_production: ["yumshoq o'yinchoqlar ishlab chiqarish", "yumshoq o'yinchoqlar", "o'yinchoq ishlab chiqarish", "plush toys production", "soft toy manufacturing", "toy workshop"],
  plastic_windows_production: ["plastik derazalar ishlab chiqarish", "plastik deraza", "akfa deraza ishlab chiqarish", "upvc windows production", "plastic window factory", "window manufacturing"],
  door_production: ["eshik ishlab chiqarish", "eshik yasash", "eshik sexi", "door manufacturing", "door workshop", "door factory"],
  mini_printing_house: ["mini tipografiya", "tipografiya", "bosmaxona", "print shop", "printing service", "small print house"],
  packaging_bags_production: ["qadoqlash va paketlar ishlab chiqarish", "paket ishlab chiqarish", "qadoq ishlab chiqarish", "packaging production", "bag production", "plastic bags manufacturing"],
  apartment_renovation_team: ["kvartira ta'mirlash brigadasi", "kvartira remonti", "uy ta'mirlash", "home renovation team", "flat renovation", "apartment repair team"],
  air_conditioner_installation: ["konditsioner o'rnatish kompaniyasi", "konditsioner o'rnatish", "konditsioner montaj", "ac installation", "aircon installation", "hvac installation"],
  cctv_installation: ["videokuzatuv o'rnatish", "kamera o'rnatish", "xavfsizlik kamerasi o'rnatish", "surveillance camera installation", "security cameras", "video surveillance service"],
  solar_panel_installation: ["quyosh panellari o'rnatish", "quyosh paneli", "solar panel o'rnatish", "solar installation", "solar panels service", "photovoltaic installation"],
  blinds_production_installation: ["jalyuzi ishlab chiqarish va o'rnatish", "jalyuzi", "jalyuzi o'rnatish", "blinds installation", "blinds manufacturing", "window blinds service"],
  plumbing_services: ["santexnika xizmatlari", "santexnik", "quvur ta'miri", "plumber service", "plumbing repair", "sanitary plumbing service"],
  electrical_installation_services: ["elektr montaj xizmatlari", "elektrik xizmati", "elektr o'rnatish", "electrician service", "electrical repair", "electrical installation"],
  real_estate_agency: ["ko'chmas mulk agentligi", "rieltor agentligi", "uy sotish agentligi", "realtor agency", "property agency", "realty agency"],
  rental_property_management: ["ijaradagi kvartiralarni boshqarish", "ijara uylarini boshqarish", "kvartira ijarasi boshqaruvi", "rental management", "apartment rental management", "property rental management"],
  interior_design: ["interyer dizayni", "ichki dizayn", "uy dizayni", "interior designer", "home interior design", "interior studio"],
  greenhouse_farm: ["issiqxona xo'jaligi", "issiqxona", "teplitsa", "greenhouse business", "greenhouse farming", "greenhouse agriculture"],
  strawberry_farming: ["qulupnay yetishtirish", "qulupnay", "qulupnay fermasi", "strawberry cultivation", "strawberry farm", "berry farming"],
  greens_farming: ["ko'kat yetishtirish", "ko'kat", "ko'kat fermasi", "greens cultivation", "herb farming", "leafy greens farm"],
  poultry_farm: ["parrandachilik fermasi", "tovuq fermasi", "parranda fermasi", "chicken farm", "poultry farming", "broiler farm"],
  quail_farm: ["bedana fermasi", "bedanachilik", "bedana boqish", "quail farming", "quail breeding", "quail eggs farm"],
  mini_dairy_farm: ["mini sut fermasi", "sut fermasi", "sigir suti fermasi", "small dairy farm", "milk farm", "dairy farming"],
  cheese_production: ["pishloq ishlab chiqarish", "pishloq", "pishloq sexi", "cheese making", "cheese factory", "cheese workshop"],
  dried_fruits_production: ["quritilgan mevalar ishlab chiqarish", "quruq meva", "meva quritish", "dried fruit manufacturing", "dry fruit production", "fruit drying business"],
  nuts_dried_fruits_packaging: ["yong'oq va quritilgan mevalarni qadoqlash", "yong'oq qadoqlash", "quruq meva qadoqlash", "nuts packaging", "dried fruits packaging", "dry fruit packing"],
  honey_apiary: ["asalarichilik xo'jaligi", "asalari fermasi", "asal ishlab chiqarish", "beekeeping", "honey farm", "apiary business"],
  computer_club: ["kompyuter klubi", "gaming klub", "internet klub", "cyber club", "gaming computer club", "internet cafe gaming"],
  playstation_club: ["playstation klubi", "ps klub", "pleysteyshen klub", "console gaming club", "ps club", "gaming console club"],
  children_playroom: ["bolalar o'yin xonasi", "bolalar maydonchasi", "o'yin xonasi", "kids playroom", "children play area", "indoor playground"],
  trampoline_center: ["batut markazi", "batut", "batut parki", "trampoline park", "trampoline club", "jump center"],
  kids_party_organization: ["bolalar bayramlarini tashkil etish", "bolalar bayrami", "animator xizmati", "children party service", "kids events", "birthday party organization"],
  event_agency: ["event agentligi", "ivent agentlik", "tadbir tashkil qilish", "events agency", "event organizer", "event management"],
  karaoke_room: ["karaoke xonasi", "karaoke", "karaoke klub", "karaoke lounge", "karaoke bar", "karaoke studio"],
  board_game_club: ["stol o'yinlari klubi", "stol o'yinlari", "board game", "table games club", "board games cafe", "game club"],
  dance_studio: ["raqs studiyasi", "raqs kurslari", "raqs darslari", "dance classes", "dance school", "dance lessons"],
  children_sports_section: ["bolalar sport seksiyasi", "bolalar sporti", "sport to'garagi", "kids sports club", "children sports classes", "sports section for kids"],
  mini_hotel: ["mini mehmonxona", "kichik mehmonxona", "mini hotel", "small hotel", "boutique hotel", "guest mini hotel"],
  hostel: ["hostel", "xostel", "arzon mehmonxona", "budget hostel", "youth hostel", "hostel business"],
  guest_house: ["mehmon uyi", "guest house", "oilaviy mehmon uyi", "guesthouse", "family guest house", "bnb guest house"],
  travel_agency: ["turistik agentlik", "tur agentlik", "sayohat agentligi", "tour agency", "tourism agency", "travel company"],
  uzbekistan_tours: ["o'zbekiston bo'ylab turlar", "o'zbekiston turlari", "ichki turizm", "uzbekistan tour operator", "local tours uzbekistan", "domestic tours"],
  airport_transfer: ["aeroport transferi", "aeroportdan transfer", "aeroport taksi", "airport shuttle", "airport pickup", "airport taxi service"],
  bike_scooter_rental: ["velosiped ijarasi", "samokat ijarasi", "velosiped va samokat ijarasi", "velosiped prokati", "samokat prokati", "bicycle rental", "bike rental", "scooter rental", "bike hire"],
  souvenir_shop: ["suvenirlar do'koni", "suvenir do'koni", "sovg'alar do'koni", "gift shop", "souvenirs store", "tourist souvenir shop"],
  district_delivery_service: ["mahalla bo'ylab yetkazib berish xizmati", "mahalla yetkazib berish", "lokal dostavka", "local delivery service", "neighborhood delivery", "district courier service"],
  local_dark_store: ["lokal yetkazib berish uchun dark store", "dark store", "lokal dark store", "local fulfillment store", "quick commerce dark store", "local delivery warehouse"]
} ;

const prioritySampleAiContext: Partial<Record<(typeof baseBusinessSamples)[number]["id"], Pick<BusinessSampleDefinition, "aiHints" | "sectorRisks" | "keyDocuments">>> = {
  children_clothing_store_sample: {
    aiHints: { ru: "Бизнес-модель: розничная продажа детской одежды с сезонными коллекциями, размерной сеткой и высокой ролью доверия родителей. Анализировать через оборачиваемость SKU, остатки и средний чек, не как универсальный магазин.", uz: "Biznes-model: bolalar kiyimini chakana sotish; mavsumiy kolleksiyalar, o'lcham qatori va ota-ona ishonchi muhim. Universal do'kon emas, SKU aylanishi, qoldiq va o'rtacha chek orqali tahlil qilinsin.", en: "Business model: children's clothing retail with seasonal collections, size ranges and parent trust as key drivers. Analyze through SKU turnover, inventory and average ticket, not as a generic store." },
    sectorRisks: { ru: ["Размерные остатки замораживают оборотный капитал", "Сезонность коллекций требует планирования закупок", "Доверие к качеству ткани влияет на повторные покупки"], uz: ["O'lcham qoldiqlari aylanma kapitalni muzlatadi", "Mavsumiy kolleksiyalar xarid rejasini talab qiladi", "Mato sifatiga ishonch takroriy xaridga ta'sir qiladi"], en: ["Size leftovers freeze working capital", "Seasonal collections require procurement planning", "Trust in fabric quality drives repeat purchases"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "supplier_invoices", "product_certificates_check"]
  },
  women_clothing_store: {
    aiHints: { ru: "Бизнес-модель: fashion-розница с высокой зависимостью от ассортимента, трендов, примерки, Instagram/Telegram заявок и скорости обновления коллекции.", uz: "Biznes-model: fashion chakana savdo; assortiment, trendlar, kiyib ko'rish, Instagram/Telegram buyurtmalari va kolleksiya yangilanish tezligi asosiy omillar.", en: "Business model: fashion retail driven by assortment, trends, fitting, Instagram/Telegram leads and collection refresh speed." },
    sectorRisks: { ru: ["Неликвидные остатки быстро снижают маржу", "Fashion-спрос меняется быстрее стандартной розницы", "Аренда в проходной локации должна подтверждаться конверсией"], uz: ["Likvid bo'lmagan qoldiqlar marjani tez pasaytiradi", "Fashion talabi oddiy chakana savdodan tezroq o'zgaradi", "O'tuvchi joy ijarasi konversiya bilan tasdiqlanishi kerak"], en: ["Slow-moving inventory quickly reduces margin", "Fashion demand shifts faster than standard retail", "High-traffic rent must be validated by conversion"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "supplier_invoices", "return_policy"]
  },
  shoe_store: {
    aiHints: { ru: "Бизнес-модель: обувная розница с размерной матрицей, сезонностью, высоким влиянием остатков и качества поставщика. Проверять глубину размеров и оборотность.", uz: "Biznes-model: poyabzal chakana savdosi; o'lcham matritsasi, mavsumiylik, qoldiqlar va yetkazib beruvchi sifati muhim. O'lcham chuqurligi va aylanish tekshirilsin.", en: "Business model: footwear retail with size matrix, seasonality, inventory risk and supplier quality as key drivers. Check size depth and turnover." },
    sectorRisks: { ru: ["Размерные остатки могут стать главным убытком", "Сезонность влияет на cash flow", "Возвраты и претензии по качеству требуют правил"], uz: ["O'lcham qoldiqlari asosiy zarar manbai bo'lishi mumkin", "Mavsumiylik cash flowga ta'sir qiladi", "Qaytarish va sifat da'volari uchun qoidalar kerak"], en: ["Size leftovers can become the main loss source", "Seasonality affects cash flow", "Returns and quality claims need clear rules"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "supplier_invoices", "return_policy"]
  },
  online_clothing_store: {
    aiHints: { ru: "Бизнес-модель: онлайн-продажи одежды через Instagram/Telegram/маркетплейсы; ключевые факторы — контент, заявки, конверсия, доставка, возвраты и остатки.", uz: "Biznes-model: Instagram/Telegram/marketpleyslar orqali kiyim onlayn savdosi; kontent, arizalar, konversiya, yetkazish, qaytarish va qoldiqlar asosiy omillar.", en: "Business model: online clothing sales via Instagram/Telegram/marketplaces; drivers are content, leads, conversion, delivery, returns and inventory." },
    sectorRisks: { ru: ["Возвраты из-за размера и ожиданий снижают маржу", "Без контента и заявки нет стабильного потока", "Доставка и наложенные платежи влияют на оборотный капитал"], uz: ["O'lcham va kutilma sabab qaytarishlar marjani pasaytiradi", "Kontent va arizalarsiz barqaror oqim bo'lmaydi", "Yetkazish va keyin to'lov aylanma kapitalga ta'sir qiladi"], en: ["Returns due to sizing and expectations reduce margin", "Without content and leads there is no stable flow", "Delivery and cash-on-delivery affect working capital"] },
    keyDocuments: ["business_registration", "tax_mode", "online_offer", "return_policy", "supplier_invoices", "marketplace_or_delivery_contracts"]
  },
  small_coffee_shop: {
    aiHints: { ru: "Бизнес-модель: напитки и быстрые перекусы с высокой зависимостью от утреннего/дневного трафика, посадочных мест, скорости обслуживания и повторных клиентов. Не анализировать как ресторан полного цикла.", uz: "Biznes-model: ichimliklar va tez tayyor yeguliklar; asosiy omillar ertalabki/kunduzgi trafik, o'rindiqlar, xizmat tezligi va takroriy mijozlar. To'liq siklli restoran sifatida tahlil qilinmasin.", en: "Business model: drinks and quick snacks driven by morning/daytime traffic, seating, service speed and repeat customers. Do not analyze as a full-service restaurant." },
    sectorRisks: { ru: ["Локационный трафик важнее широкой рекламы", "Маржа зависит от закупки кофе, молока, десертов и списаний", "Пиковые часы требуют быстрой выдачи, иначе теряется спрос"], uz: ["Lokatsiya trafigi keng reklamadan muhimroq", "Marja kofe, sut, desert xaridi va chiqitlarga bog'liq", "Pik soatlarda tez xizmat bo'lmasa talab yo'qoladi"], en: ["Location traffic matters more than broad advertising", "Margin depends on coffee, milk, desserts and waste", "Peak hours require fast service or demand is lost"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "sanitary_notification", "labor_contracts"]
  },
  neighborhood_bakery: {
    aiHints: { ru: "Бизнес-модель: ежедневное производство и продажа хлеба/выпечки с ранним спросом, высокой ролью свежести, энергозатрат и списаний. Проверять печи, мощность смены и санитарные требования.", uz: "Biznes-model: non va pishiriqlarni har kuni ishlab chiqarish va sotish; yangilik, energiya xarajati va chiqitlar muhim. Pechlar, smena quvvati va sanitariya talablari tekshiriladi.", en: "Business model: daily production and sale of bread/pastry with early-day demand, freshness, energy costs and waste as key drivers. Check ovens, shift capacity and sanitary requirements." },
    sectorRisks: { ru: ["Непроданная продукция быстро превращается в списание", "Электроэнергия/газ критичны для себестоимости", "Санитария и стабильность рецептуры влияют на повторные покупки"], uz: ["Sotilmagan mahsulot tez chiqitga aylanadi", "Elektr/gaz tannarx uchun kritik", "Sanitariya va retsept barqarorligi takroriy xaridga ta'sir qiladi"], en: ["Unsold product quickly becomes waste", "Electricity/gas are critical for COGS", "Sanitation and recipe stability affect repeat purchases"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "sanitary_conclusion", "fire_safety", "labor_contracts"]
  },
  fast_food_cafe: {
    aiHints: { ru: "Бизнес-модель: быстрые заказы с высокой оборачиваемостью, контролем себестоимости порции, скорости кухни и доставки/самовывоза. Не подменять ресторанной моделью с долгой посадкой.", uz: "Biznes-model: tez buyurtmalar, porsiya tannarxi, oshxona tezligi va yetkazib berish/olib ketish nazorati. Uzoq o'tirishli restoran modeli bilan aralashtirilmasin.", en: "Business model: quick orders with high turnover, portion COGS control, kitchen speed and delivery/takeaway. Do not treat as a long-stay restaurant." },
    sectorRisks: { ru: ["Себестоимость порции должна быть подтверждена технологической картой", "Пиковая загрузка кухни ограничивает выручку", "Санитарные нарушения создают риск остановки"], uz: ["Porsiya tannarxi texnologik karta bilan tasdiqlanishi kerak", "Pik yuklama oshxona quvvati bilan cheklanadi", "Sanitariya buzilishi to'xtash xavfini yaratadi"], en: ["Portion COGS must be backed by recipe cards", "Peak kitchen load caps revenue", "Sanitary violations create shutdown risk"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "sanitary_conclusion", "lease_agreement", "labor_contracts"]
  },
  lavash_shawarma_shop: {
    aiHints: { ru: "Бизнес-модель: точка быстрого питания с узким меню, высокой зависимостью от проходного трафика, стабильности рецептуры и закупки мяса/лаваша/соусов.", uz: "Biznes-model: tor menyuli tez ovqatlanish nuqtasi; o'tuvchi trafik, retsept barqarorligi va go'sht/lavash/sous xaridi asosiy omillar.", en: "Business model: narrow-menu quick-service point driven by foot traffic, recipe consistency and meat/lavash/sauce procurement." },
    sectorRisks: { ru: ["Колебания цены мяса быстро бьют по марже", "Очередь в пик снижает конверсию", "Санитария и хранение продуктов критичны"], uz: ["Go'sht narxi o'zgarishi marjaga tez ta'sir qiladi", "Pik paytdagi navbat konversiyani kamaytiradi", "Sanitariya va mahsulot saqlash kritik"], en: ["Meat price swings quickly affect margin", "Peak queues reduce conversion", "Sanitation and food storage are critical"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "sanitary_conclusion", "lease_agreement", "labor_contracts"]
  },
  burger_shop: {
    aiHints: { ru: "Бизнес-модель: бургеры и комбо-продажи; драйверы — средний чек, скорость кухни, себестоимость котлеты/булки/соуса и стабильность качества.", uz: "Biznes-model: burger va kombo savdosi; asosiy omillar o'rtacha chek, oshxona tezligi, kotlet/bulka/sous tannarxi va sifat barqarorligi.", en: "Business model: burgers and combo sales driven by average ticket, kitchen speed, patty/bun/sauce COGS and quality consistency." },
    sectorRisks: { ru: ["Комбо может повышать чек, но требует контроля food cost", "Кухонная мощность ограничивает пиковую выручку", "Качество продукта влияет на повторные покупки"], uz: ["Kombo chekni oshiradi, lekin food cost nazorati kerak", "Oshxona quvvati pik tushumni cheklaydi", "Mahsulot sifati takroriy xaridlarga ta'sir qiladi"], en: ["Combos can lift ticket but require food-cost control", "Kitchen capacity limits peak revenue", "Product quality drives repeat demand"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "sanitary_conclusion", "lease_agreement", "labor_contracts"]
  },
  pizza_delivery: {
    aiHints: { ru: "Бизнес-модель: заказы на доставку/самовывоз; ключевые факторы — радиус доставки, скорость выпечки, курьеры/агрегаторы и себестоимость ингредиентов.", uz: "Biznes-model: yetkazib berish/olib ketish buyurtmalari; asosiy omillar yetkazish radiusi, pishirish tezligi, kuryer/agregatorlar va ingredient tannarxi.", en: "Business model: delivery/takeaway orders driven by delivery radius, baking speed, couriers/aggregators and ingredient COGS." },
    sectorRisks: { ru: ["Доставка съедает маржу без минимального чека", "Холодная доставка снижает повторные заказы", "Сыр и импортные ингредиенты создают ценовой риск"], uz: ["Minimal cheksiz yetkazish marjani kamaytiradi", "Sovuq yetkazilgan mahsulot takroriy buyurtmani pasaytiradi", "Pishloq va import ingredientlar narx xavfini yaratadi"], en: ["Delivery erodes margin without a minimum ticket", "Cold delivery reduces repeat orders", "Cheese and imported ingredients create price risk"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "sanitary_conclusion", "courier_contracts", "labor_contracts"]
  },
  office_canteen: {
    aiHints: { ru: "Бизнес-модель: B2B/B2E питание для сотрудников; важны договор с организацией, количество питающихся, график, себестоимость порции и отсрочка оплаты.", uz: "Biznes-model: xodimlar uchun B2B/B2E ovqatlanish; tashkilot shartnomasi, ovqatlanadiganlar soni, jadval, porsiya tannarxi va to'lov muddati muhim.", en: "Business model: B2B/B2E staff meals driven by client contract, diners count, schedule, portion COGS and payment delay." },
    sectorRisks: { ru: ["Один крупный клиент создает концентрационный риск", "Отсрочка оплаты требует оборотного капитала", "Санитарные требования обязательны"], uz: ["Bitta yirik mijoz konsentratsiya xavfini yaratadi", "To'lov kechikishi aylanma kapital talab qiladi", "Sanitariya talablari majburiy"], en: ["One large client creates concentration risk", "Payment delay requires working capital", "Sanitary requirements are mandatory"] },
    keyDocuments: ["business_registration", "tax_mode", "b2b_service_contract", "sanitary_conclusion", "labor_contracts"]
  },
  hairdresser: {
    aiHints: { ru: "Бизнес-модель: услуги мастеров по записи и walk-in; драйверы — загрузка кресел, средний чек, повторные клиенты и качество мастеров.", uz: "Biznes-model: ustalar xizmatlari yozilish va walk-in orqali; asosiy omillar kreslo yuklamasi, o'rtacha chek, takroriy mijozlar va usta sifati.", en: "Business model: stylist services via appointments and walk-ins; drivers are chair utilization, average ticket, repeat clients and stylist quality." },
    sectorRisks: { ru: ["Выручка ограничена количеством кресел и часов мастеров", "Уход сильного мастера уводит клиентов", "Локация и отзывы влияют на поток"], uz: ["Tushum kreslolar va usta soatlari bilan cheklanadi", "Kuchli usta ketishi mijozlarni olib ketadi", "Lokatsiya va sharhlar oqimga ta'sir qiladi"], en: ["Revenue is capped by chairs and stylist hours", "A strong stylist leaving can take clients", "Location and reviews influence flow"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "labor_contracts"]
  },
  barbershop: {
    aiHints: { ru: "Бизнес-модель: мужские стрижки/бритье с высокой ролью мастеров, записи, повторных клиентов и локального бренда.", uz: "Biznes-model: erkaklar soch kesish/qirish xizmatlari; ustalar, yozilish, takroriy mijozlar va lokal brend muhim.", en: "Business model: men's haircuts/shaving driven by barbers, appointment flow, repeat clients and local brand." },
    sectorRisks: { ru: ["Загрузка барберов ограничивает выручку", "Повторные клиенты зависят от качества конкретных мастеров", "Аренда в проходной локации должна окупаться чеком"], uz: ["Barberlar yuklamasi tushumni cheklaydi", "Takroriy mijozlar aniq ustalar sifatiga bog'liq", "O'tuvchi lokatsiya ijarasi chek bilan oqlanishi kerak"], en: ["Barber utilization caps revenue", "Repeat clients depend on individual barbers", "High-traffic rent must be justified by ticket size"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "labor_contracts"]
  },
  beauty_salon_sample: {
    aiHints: { ru: "Бизнес-модель: несколько beauty-услуг в одной точке; важны загрузка кабинетов, мастера, расходники, запись и кросс-продажи.", uz: "Biznes-model: bitta nuqtada bir nechta go'zallik xizmatlari; kabinet yuklamasi, ustalar, sarf materiallari, yozilish va kross-savdo muhim.", en: "Business model: multiple beauty services in one location; key drivers are room utilization, specialists, consumables, appointments and cross-selling." },
    sectorRisks: { ru: ["Широкий набор услуг усложняет контроль качества", "Расходники и аренда кабинетов требуют точного учета", "Мастера могут уводить клиентскую базу"], uz: ["Keng xizmatlar sifat nazoratini murakkablashtiradi", "Sarf materiallari va kabinet ijarasi aniq hisob talab qiladi", "Ustalar mijoz bazasini olib ketishi mumkin"], en: ["Broad services complicate quality control", "Consumables and room rent require exact accounting", "Specialists can take the client base"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "labor_contracts", "sanitary_notification"]
  },
  nail_studio: {
    aiHints: { ru: "Бизнес-модель: маникюр/педикюр по записи; экономика зависит от времени процедуры, загрузки мастеров, расходников и повторных визитов.", uz: "Biznes-model: yozilish bo'yicha manikyur/pedikyur; iqtisodiyot jarayon vaqti, ustalar yuklamasi, sarf materiallari va takroriy tashriflarga bog'liq.", en: "Business model: appointment-based manicure/pedicure; economics depend on procedure time, specialist utilization, consumables and repeat visits." },
    sectorRisks: { ru: ["Стерилизация инструментов обязательна для доверия и безопасности", "Длинная процедура ограничивает дневную выручку", "Повторные клиенты важнее разовой рекламы"], uz: ["Asboblarni sterilizatsiya qilish ishonch va xavfsizlik uchun majburiy", "Uzoq jarayon kunlik tushumni cheklaydi", "Takroriy mijozlar bir martalik reklamadan muhimroq"], en: ["Tool sterilization is essential for trust and safety", "Long procedure time caps daily revenue", "Repeat clients matter more than one-off advertising"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "labor_contracts", "sanitary_notification"]
  },
  massage_cabinet: {
    aiHints: { ru: "Бизнес-модель: услуги специалиста по сеансам; важны квалификация, длительность сеанса, загрузка кабинета, повторные клиенты и медицинские ограничения позиционирования.", uz: "Biznes-model: seanslar bo'yicha mutaxassis xizmati; malaka, seans davomiyligi, kabinet yuklamasi, takroriy mijozlar va tibbiy pozitsiyalash cheklovlari muhim.", en: "Business model: session-based specialist service; key drivers are qualification, session length, room utilization, repeat clients and medical-positioning limits." },
    sectorRisks: { ru: ["Нельзя обещать медицинский эффект без лицензии", "Выручка ограничена количеством сеансов в день", "Доверие зависит от квалификации и отзывов"], uz: ["Litsenziyasiz tibbiy natija va'da qilinmasin", "Tushum kunlik seanslar soni bilan cheklanadi", "Ishonch malaka va sharhlarga bog'liq"], en: ["Do not promise medical outcomes without a license", "Revenue is capped by sessions per day", "Trust depends on qualification and reviews"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "labor_contracts", "client_service_rules"]
  },
  fitness_studio: {
    aiHints: { ru: "Бизнес-модель: абонементы/персональные тренировки; важны загрузка зала по часам, удержание клиентов, тренеры и безопасность оборудования.", uz: "Biznes-model: abonementlar/shaxsiy mashg'ulotlar; soatlar bo'yicha zal yuklamasi, mijozlarni saqlash, trenerlar va uskunalar xavfsizligi muhim.", en: "Business model: memberships/personal training; drivers are hourly facility utilization, retention, trainers and equipment safety." },
    sectorRisks: { ru: ["Пиковые часы переполнены, дневные часы могут простаивать", "Тренеры и удержание критичны для продлений", "Травмы клиентов требуют правил безопасности"], uz: ["Pik soatlar to'ladi, kunduzgi soatlar bo'sh qolishi mumkin", "Trenerlar va saqlab qolish uzaytirishlar uchun kritik", "Mijoz jarohatlari xavfsizlik qoidalarini talab qiladi"], en: ["Peak hours may be full while daytime sits idle", "Trainers and retention are critical for renewals", "Client injuries require safety rules"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "equipment_service_contracts", "labor_contracts", "client_liability_rules"]
  },
  yoga_studio: {
    aiHints: { ru: "Бизнес-модель: групповые занятия и абонементы; экономика зависит от размера групп, расписания, инструктора и продлений.", uz: "Biznes-model: guruh mashg'ulotlari va abonementlar; iqtisodiyot guruh hajmi, jadval, instruktor va uzaytirishlarga bog'liq.", en: "Business model: group classes and memberships; economics depend on group size, schedule, instructor quality and renewals." },
    sectorRisks: { ru: ["Малые группы не покрывают аренду", "Инструктор — ключевой актив", "Расписание должно совпадать с доступностью клиентов"], uz: ["Kichik guruhlar ijarani qoplamaydi", "Instruktor asosiy aktiv", "Jadval mijozlar bo'sh vaqti bilan mos bo'lishi kerak"], en: ["Small groups may not cover rent", "The instructor is the key asset", "Schedule must match client availability"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "labor_contracts", "client_liability_rules"]
  },
  english_language_center: {
    aiHints: { ru: "Бизнес-модель: группы и индивидуальные занятия; ключевые драйверы — набор студентов, удержание, расписание, преподаватели и результат обучения.", uz: "Biznes-model: guruh va individual darslar; asosiy omillar o'quvchi yig'ish, saqlab qolish, jadval, o'qituvchilar va ta'lim natijasi.", en: "Business model: group and individual classes; drivers are student acquisition, retention, schedule, teachers and learning outcomes." },
    sectorRisks: { ru: ["Группы должны добираться до минимальной наполняемости", "Сильные преподаватели влияют на удержание", "Сезонность набора влияет на cash flow"], uz: ["Guruhlar minimal to'lish darajasiga yetishi kerak", "Kuchli o'qituvchilar saqlab qolishga ta'sir qiladi", "Qabul mavsumiyligi cash flowga ta'sir qiladi"], en: ["Groups must reach minimum fill", "Strong teachers affect retention", "Enrollment seasonality affects cash flow"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "teacher_contracts", "student_contract_offer"]
  },
  ielts_preparation_center: {
    aiHints: { ru: "Бизнес-модель: экзаменационная подготовка с высокой ролью результатов студентов, преподавателей, пробных тестов и репутации.", uz: "Biznes-model: imtihonga tayyorlov; talabalar natijasi, o'qituvchilar, mock testlar va obro' muhim.", en: "Business model: exam preparation driven by student results, teachers, mock tests and reputation." },
    sectorRisks: { ru: ["Результаты студентов напрямую влияют на маркетинг", "Сильный преподаватель может быть узким местом", "Набор зависит от экзаменационных сезонов"], uz: ["Talabalar natijasi marketingga bevosita ta'sir qiladi", "Kuchli o'qituvchi tor joy bo'lishi mumkin", "Qabul imtihon mavsumlariga bog'liq"], en: ["Student results directly affect marketing", "A strong teacher can become a bottleneck", "Enrollment depends on exam seasons"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "teacher_contracts", "student_contract_offer"]
  },
  children_development_center: {
    aiHints: { ru: "Бизнес-модель: занятия для детей по группам; важны безопасность, доверие родителей, расписание, наполняемость групп и квалификация педагогов.", uz: "Biznes-model: bolalar uchun guruh mashg'ulotlari; xavfsizlik, ota-ona ishonchi, jadval, guruh to'lishi va pedagoglar malakasi muhim.", en: "Business model: group classes for children; key drivers are safety, parent trust, schedule, group fill and teacher qualification." },
    sectorRisks: { ru: ["Безопасность детей — главный операционный риск", "Малые группы не покрывают аренду и зарплаты", "Родительское доверие строится отзывами и прозрачностью"], uz: ["Bolalar xavfsizligi asosiy operatsion xavf", "Kichik guruhlar ijara va maoshni qoplamaydi", "Ota-ona ishonchi sharhlar va shaffoflik bilan quriladi"], en: ["Child safety is the main operational risk", "Small groups do not cover rent and payroll", "Parent trust depends on reviews and transparency"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "teacher_contracts", "child_safety_rules", "parent_contract_offer"]
  },
  private_kindergarten: {
    aiHints: { ru: "Бизнес-модель: регулярная оплата за уход/развитие детей; ключевые факторы — лицензирование/разрешения, безопасность, питание, персонал, наполняемость групп и доверие родителей.", uz: "Biznes-model: bolalarni parvarish va rivojlantirish uchun muntazam to'lov; asosiy omillar litsenziya/ruxsatlar, xavfsizlik, ovqatlanish, personal, guruh to'lishi va ota-ona ishonchi.", en: "Business model: recurring childcare/development fees; drivers are licensing/permits, safety, meals, staff, group fill and parent trust." },
    sectorRisks: { ru: ["Детская безопасность и санитария критичны", "Лицензирование/разрешения нужно проверить до аренды", "Фонд оплаты труда высок из-за воспитателей и помощников"], uz: ["Bolalar xavfsizligi va sanitariya kritik", "Ijara oldidan litsenziya/ruxsatlar tekshirilishi kerak", "Tarbiyachi va yordamchilar sababli ish haqi fondi yuqori"], en: ["Child safety and sanitation are critical", "Licensing/permits must be checked before lease", "Payroll is high because of teachers and assistants"] },
    keyDocuments: ["business_registration", "tax_mode", "education_or_childcare_permit_check", "sanitary_conclusion", "fire_safety", "lease_agreement", "labor_contracts"]
  },
  car_wash_sample: {
    aiHints: { ru: "Бизнес-модель: мойка автомобилей по боксам/постам; драйверы — трафик, количество постов, вода/стоки, химия, сезонность и средний чек.", uz: "Biznes-model: postlar bo'yicha avtomobil yuvish; asosiy omillar trafik, postlar soni, suv/oqova, kimyo, mavsumiylik va o'rtacha chek.", en: "Business model: car wash by bays/posts; drivers are traffic, bay count, water/drainage, chemicals, seasonality and average ticket." },
    sectorRisks: { ru: ["Вода и стоки должны быть согласованы до запуска", "Погода влияет на поток", "Оборудование и химия требуют регулярного обслуживания"], uz: ["Suv va oqova masalasi ishga tushirishdan oldin kelishilishi kerak", "Ob-havo oqimga ta'sir qiladi", "Uskuna va kimyo muntazam servis talab qiladi"], en: ["Water and drainage must be agreed before launch", "Weather affects flow", "Equipment and chemicals require regular maintenance"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_or_land_agreement", "water_drainage_agreement", "environmental_requirements_check", "labor_contracts"]
  },
  auto_repair_shop: {
    aiHints: { ru: "Бизнес-модель: сервисные работы по автомобилям; выручка зависит от боксов, мастеров, диагностики, запчастей, повторных клиентов и доверия.", uz: "Biznes-model: avtomobil servis ishlari; tushum bokslar, ustalar, diagnostika, ehtiyot qismlar, takroriy mijozlar va ishonchga bog'liq.", en: "Business model: vehicle service work; revenue depends on bays, mechanics, diagnostics, spare parts, repeat clients and trust." },
    sectorRisks: { ru: ["Квалификация мастеров влияет на репутацию", "Запчасти и импорт создают валютный риск", "Простой боксов снижает окупаемость оборудования"], uz: ["Ustalar malakasi obro'ga ta'sir qiladi", "Ehtiyot qismlar va import valuta xavfini yaratadi", "Bokslarning bo'sh turishi uskuna qaytimini pasaytiradi"], en: ["Mechanic qualification affects reputation", "Spare parts and imports create FX risk", "Idle bays reduce equipment payback"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "waste_oil_handling", "labor_contracts", "service_terms"]
  },
  phone_repair_workshop: {
    aiHints: { ru: "Бизнес-модель: ремонт телефонов с доходом от работ и запчастей; драйверы — доверие, скорость диагностики, наличие деталей и гарантийная политика.", uz: "Biznes-model: telefon ta'miri; daromad ish haqi va ehtiyot qismlardan; asosiy omillar ishonch, diagnostika tezligi, detallar mavjudligi va kafolat siyosati.", en: "Business model: phone repair with labor and parts revenue; drivers are trust, diagnostic speed, parts availability and warranty policy." },
    sectorRisks: { ru: ["Импортные детали создают валютный и складской риск", "Ошибки ремонта ведут к гарантийным затратам", "Доверие критично из-за личных данных клиента"], uz: ["Import detallar valuta va ombor xavfini yaratadi", "Ta'mir xatolari kafolat xarajatlariga olib keladi", "Mijoz shaxsiy ma'lumotlari sababli ishonch kritik"], en: ["Imported parts create FX and inventory risk", "Repair errors create warranty costs", "Trust is critical because of customer data"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "warranty_terms", "labor_contracts"]
  },
  laptop_repair_workshop: {
    aiHints: { ru: "Бизнес-модель: диагностика и ремонт ноутбуков/ПК; важны квалификация, запчасти, сроки ремонта, гарантия и поток B2C/B2B заказов.", uz: "Biznes-model: noutbuk/PK diagnostika va ta'miri; malaka, ehtiyot qismlar, ta'mir muddati, kafolat va B2C/B2B buyurtmalar oqimi muhim.", en: "Business model: laptop/PC diagnostics and repair; drivers are qualification, parts, repair lead time, warranty and B2C/B2B order flow." },
    sectorRisks: { ru: ["Детали часто импортные и зависят от курса", "Сложные ремонты занимают оборотное время", "Гарантия и сохранность данных должны быть прописаны"], uz: ["Detallar ko'pincha import va kursga bog'liq", "Murakkab ta'mirlar vaqt resursini egallaydi", "Kafolat va ma'lumot saqlanishi yozma bo'lishi kerak"], en: ["Parts are often imported and FX-sensitive", "Complex repairs consume technician time", "Warranty and data handling must be documented"] },
    keyDocuments: ["business_registration", "tax_mode", "cash_register", "lease_agreement", "warranty_terms", "labor_contracts"]
  },
  cleaning_company: {
    aiHints: { ru: "Бизнес-модель: выездные уборки B2C/B2B; экономика зависит от заказов в день, площади, расходников, транспорта, качества и повторных контрактов.", uz: "Biznes-model: B2C/B2B chiqib tozalash; iqtisodiyot kunlik buyurtmalar, maydon, sarf materiallari, transport, sifat va takroriy shartnomalarga bog'liq.", en: "Business model: mobile B2C/B2B cleaning; economics depend on orders per day, area, consumables, transport, quality and repeat contracts." },
    sectorRisks: { ru: ["Персонал и контроль качества — главный риск", "B2B-клиенты могут платить с отсрочкой", "Химия и оборудование требуют норм хранения и безопасности"], uz: ["Personal va sifat nazorati asosiy xavf", "B2B mijozlar to'lovni kechiktirishi mumkin", "Kimyo va uskunalar saqlash hamda xavfsizlik talab qiladi"], en: ["Staff and quality control are the main risk", "B2B clients may pay with delay", "Chemicals and equipment require storage and safety rules"] },
    keyDocuments: ["business_registration", "tax_mode", "service_contract", "labor_contracts", "chemical_safety_rules"]
  },
  computer_club: {
    aiHints: { ru: "Бизнес-модель: почасовая аренда компьютеров/игровых мест; драйверы — загрузка мест, тарифы по времени, оборудование, интернет, электричество и подростковая аудитория.", uz: "Biznes-model: kompyuter/o'yin joylarini soatlik ijaraga berish; asosiy omillar joylar yuklamasi, vaqt tariflari, uskuna, internet, elektr va o'smir auditoriya.", en: "Business model: hourly rental of PCs/gaming seats; drivers are seat utilization, time tariffs, equipment, internet, electricity and teenage audience." },
    sectorRisks: { ru: ["100% загрузка нереальна: считать часы по пикам и простоям", "Оборудование быстро устаревает и требует сервиса", "Электричество и интернет критичны для работы"], uz: ["100% yuklama real emas: pik va bo'sh soatlar hisoblanadi", "Uskuna tez eskiradi va servis talab qiladi", "Elektr va internet ish uchun kritik"], en: ["100% utilization is unrealistic: model peak and idle hours", "Equipment ages fast and needs service", "Electricity and internet are critical"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "internet_service_contract", "equipment_service_contracts", "labor_contracts"]
  },
  children_playroom: {
    aiHints: { ru: "Бизнес-модель: почасовые посещения детской игровой зоны; важны безопасность, поток семей, время пребывания, персонал и санитария.", uz: "Biznes-model: bolalar o'yin zonasi uchun soatlik tashriflar; xavfsizlik, oilalar oqimi, qolish vaqti, personal va sanitariya muhim.", en: "Business model: hourly visits to a children's play area; key drivers are safety, family traffic, stay duration, staff and sanitation." },
    sectorRisks: { ru: ["Травмы детей — главный риск", "Трафик зависит от ТЦ/парка и выходных", "Оборудование должно регулярно проверяться"], uz: ["Bolalar jarohati asosiy xavf", "Trafik TTS/park va dam olish kunlariga bog'liq", "Uskunalar muntazam tekshirilishi kerak"], en: ["Child injury is the main risk", "Traffic depends on mall/park and weekends", "Equipment must be checked regularly"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_agreement", "child_safety_rules", "equipment_service_contracts", "labor_contracts"]
  },
  bike_scooter_rental: {
    aiHints: { ru: "Бизнес-модель: почасовая аренда инвентаря. Главные драйверы: трафик в парках/набережных, сезонность, износ инвентаря и правила ответственности клиента. Не путать с каршерингом или таксовым прокатом.", uz: "Biznes-model: inventarni soatlik ijaraga berish. Asosiy omillar: park/ko'cha trafigi, mavsumiylik, inventar eskirishi va mijoz javobgarligi qoidalari. Karshering yoki taksi ijarasi bilan aralashtirilmasin.", en: "Business model: hourly asset rental. Key drivers: park/waterfront traffic, seasonality, inventory wear and customer liability rules. Not to be confused with car-sharing or taxi rental." },
    sectorRisks: { ru: ["Сезонность: зимой выручка может почти исчезнуть, а фиксированные расходы останутся", "Инвентарь изнашивается и требует ремонта/замены", "100% загрузка нереальна: считать 40-60% в базовом сценарии"], uz: ["Mavsumiylik: qishda tushum deyarli yo'qolishi mumkin, lekin doimiy xarajatlar qoladi", "Inventar eskiradi va ta'mir/almashtirish talab qiladi", "100% yuklama real emas: bazaviy ssenariyda 40-60% hisoblash kerak"], en: ["Seasonality: winter revenue may nearly disappear while fixed costs remain", "Inventory wears out and needs repair/replacement", "100% utilization is unrealistic: model 40-60% in the base case"] },
    keyDocuments: ["business_registration", "tax_mode", "lease_or_location_agreement", "rental_contract_act", "client_liability_rules", "labor_contracts"]
  }
} ;

export const businessSamples = baseBusinessSamples.map((sample) => {
  const aiContext = prioritySampleAiContext[sample.id] ?? {};
  return {
    ...sample,
    ...aiContext,
    aliases: Array.from(new Set([...sample.aliases, ...sampleAliasAdditions[sample.id]]))
  };
}) satisfies BusinessSampleDefinition[];

export function getBusinessSampleById(id?: string | null): BusinessSampleDefinition | undefined {
  return id ? businessSamples.find((sample) => sample.id === id) : undefined;
}

const generatedSampleLabels = Object.fromEntries(
  businessSamples.flatMap((sample) => [
    [sample.subcategory, sample.label],
    [`${sample.subcategory}_focus`, sample.label]
  ])
) as Record<string, LocalizedLabel>;

export const businessSampleProfileLabels: Record<string, LocalizedLabel> = {
  ...commonProfileLabels,
  ...generatedSampleLabels
};


function normalizeForSample(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[\u2010-\u2015]/g, "-")
    .replace(/[^a-zа-я0-9'\s/-]+/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsWholePhrase(text: string, phrase: string) {
  if (!text || !phrase) return false;
  return text === phrase || text.startsWith(`${phrase} `) || text.endsWith(` ${phrase}`) || text.includes(` ${phrase} `);
}

function uniqueCandidateAliases(sample: BusinessSampleDefinition) {
  return Array.from(new Set([sample.label.ru, sample.label.uz, sample.label.en, ...sample.aliases]));
}

type BusinessSampleMatchOptions = {
  requireExactPhrase?: boolean;
  minScore?: number;
};

function sampleMatchScore(text: string, sample: BusinessSampleDefinition, options: BusinessSampleMatchOptions = {}) {
  let bestScore = 0;
  for (const alias of uniqueCandidateAliases(sample)) {
    const normalizedAlias = normalizeForSample(alias);
    if (normalizedAlias.length < 3) continue;

    const aliasWords = normalizedAlias.split(" ").filter((part) => part.length >= 2);
    const significantAliasWords = aliasWords.filter((part) => part.length >= 4);
    const hasWholePhrase = containsWholePhrase(text, normalizedAlias);

    if (text === normalizedAlias) {
      bestScore = Math.max(bestScore, 2200 + normalizedAlias.length);
      continue;
    }

    if (hasWholePhrase) {
      bestScore = Math.max(bestScore, 1600 + normalizedAlias.length + aliasWords.length * 20);
      continue;
    }

    if (options.requireExactPhrase) continue;

    if (aliasWords.length === 1 && significantAliasWords.length === 1 && containsWholePhrase(text, aliasWords[0])) {
      bestScore = Math.max(bestScore, 1050 + aliasWords[0].length);
      continue;
    }

    if (significantAliasWords.length >= 2) {
      const matchedWords = significantAliasWords.filter((word) => containsWholePhrase(text, word)).length;
      const ratio = matchedWords / significantAliasWords.length;
      if (matchedWords >= 2 && ratio >= 0.75) {
        bestScore = Math.max(bestScore, 900 + matchedWords * 80 + Math.round(ratio * 100));
      }
    }
  }
  return bestScore;
}

function sampleMatches(text: string, sample: BusinessSampleDefinition, options: BusinessSampleMatchOptions = {}) {
  return sampleMatchScore(text, sample, options) >= (options.minScore ?? (options.requireExactPhrase ? 1500 : 900));
}

function categoryBusinessModel(category: BusinessCategory) {
  switch (category) {
    case "retail": return "sample_retail_business";
    case "ecommerce": return "sample_ecommerce_business";
    case "food_service": return "sample_food_service_business";
    case "beauty_wellness": return "sample_beauty_business";
    case "education": return "sample_education_business";
    case "professional_services":
    case "it_digital": return "sample_professional_service_business";
    case "manufacturing": return "sample_manufacturing_business";
    case "construction": return "sample_construction_business";
    case "agriculture": return "sample_agriculture_business";
    case "entertainment": return "sample_entertainment_location";
    case "tourism_hospitality": return "sample_hospitality_business";
    case "logistics":
    case "transport": return "sample_logistics_business";
    case "real_estate": return "sample_real_estate_service";
    default: return "sample_service_business";
  }
}

function operationalModelForCategory(category: BusinessCategory, sample: BusinessSampleDefinition): OperationalModel {
  if (sample.id.includes("online") || category === "ecommerce") return "online_only";
  if (category === "manufacturing" || sample.id.includes("production")) return "production_workshop";
  if (category === "professional_services" || category === "it_digital" || category === "real_estate") return "mixed";
  if (category === "logistics" || category === "transport") return "mobile_service";
  if (sample.id.includes("rental") || sample.id.includes("club")) return "standalone_location";
  return "standalone_location";
}

function revenueUnitForCategory(category: BusinessCategory, sample: BusinessSampleDefinition) {
  if (category === "retail") return "retail_sale";
  if (category === "ecommerce") return "online_sale";
  if (category === "food_service") return "food_order";
  if (category === "education") return "subscription_or_lesson";
  if (category === "entertainment" || sample.id.includes("rental")) return "rental_or_hourly_session";
  if (category === "manufacturing" || category === "agriculture") return "production_order";
  if (category === "tourism_hospitality" || category === "real_estate") return "visit_or_booking";
  if (category === "logistics" || category === "transport") return "trip_or_delivery";
  return "service_order";
}

function capacityUnitForCategory(category: BusinessCategory, sample: BusinessSampleDefinition) {
  if (category === "retail" || category === "ecommerce") return "sales_per_month";
  if (category === "education") return "students_per_month";
  if (category === "entertainment" || sample.id.includes("rental")) return "sessions_per_month";
  if (category === "manufacturing" || category === "agriculture") return "production_units_per_month";
  if (category === "tourism_hospitality" || category === "real_estate") return "bookings_per_month";
  if (category === "logistics" || category === "transport") return "deliveries_per_month";
  return "orders_per_month";
}

function sourceCategoriesForCategory(category: BusinessCategory) {
  switch (category) {
    case "retail": return ["retail", "prices", "small_business", "demography", "real_estate"];
    case "ecommerce": return ["ecommerce", "prices", "marketplace", "small_business", "digital_economy"];
    case "food_service": return ["food_service", "retail_food_prices", "sanitary", "small_business", "labor_market"];
    case "education": return ["education", "demography", "labor_market", "licensing", "prices"];
    case "beauty_wellness": return ["beauty_wellness", "sanitary", "labor_market", "prices", "real_estate"];
    case "manufacturing": return ["manufacturing", "prices", "labor_market", "industry_report", "small_business"];
    case "agriculture": return ["agriculture", "prices", "water", "weather_seasonality", "labor_market"];
    case "construction": return ["construction", "prices", "real_estate", "labor_market", "documents"];
    case "logistics":
    case "transport": return ["logistics", "transport", "fuel_prices", "labor_market", "documents"];
    case "tourism_hospitality": return ["tourism_hospitality", "demography", "prices", "real_estate", "documents"];
    case "real_estate": return ["real_estate", "prices", "documents", "small_business", "demography"];
    case "entertainment": return ["entertainment", "demography", "prices", "real_estate", "labor_market"];
    case "it_digital": return ["it_digital", "digital_economy", "labor_market", "small_business", "prices"];
    case "professional_services": return ["services", "small_business", "labor_market", "prices", "demography"];
    default: return ["services", "small_business", "prices", "labor_market", "demography"];
  }
}

function sampleSpecificProfileOverride(sample: BusinessSampleDefinition, base: { hasPremises: boolean; currencyExposure: boolean }): SampleProfile {
  if (sample.id === "children_clothing_store_sample") {
    return {
      subcategory: "children_clothing_store",
      businessModel: "retail_goods_store",
      primaryRevenueModel: "product_sales",
      hasInventory: true,
      hasSanitaryRequirements: false,
      documentProfile: "standard_service",
      requiredDataForAnalysis: ["businessType", "businessIdea", "region", "targetCustomers", "customerAcquisitionChannels", "monthlyCapacity", "averagePrice", "averagePurchaseCost", "inventoryTurnoverDays", "ownContributionAmount"],
      keyCostDrivers: ["rent", "inventory", "payroll", "marketing", "returns"],
      keyRevenueDrivers: ["customer_flow", "average_ticket", "inventory_turnover", "repeat_customers"],
      keyRisks: ["seasonality", "size_mix", "unsold_inventory", "supplier_terms", "cash_gap"]
    };
  }
  if (sample.id === "clothing_alteration_atelier") {
    return {
      subcategory: "tailoring_alteration",
      businessModel: "tailoring_repair_service",
      operationalModel: "inside_partner_location",
      primaryRevenueModel: "tailoring_order",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: base.hasPremises,
      usesPremises: base.hasPremises,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: false,
      hasHighWorkingCapitalNeed: false,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      revenueUnit: "tailoring_order",
      capacityUnit: "orders_per_month",
      volumeField: "monthlyCapacity",
      averageTicketField: "averagePrice",
      keyCostDrivers: ["rent", "sewing_equipment", "consumables", "tailor_payroll", "marketing", "utilities"],
      keyRevenueDrivers: ["walk_in_traffic", "orders_per_month", "average_ticket", "repeat_clients", "recommendations"],
      keyRisks: ["location_traffic", "tailor_skill", "quality_claims", "seasonality", "equipment_downtime", "rent_dependency"],
      additionalInterviewTopics: ["location_traffic", "tailoring_capacity", "equipment", "staff_and_quality", "repeat_clients"],
      requiredDataForAnalysis: ["businessType", "businessIdea", "region", "district", "productOrService", "targetCustomers", "customerAcquisitionChannels", "monthlyCapacity", "averagePrice", "equipmentList", "staffPlan", "premisesStatus", "ownContributionAmount", "creditNeeded"],
      excludedInterviewBlocks: ["production_process", "retail_sku", "food_service_menu", "auto_service_format", "car_wash_format"],
      documentCategories: ["registration", "tax_cash_register", "rent_contract", "service_terms", "labor_contracts"],
      sourceCategories: ["services_statistics", "labor_market", "prices", "maps_proxy", "small_business", "tax_registration"],
      recommendedSourceCategories: ["services_statistics", "labor_market", "prices", "maps_proxy", "small_business", "tax_registration"],
      documentProfile: "standard_service",
      needsSpecialLicense: false,
      isImportDependent: base.currencyExposure
    };
  }
  if (sample.id === "bike_scooter_rental") {
    return {
      subcategory: "bike_scooter_rental",
      businessModel: "asset_rental_service",
      operationalModel: "standalone_location",
      primaryRevenueModel: "rental_session",
      providesServices: true,
      sellsGoods: false,
      producesGoods: false,
      rentsAssets: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: base.hasPremises,
      usesPremises: base.hasPremises,
      hasLicensingOrPermits: true,
      hasSafetyRisk: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      revenueUnit: "rental_session",
      capacityUnit: "rental_sessions_per_month",
      volumeField: "rentalOrdersPerMonth",
      averageTicketField: "rentalPrice",
      keyCostDrivers: ["asset_purchase_capex", "maintenance_repairs", "charging_or_storage", "location_fee", "staff_payroll", "insurance_or_liability"],
      keyRevenueDrivers: ["rental_sessions", "average_ticket", "utilization_rate", "location_traffic", "repeat_clients"],
      keyRisks: ["asset_damage", "seasonality", "location_traffic", "safety_liability", "maintenance_repairs"],
      additionalInterviewTopics: ["fleet_size", "rental_sessions", "maintenance_repairs", "safety_liability", "seasonality"],
      requiredDataForAnalysis: ["businessType", "businessIdea", "region", "district", "rentalFleetSize", "rentalOrdersPerMonth", "rentalPrice", "equipmentList", "staffPlan", "ownContributionAmount", "creditNeeded"],
      excludedInterviewBlocks: ["production_process", "production_line_factory", "retail_sku", "food_service_menu", "auto_service_format"],
      documentCategories: ["registration", "tax_cash_register", "rent_contract", "service_terms", "liability", "labor_contracts"],
      sourceCategories: ["services_statistics", "demography", "mall_traffic_proxy", "labor_market", "prices", "legal_contracts"],
      recommendedSourceCategories: ["services_statistics", "demography", "mall_traffic_proxy", "labor_market", "prices", "legal_contracts"],
      documentProfile: "standard_service",
      needsSpecialLicense: false
    };
  }
  if (sample.id === "mini_laundry") {
    return {
      subcategory: "self_service_laundry",
      businessModel: "self_service_laundry",
      primaryRevenueModel: "laundry_cycle",
      providesServices: true,
      sellsGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: base.hasPremises,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSeasonality: false,
      revenueUnit: "laundry_cycle",
      capacityUnit: "cycles_per_day",
      volumeField: "laundryCyclesPerDay",
      averageTicketField: "averageLaundryTicket",
      keyCostDrivers: ["rent", "laundry_equipment", "detergents_consumables", "utilities", "maintenance", "staff_payroll"],
      keyRevenueDrivers: ["laundry_cycles_per_day", "average_ticket", "repeat_clients", "detergent_addon_sales"],
      keyRisks: ["equipment_downtime", "water_electricity", "damage_liability", "sanitary_requirements", "location_flow"],
      additionalInterviewTopics: ["laundry_service_model", "laundry_equipment", "utilities_water_drainage", "damage_liability", "repeat_clients"],
      documentProfile: "standard_service"
    };
  }
  if (sample.id === "solar_panel_installation") {
    return {
      subcategory: "solar_installation",
      businessModel: "solar_panel_installation_service",
      primaryRevenueModel: "installation_project",
      usesMobileService: true,
      hasPremises: false,
      usesPremises: false,
      hasInventory: true,
      hasEquipment: true,
      hasB2BContracts: true,
      hasCurrencyExposure: true,
      revenueUnit: "solar_project",
      capacityUnit: "projects_per_month",
      volumeField: "solarProjectsPerMonth",
      averageTicketField: "averageSolarProjectTicket",
      keyRevenueDrivers: ["projects_per_month", "average_project_ticket", "equipment_margin", "maintenance_contracts"],
      keyCostDrivers: ["solar_panels", "inverters", "mounting_systems", "installer_payroll", "transport", "warranty_service"],
      keyRisks: ["electrical_safety", "supplier_availability", "currency_risk", "warranty_claims", "permit_connection"],
      documentProfile: "standard_service"
    };
  }
  if (sample.id === "neighborhood_bakery") {
    return {
      subcategory: "bakery",
      businessModel: "food_service_bakery",
      primaryRevenueModel: "product_sales",
      providesServices: true,
      sellsGoods: true,
      producesGoods: true,
      hasInventory: true,
      hasEquipment: true,
      hasSanitaryRequirements: true,
      hasHighWorkingCapitalNeed: true,
      revenueUnit: "bakery_sale",
      capacityUnit: "bakery_sales_per_day",
      keyCostDrivers: ["ingredients", "packaging", "bakery_equipment", "rent", "staff_payroll", "utilities", "waste"],
      keyRevenueDrivers: ["daily_covers", "average_ticket", "takeaway_coffee", "repeat_customers", "office_workers"],
      keyRisks: ["sanitary_compliance", "daily_waste", "ingredient_price_volatility", "equipment_downtime", "location_flow"],
      documentProfile: "food_license"
    };
  }
  if (sample.id === "cleaning_company") {
    return {
      subcategory: "cleaning_service",
      operationalModel: "mobile_service",
      providesServices: true,
      sellsGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: false,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasB2BContracts: true,
      hasWalkInTraffic: false,
      revenueUnit: "cleaning_order",
      capacityUnit: "orders_per_day",
      volumeField: "dailyOrdersCapacity",
      averageTicketField: "averageCleaningTicket",
      keyCostDrivers: ["staff_payroll", "cleaning_chemicals", "equipment", "transport", "uniforms", "marketing", "insurance_or_liability"],
      keyRevenueDrivers: ["orders_per_day", "average_ticket", "sqm_price", "repeat_clients", "b2b_contracts", "subscription_cleaning"],
      keyRisks: ["customer_acquisition", "staff_turnover", "quality_claims", "chemical_safety", "transport_delays", "b2b_payment_delays"],
      additionalInterviewTopics: ["cleaning_service_model", "clients_contracts", "equipment_consumables", "staff_schedule", "quality_control", "pricing_unit_economics"],
      documentProfile: "standard_service"
    };
  }
  if (sample.id === "car_wash_sample") {
    return {
      subcategory: "car_wash",
      operationalModel: "standalone_location",
      providesServices: true,
      sellsGoods: false,
      hasInventory: true,
      hasEquipment: true,
      hasPremises: base.hasPremises,
      hasLicensingOrPermits: true,
      hasSanitaryRequirements: true,
      hasEnvironmentalRisk: true,
      hasSeasonality: true,
      hasCustomerFlowDependency: true,
      hasWalkInTraffic: true,
      hasCurrencyExposure: base.currencyExposure,
      revenueUnit: "car_wash_order",
      capacityUnit: "cars_per_day",
      volumeField: "carsPerDayStable",
      averageTicketField: "averageWashTicket",
      keyCostDrivers: ["rent_or_land", "wash_equipment", "water_electricity", "detergents_chemicals", "staff_payroll", "maintenance", "marketing", "wastewater_handling"],
      keyRevenueDrivers: ["cars_per_day", "average_wash_ticket", "wash_bays_count", "repeat_clients", "b2b_fleet_contracts"],
      keyRisks: ["location_flow", "water_and_drainage", "equipment_downtime", "chemical_safety", "staff_turnover", "seasonality", "environmental_compliance"],
      additionalInterviewTopics: ["car_wash_format", "car_wash_location_infrastructure", "car_wash_services_capacity", "car_wash_equipment_chemicals", "car_wash_clients_pricing", "car_wash_staff_quality", "car_wash_documents_environment"],
      documentProfile: "standard_service"
    };
  }
  return {};
}

function profileForSample(sample: BusinessSampleDefinition): SampleProfile {
  const category = sample.category;
  const retailLike = category === "retail" || category === "ecommerce";
  const serviceLike = ["services", "beauty_wellness", "education", "healthcare", "professional_services", "it_digital", "tourism_hospitality", "entertainment", "real_estate", "logistics", "transport"].includes(category);
  const manufacturingLike = category === "manufacturing" || category === "agriculture";
  const food = category === "food_service";
  const regulated = category === "education" || category === "healthcare" || category === "food_service" || category === "beauty_wellness" || category === "transport";
  const sanitary = category === "food_service" || category === "healthcare" || category === "beauty_wellness";
  const rentsAssets = sample.id.includes("rental") || sample.id.includes("club") || sample.id.includes("playstation") || sample.id.includes("karaoke");
  const hasInventory = retailLike || food || manufacturingLike || sample.id.includes("store") || sample.id.includes("repair") || sample.id.includes("laundry") || sample.id.includes("dry_cleaning");
  const hasEquipment = !sample.id.includes("legal") && !sample.id.includes("accounting") && !sample.id.includes("hr_agency") && !sample.id.includes("marketing_agency");
  const hasPremises = category !== "ecommerce" && !sample.id.includes("district_delivery_service");
  const hasB2BContracts = category === "professional_services" || category === "it_digital" || category === "manufacturing" || category === "logistics" || sample.id.includes("office") || sample.id.includes("b2b");
  const hasWalkInTraffic = ["retail", "food_service", "beauty_wellness", "services", "entertainment"].includes(category) && !sample.id.includes("cleaning_company") && !sample.id.includes("district_delivery_service");
  const currencyExposure = retailLike || manufacturingLike || sample.id.includes("computer_club") || sample.id.includes("phone_repair") || sample.id.includes("auto_parts") || sample.id.includes("solar") || sample.id.includes("equipment");
  const topics = [
    "pricing_model",
    hasWalkInTraffic ? "location_traffic" : "sales_channels",
    hasEquipment ? "equipment" : "team_capacity",
    hasInventory ? "inventory_and_suppliers" : "staff_and_quality",
    regulated ? "documents_compliance" : "market_validation"
  ];
  const sampleOverride = sampleSpecificProfileOverride(sample, { hasPremises, currencyExposure });
  return {
    subcategory: sample.subcategory,
    businessModel: categoryBusinessModel(category),
    operationalModel: operationalModelForCategory(category, sample),
    primaryRevenueModel: revenueUnitForCategory(category, sample),
    providesServices: serviceLike || food,
    sellsGoods: retailLike || food || sample.id.includes("store") || sample.id.includes("sales"),
    producesGoods: manufacturingLike,
    rentsAssets,
    importsGoodsOrInputs: currencyExposure,
    importsGoods: currencyExposure,
    exportsGoodsOrServices: false,
    usesDelivery: category === "ecommerce" || sample.id.includes("delivery") || sample.id.includes("pizza"),
    usesPremises: hasPremises,
    usesMobileService: category === "logistics" || category === "transport" || sample.id.includes("mobile") || sample.id.includes("cleaning_company") || sample.id.includes("handyman"),
    hasInventory,
    hasEquipment,
    hasPremises,
    hasStaff: true,
    hasLicensingOrPermits: regulated,
    hasSanitaryRequirements: sanitary,
    hasEnvironmentalRisk: category === "agriculture" || sample.id.includes("dry_cleaning") || sample.id.includes("car_wash") || sample.id.includes("laundry"),
    hasSafetyRisk: true,
    hasSeasonality: ["food_service", "agriculture", "tourism_hospitality", "entertainment", "retail"].includes(category),
    hasHighWorkingCapitalNeed: retailLike || manufacturingLike || food,
    hasCustomerFlowDependency: hasWalkInTraffic,
    hasB2BContracts,
    hasWalkInTraffic,
    hasRegulatedActivity: regulated,
    hasCurrencyExposure: currencyExposure,
    hasCreditOrLeasingNeed: hasEquipment || manufacturingLike || rentsAssets,
    revenueUnit: revenueUnitForCategory(category, sample),
    capacityUnit: capacityUnitForCategory(category, sample),
    averageTicketField: "averagePrice",
    volumeField: "monthlyCapacity",
    relevantInterviewBlocks: [...approvedSampleInterviewBlocks],
    excludedInterviewBlocks: [
      ...(food ? [] : ["food_service_menu", "seating_capacity"]),
      ...(manufacturingLike ? [] : ["production_line_factory"]),
      ...(retailLike ? [] : ["retail_sku"])
    ],
    requiredDataForAnalysis: ["businessType", "businessIdea", "region", "district", "productOrService", "targetCustomers", "monthlyCapacity", "averagePrice", "ownContributionAmount", ...topics],
    keyCostDrivers: ["rent", "payroll", hasEquipment ? "equipment" : "staff", hasInventory ? "inventory" : "marketing", "working_capital"],
    keyRevenueDrivers: [hasWalkInTraffic ? "customer_flow" : "sales_channels", "average_ticket", "utilization", "repeat_customers"],
    keyRisks: ["market_demand", "competition", "price_margin", hasInventory ? "supplier_risk" : "staff_qualification", hasEquipment ? "equipment_downtime" : "execution"],
    documentCategories: ["registration", "tax", "contracts", ...(regulated ? ["licensing"] : ["no_special_license"])],
    sourceCategories: sourceCategoriesForCategory(category),
    recommendedSourceCategories: sourceCategoriesForCategory(category),
    additionalInterviewTopics: topics,
    documentProfile: regulated ? (food ? "food_license" : category === "education" ? "education_license" : category === "transport" ? "transport_license" : "standard_service") : "standard_service",
    needsSpecialLicense: regulated,
    isImportDependent: currencyExposure,
    isFoodRelated: food,
    ...(sample.profile ?? {}),
    ...sampleOverride
  };
}

export function findBusinessSampleProfile(rawText: string, options: BusinessSampleMatchOptions = {}): { sample: BusinessSampleDefinition; profile: SampleProfile; score: number } | null {
  const text = normalizeForSample(rawText);
  if (!text) return null;
  const minScore = options.minScore ?? (options.requireExactPhrase ? 1500 : 900);
  const matches = businessSamples
    .map((sample) => ({ sample, score: sampleMatchScore(text, sample, options) }))
    .filter((match) => match.score >= minScore)
    .sort((left, right) => right.score - left.score || Math.max(...uniqueCandidateAliases(right.sample).map((alias) => normalizeForSample(alias).length)) - Math.max(...uniqueCandidateAliases(left.sample).map((alias) => normalizeForSample(alias).length)));
  const match = matches[0];
  return match ? { sample: match.sample, profile: profileForSample(match.sample), score: match.score } : null;
}
