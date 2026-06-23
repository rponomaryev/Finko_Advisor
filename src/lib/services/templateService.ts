import { buildGenericBusinessTemplate, genericBusinessTemplate } from "../data/sectorTemplates/genericBusinessTemplate.ts";
import { buildDynamicInterviewTemplate } from "../interview/dynamicInterviewEngine.ts";
import type { DynamicBusinessTemplate, SectorTemplate } from "../types/sector.ts";
import type { InterviewQuestion, StructuredProjectData } from "../types/project.ts";

export type TemplateQuestionIndexItem = {
  block: SectorTemplate["interviewBlocks"][number];
  question: InterviewQuestion;
};

export function normalizeBusinessType(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : "Универсальный бизнес";
}

export function resolveTemplateForData(data?: Partial<StructuredProjectData> | null): DynamicBusinessTemplate {
  return buildDynamicInterviewTemplate(data ?? {});
}

export function resolveTemplateFromProject(project: Record<string, unknown>): DynamicBusinessTemplate {
  const structured =
    project.structuredData && typeof project.structuredData === "object"
      ? (project.structuredData as StructuredProjectData)
      : {};
  return resolveTemplateForData({
    ...structured,
    businessType: (project.businessType as string | undefined) ?? structured.businessType
  });
}

export function ensureDynamicTemplate(template?: SectorTemplate | DynamicBusinessTemplate | null, businessType?: string): DynamicBusinessTemplate {
  if (!template) return buildDynamicInterviewTemplate({ businessType });
  return {
    ...template,
    businessType: template.businessType ?? businessType ?? template.name,
    code: template.code || genericBusinessTemplate.code
  };
}

export function flattenTemplateQuestions(template: SectorTemplate): TemplateQuestionIndexItem[] {
  return template.interviewBlocks.flatMap((block) =>
    block.questions.map((question) => ({ block, question }))
  );
}

export function findTemplateQuestion(template: SectorTemplate, key: string): InterviewQuestion | undefined {
  return flattenTemplateQuestions(template).find((item) => item.question.key === key)?.question;
}

export function fieldLabel(template: SectorTemplate, key: string) {
  return findTemplateQuestion(template, key)?.label ?? key;
}

export function isRequiredQuestion(template: SectorTemplate, question: Pick<InterviewQuestion, "key" | "optional">) {
  return template.requiredInputs.includes(question.key) || question.optional === false;
}

export function templateCompletion(input: { template: SectorTemplate; missingFields: string[] }) {
  const totalRequired = input.template.requiredInputs.length || 1;
  return Math.max(0, Math.round(((totalRequired - input.missingFields.length) / totalRequired) * 100));
}
