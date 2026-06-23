import { NextResponse } from "next/server";
import { genericBusinessTemplate } from "@/lib/data/sectorTemplates/genericBusinessTemplate";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const templates = await prisma.sectorTemplate.findMany({
    orderBy: { name: "asc" }
  });

  if (templates.length === 0) {
    return NextResponse.json({
      templates: [
        {
          code: genericBusinessTemplate.code,
          name: genericBusinessTemplate.name,
          description: genericBusinessTemplate.description,
          businessType: genericBusinessTemplate.businessType,
          requiredInputs: genericBusinessTemplate.requiredInputs,
          assumptions: genericBusinessTemplate.assumptions,
          questions: genericBusinessTemplate.interviewBlocks,
          riskRules: genericBusinessTemplate.riskRules,
          scoringRules: genericBusinessTemplate.scoringRules,
          isActive: true
        }
      ],
      source: "fallback-template"
    });
  }

  return NextResponse.json({ templates, source: "database" });
}
