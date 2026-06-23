import test from "node:test";
import assert from "node:assert/strict";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { translateQuestion } from "../src/lib/i18n/interviewLabels.ts";
import { getStableQuestions } from "../src/lib/services/interviewService.ts";

const laundryProject = {
  businessType: "Мини-прачечная и химчистка",
  businessIdea: "Небольшая прачечная в жилом районе. Принимает одежду, постельное белье, полотенца и рабочую форму. Клиенты — жители района, небольшие гостиницы, салоны красоты, кафе и медицинские кабинеты. Планируется прием заказов на месте и через Telegram. Покупка стиральных и сушильных машин, бытовой химии, кассы и оборотный капитал.",
  region: "Ташкент"
};

test("laundry document questions keep laundry wording and do not become car-wash questions", () => {
  const template = buildDynamicInterviewTemplate(laundryProject);
  assert.match(template.code, /self_service_laundry/);

  const docs = template.interviewBlocks.find((block) => block.id === "documents_experience");
  assert.ok(docs);
  const damage = docs.questions.find((question) => question.key === "damageLiability");
  assert.ok(damage);

  const localized = translateQuestion("ru", damage);
  assert.match(localized.question, /бель|стир|усад|окраш/i);
  assert.doesNotMatch(localized.question, /автомобил|автопарк|автохим/i);
});

test("laundry adaptive pack does not repeat generic equipment after laundry equipment was answered", () => {
  const template = buildDynamicInterviewTemplate({
    ...laundryProject,
    userLanguage: "ru",
    laundryEquipment: ["professional_washers", "professional_dryers", "payment_terminal"],
    laundryConsumables: ["washing_powder", "fabric_softener"],
    equipmentServiceSupport: "Сервис поставщика машин, запчасти в Ташкенте, простой до 24 часов.",
    qualityControlPlan: "Администратор проверяет чистоту, машины и жалобы клиентов.",
    clientContracts: true,
    damageLiability: "Порча и потеря фиксируются при приемке белья по правилам сервиса.",
    repeatClientsPct: 45,
    averageLaundryTicket: 90000
  } as any);

  const adaptive = template.interviewBlocks.find((block) => block.id === "adaptive_question_pack");
  const keys = adaptive?.questions.map((question) => question.key) ?? [];
  assert.equal(keys.includes("equipmentList"), false);
  assert.equal(keys.includes("equipmentServiceSupport"), false);
  assert.equal(keys.includes("serviceTerms"), false);
  assert.equal(keys.includes("repeatCustomersPlan"), false);
});

test("persisted interview plan cannot re-inject stale car liability into laundry documents", () => {
  const data = {
    ...laundryProject,
    interviewPlan: {
      version: "1.0",
      generatedAt: "2026-01-01T00:00:00.000Z",
      templateSignature: "services|self_service_laundry|standalone_location|мини-прачечная и химчистка|небольшая прачечная в жилом районе. принимает одежду, постельное белье, полотенца и рабочую форму. клиенты — жители района, небольшие гостиницы, салоны красоты, кафе и медицинские кабинеты. планируется прием заказов на месте и через telegram. покупка стиральных и сушильных машин, бытовой химии, кассы и оборотный капитал.",
      businessCategory: "services",
      businessSubcategory: "self_service_laundry",
      operationalModel: "standalone_location",
      blocks: {
        documents_experience: {
          blockId: "documents_experience",
          generatedBy: "template",
          generatedAt: "2026-01-01T00:00:00.000Z",
          questions: [
            { key: "damageLiability", label: "Ответственность", question: "Кто отвечает за повреждение автомобиля или имущества клиента и как это фиксируется?", type: "textarea" }
          ],
          requiredQuestionKeys: ["damageLiability"],
          optionalQuestionKeys: []
        }
      }
    }
  } as any;

  const stable = getStableQuestions(data, "documents_experience");
  const damage = stable.response.questions.find((question) => question.key === "damageLiability");
  assert.ok(damage);
  assert.match(damage.question, /бель|стир|усад|окраш/i);
  assert.doesNotMatch(damage.question, /автомобил|автопарк/i);
});
