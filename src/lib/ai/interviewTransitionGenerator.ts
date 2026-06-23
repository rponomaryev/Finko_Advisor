import { translateBlock } from "../i18n/interviewLabels.ts";
import type { Locale, StructuredProjectData } from "../types/project.ts";

type TransitionBlock = { id?: string; name?: string; description?: string } | string | undefined;

function blockName(block: TransitionBlock, locale: Locale) {
  if (!block) return "";
  if (typeof block === "string") return translateBlock(locale, block, block).name;
  if (block.id) return translateBlock(locale, block.id, block.name ?? block.description ?? block.id, block.description).name;
  return block.name ?? block.description ?? "";
}

function businessHint(businessType: string, locale: Locale) {
  const value = businessType.toLowerCase();
  const isCoffee = /коф|кафе|coffee|cafe|qahva|kafe/.test(value);
  const isSewing = /швей|пошив|sew|garment|tikuv|kiyim/.test(value);
  const isToy = /игруш|toy|o'yinchoq|oyinchoq/.test(value);

  if (locale === "en") {
    if (isCoffee) return "format, location, foot traffic, average ticket, equipment, menu and team";
    if (isSewing) return "products, machines, fabrics, productivity, orders, staff and sales channels";
    if (isToy) return "toy category, materials, safety requirements, equipment, capacity and sales channels";
    return "product or service, customers, premises, equipment, sales, costs and financing";
  }
  if (locale === "uz") {
    if (isCoffee) return "format, joylashuv, mijozlar oqimi, o'rtacha chek, uskuna, menyu va jamoa";
    if (isSewing) return "mahsulotlar, uskunalar, matolar, unumdorlik, buyurtmalar, xodimlar va savdo kanallari";
    if (isToy) return "o'yinchoq turi, materiallar, xavfsizlik talablari, uskunalar, quvvat va savdo kanallari";
    return "mahsulot yoki xizmat, mijozlar, joy, uskunalar, savdo, xarajatlar va moliyalashtirish";
  }
  if (isCoffee) return "формат, локацию, поток клиентов, средний чек, оборудование, меню и команду";
  if (isSewing) return "вид изделий, оборудование, ткани, производительность, заказы, персонал и каналы продаж";
  if (isToy) return "категорию игрушек, материалы, требования безопасности, оборудование, мощность и продажи";
  return "продукт или услугу, клиентов, помещение, оборудование, продажи, расходы и финансирование";
}

function knownSummary(data: StructuredProjectData, locale: Locale) {
  const parts: string[] = [];
  if (data.region) parts.push(locale === "en" ? `region: ${data.region}` : locale === "uz" ? `hudud: ${data.region}` : `регион: ${data.region}`);
  if (data.district) parts.push(locale === "en" ? `district/city: ${data.district}` : locale === "uz" ? `tuman/shahar: ${data.district}` : `район/город: ${data.district}`);
  if (data.businessIdea) parts.push(locale === "en" ? "business idea" : locale === "uz" ? "biznes g'oya" : "бизнес-идею");
  return parts.join(", ");
}

export function generateInterviewTransitionMessage(input: {
  locale?: Locale;
  businessType?: string;
  previousBlock?: TransitionBlock;
  nextBlock?: TransitionBlock;
  structuredData?: StructuredProjectData;
}) {
  const locale = input.locale ?? "ru";
  const businessType = input.businessType || input.structuredData?.businessType || (locale === "en" ? "business" : locale === "uz" ? "biznes" : "бизнес");
  const next = blockName(input.nextBlock, locale);
  const known = knownSummary(input.structuredData ?? {}, locale);
  const hint = businessHint(businessType, locale);

  if (locale === "en") {
    return `Thank you${known ? ` for providing ${known}` : " for the details"}. Now let’s clarify the next section${next ? `: ${next}` : ""}. For ${businessType}, this helps assess ${hint} and produce a more accurate financial model and risk view.`;
  }
  if (locale === "uz") {
    return `Rahmat${known ? `, siz ${known} bo'yicha ma'lumot berdingiz` : ", ma'lumotlar saqlandi"}. Endi keyingi bo'limni aniqlashtiramiz${next ? `: ${next}` : ""}. ${businessType} uchun bu ${hint}ni to'g'ri baholashga yordam beradi.`;
  }
  return `Спасибо${known ? `, что указали ${known}` : ", данные раздела сохранены"}. Теперь уточним следующий блок${next ? `: ${next}` : ""}. Для бизнеса «${businessType}» это поможет точнее оценить ${hint}, финансовую модель и риски.`;
}
