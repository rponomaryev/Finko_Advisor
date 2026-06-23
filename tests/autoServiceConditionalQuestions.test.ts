import test from "node:test";
import assert from "node:assert/strict";
import { classifyBusiness } from "../src/lib/business/businessClassifier.ts";
import { buildDynamicInterviewTemplate } from "../src/lib/interview/dynamicInterviewEngine.ts";
import { buildVisibilityContext, isQuestionVisible, showIfMatches } from "../src/lib/interview/interviewValidation.ts";

function visibleMarketQuestions(autoServiceFormat: string) {
  const data = { businessType: "Автосервис", businessIdea: "Автосервис", region: "Ташкент", autoServiceFormat };
  const profile = classifyBusiness({ businessType: data.businessType, businessIdea: data.businessIdea, region: data.region, answers: data });
  const template = buildDynamicInterviewTemplate(data);
  const block = template.interviewBlocks.find((item) => item.id === "sales");
  assert.ok(block);
  const context = buildVisibilityContext({ answers: data, profile });
  const questions = block.questions.filter((question) => isQuestionVisible(question, context));
  const channels = questions.find((question) => question.key === "customerAcquisitionChannels");
  const channelOptions = channels?.options?.filter((option) => !channels.optionShowIf?.[option] || showIfMatches({ showIf: channels.optionShowIf[option] } as any, context)) ?? [];
  return { profile, questionKeys: questions.map((question) => question.key), channelOptions };
}

test("standalone auto service does not show host-business traffic questions or options", () => {
  const result = visibleMarketQuestions("standalone_service");
  assert.equal(result.profile.operationalModel, "standalone_location");
  assert.equal(result.profile.capabilities.dependsOnHostBusinessTraffic, false);
  assert.equal(result.questionKeys.includes("hostServiceTrafficAgreement"), false);
  assert.equal(result.questionKeys.includes("clientPaymentFlow"), false);
  assert.equal(result.channelOptions.includes("host_business_traffic"), false);
});

test("one box inside large auto service shows host-business traffic questions and option", () => {
  const result = visibleMarketQuestions("one_box_inside_large_service");
  assert.equal(result.profile.operationalModel, "inside_partner_location");
  assert.equal(result.profile.capabilities.dependsOnHostBusinessTraffic, true);
  assert.ok(result.questionKeys.includes("hostServiceTrafficAgreement"));
  assert.ok(result.questionKeys.includes("clientPaymentFlow"));
  assert.ok(result.channelOptions.includes("host_business_traffic"));
});
