import type { InterviewBlock, SectorAssumptions } from "./project";

export type SectorTemplate = {
  code: string;
  name: string;
  description: string;
  businessType?: string;
  requiredInputs: string[];
  assumptions: SectorAssumptions;
  mainEquipment: string[];
  mainRawMaterials: string[];
  mainRisks: string[];
  interviewBlocks: InterviewBlock[];
  riskRules: Record<string, string>;
  scoringRules: Record<string, unknown>;
};

export type DynamicBusinessTemplate = SectorTemplate & {
  code: string;
  businessType: string;
};
