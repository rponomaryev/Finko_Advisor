import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";

test("false-positive protection keeps support functions from becoming the main industry", () => {
  const grooming = classifyBusiness({ businessType: "Мобильный груминг животных", businessIdea: "Выездной сервис, косметика и шампуни как расходники, партнеры — зоомагазины" });
  assert.equal(grooming.subcategory, "pet_grooming");
  assert.notEqual(grooming.category, "retail");
  assert.equal(grooming.sellsGoods, false);

  const rental = classifyBusiness({ businessType: "Аренда строительного инструмента", businessIdea: "Прокат инструмента, доставка по городу как дополнительная услуга" });
  assert.equal(rental.subcategory, "tool_equipment_rental");
  assert.notEqual(rental.category, "logistics");
  assert.equal(rental.usesDelivery, true);

  const service = classifyBusiness({ businessType: "Сервис установки солнечных панелей", businessIdea: "Монтаж оборудования на крышах, не производство панелей" });
  assert.equal(service.subcategory, "solar_installation");
  assert.notEqual(service.category, "manufacturing");
  assert.equal(service.producesGoods, false);

  const van = classifyBusiness({ businessType: "Мобильный груминг", businessIdea: "Фургон нужен для выезда к клиентам, автомобили не ремонтируем" });
  assert.equal(van.subcategory, "pet_grooming");
  assert.notEqual(van.subcategory, "auto_service");
});
