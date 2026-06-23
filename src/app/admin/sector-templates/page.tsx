import { redirect } from "next/navigation";
import { SectorTemplateAdmin } from "@/components/admin/SectorTemplateAdmin";
import { genericBusinessTemplate } from "@/lib/data/sectorTemplates/genericBusinessTemplate";
import { prisma } from "@/lib/db/prisma";
import { getServerSession } from "@/lib/server/auth";

export const dynamic = "force-dynamic";

export default async function SectorTemplatesPage() {
  const session = await getServerSession();
  if (!session || session.role !== "admin") redirect("/demo-login?admin=1&next=/admin/sector-templates");

  const fallbackTemplate: Record<string, unknown> = {
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
  };

  let template: Record<string, unknown> = fallbackTemplate;
  try {
    template =
      (await prisma.sectorTemplate.findUnique({
        where: { code: genericBusinessTemplate.code }
      })) ?? fallbackTemplate;
  } catch {
    template = fallbackTemplate;
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <SectorTemplateAdmin template={JSON.parse(JSON.stringify(template))} />
    </section>
  );
}
