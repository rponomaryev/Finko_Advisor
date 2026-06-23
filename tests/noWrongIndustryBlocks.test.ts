import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate, commonBlockShells } from "../src/lib/interview/dynamicInterviewEngine.ts";

const cases = [
  ["Мобильный груминг животных", "Выездной груминг собак и кошек, косметика расходник"],
  ["Аренда строительного инструмента", "Прокат инструмента с доставкой как опцией"],
  ["Автомойка", "Ручная мойка на 3 поста"],
  ["Клининговые услуги", "Уборка квартир и офисов"],
  ["Сервис установки солнечных панелей", "Монтаж солнечных панелей на крыше"],
  ["Мини-склад", "Хранение вещей в боксах"],
  ["Онлайн-школа английского", "Уроки английского онлайн"],
  ["Мебельная мастерская", "Мебель на заказ"],
  ["Импорт оборудования", "Импорт станков из Китая"],
  ["Кафе", "Кофейня с завтраками"]
] as const;

test("ten acceptance businesses keep common blocks and do not receive wrong industry blocks", () => {
  for (const [businessType, businessIdea] of cases) {
    const template = buildDynamicInterviewTemplate({ businessType, businessIdea, region: "Ташкент город" });
    const blockIds = template.interviewBlocks.map((block) => block.id);
    for (const id of commonBlockShells) assert.ok(blockIds.includes(id), `${businessType}: missing ${id}`);
    if (!/импорт/i.test(businessType)) assert.equal(blockIds.includes("logistics"), false, `${businessType}: logistics block leaked`);
    assert.equal(blockIds.includes("retail"), false, `${businessType}: retail block leaked`);
    assert.equal(blockIds.some((id) => id.startsWith("auto_service_")), false, `${businessType}: auto-service block leaked`);
    assert.equal(blockIds.some((id) => id.startsWith("tool_rental_")), false, `${businessType}: tool-rental dedicated block leaked`);
    assert.equal(blockIds.some((id) => id.startsWith("car_wash_")), false, `${businessType}: car-wash dedicated block leaked`);
  }
});


test("solar installation treats cafes and shops as customer objects, not food service or retail", () => {
  const template = buildDynamicInterviewTemplate({
    businessType: "Сервис установки и обслуживания солнечных панелей",
    businessIdea: "Компания устанавливает солнечные панели для частных домов, небольших магазинов, кафе, офисов и производственных помещений. Основная выручка — проектирование, монтаж и подключение систем под ключ. Продажа оборудования только в составе проекта, доставка только для выполнения проекта.",
    region: "Ташкентская область",
    district: "Кибрайский район"
  });

  const keys = new Set(template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));
  const labels = JSON.stringify(template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.label + " " + question.question + " " + (question.options ?? []).join(" "))));

  for (const id of commonBlockShells) assert.ok(template.interviewBlocks.some((block) => block.id === id), `missing ${id}`);
  assert.match(template.code, /solar_installation/);
  assert.ok(keys.has("solarSystemTypes"));
  assert.ok(keys.has("averageSolarProjectTicket"));
  assert.ok(keys.has("electricalSafetyPlan"));
  assert.equal(keys.has("menuCategories"), false);
  assert.equal(keys.has("seatingCapacity"), false);
  assert.equal(keys.has("skuCount"), false);
  assert.doesNotMatch(labels, /Формат заведения|Меню|Кафе|Ресторан|Кофейня/);
});


test("laundry treats cleaning negation as support context, not cleaning service", () => {
  const data = {
    businessType: "Прачечная самообслуживания",
    businessIdea: "Прачечная самообслуживания в жилом районе. Клиенты сами стирают и сушат одежду в профессиональных стиральных и сушильных машинах. Основная выручка — оплата за цикл стирки и сушки. Дополнительно продаются капсулы и порошок, но это не основной бизнес. Бизнес не является клининговой компанией.",
    region: "Ташкент"
  };
  const profile = classifyBusiness(data);
  assert.equal(profile.subcategory, "self_service_laundry");
  const template = buildDynamicInterviewTemplate(data);
  const allKeys = template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key));
  assert.ok(allKeys.includes("laundryServiceModel"));
  assert.ok(allKeys.includes("laundryMachinesCount"));
  assert.ok(!allKeys.includes("cleaningServiceTypes"));
  const allText = JSON.stringify(template.interviewBlocks);
  assert.doesNotMatch(allText, /Виды клининга|Какие услуги клининга/);
});

test("device repair treats spare parts and accessories as repair inputs, not retail store", () => {
  const data = {
    businessType: "Сервис ремонта смартфонов и ноутбуков",
    businessIdea: "Сервисный центр по ремонту смартфонов, планшетов и ноутбуков. Основная выручка — диагностика, ремонт, замена экранов, аккумуляторов, разъемов, клавиатур, чистка после залития, установка ПО и профилактическое обслуживание. Запчасти закупаются у поставщиков и используются в ремонте, но бизнес не является розничным магазином электроники. Дополнительно возможна продажа аксессуаров, но это не основная модель. Возможен курьерский забор устройства, но доставка является вспомогательной услугой.",
    region: "Ташкент город"
  };
  const profile = classifyBusiness(data);
  assert.equal(profile.category, "services");
  assert.equal(profile.subcategory, "device_repair");
  assert.equal(profile.sellsGoods, false);
  const template = buildDynamicInterviewTemplate(data);
  assert.match(template.code, /device_repair/);
  const keys = new Set(template.interviewBlocks.flatMap((block) => block.questions.map((question) => question.key)));
  assert.ok(keys.has("deviceTypes"));
  assert.ok(keys.has("repairServiceTypes"));
  assert.ok(keys.has("averageRepairTicket"));
  assert.ok(keys.has("deviceIntakeForm"));
  assert.equal(keys.has("skuCount"), false);
  assert.equal(keys.has("productCategories"), false);
  const allText = JSON.stringify(template.interviewBlocks);
  assert.doesNotMatch(allText, /Товарные категории|Сколько SKU|Маркетплейсы|Оптовики/);
});
