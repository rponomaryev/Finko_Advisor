import { NextResponse } from "next/server";
import { genericBusinessTemplate } from "@/lib/data/sectorTemplates/genericBusinessTemplate";
import { prisma } from "@/lib/db/prisma";
import { isAuthResponse, requireAdminSession } from "@/lib/server/auth";
import { assertCsrf, auditLog, enforceRateLimit } from "@/lib/server/security";
import { sectorAssumptionsSchema } from "@/lib/validation/projectSchemas";

type RouteContext = {
  params: Promise<{ code: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = requireAdminSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "adminOperation", session);
  if (limited) return limited;

  const requestId = crypto.randomUUID();
  const { code } = await context.params;
  const body = await request.json().catch(() => null);
  const parsed = sectorAssumptionsSchema.partial().safeParse(body?.assumptions ?? body);

  if (!parsed.success) {
    auditLog({ actor: session.demoUserId, route: `/api/sector-templates/${code}`, action: "patch", result: "failure", requestId });
    return NextResponse.json({ error: "Invalid assumptions" }, { status: 400 });
  }

  const existing = await prisma.sectorTemplate.findUnique({ where: { code } });
  const currentAssumptions =
    (existing?.assumptions as typeof genericBusinessTemplate.assumptions | undefined) ??
    genericBusinessTemplate.assumptions;
  const assumptions = { ...currentAssumptions, ...parsed.data };

  const template = await prisma.sectorTemplate.upsert({
    where: { code },
    update: { assumptions },
    create: {
      code,
      name: genericBusinessTemplate.name,
      description: genericBusinessTemplate.description,
      businessType: genericBusinessTemplate.businessType,
      requiredInputs: genericBusinessTemplate.requiredInputs as never,
      assumptions,
      questions: genericBusinessTemplate.interviewBlocks as never,
      riskRules: genericBusinessTemplate.riskRules as never,
      scoringRules: genericBusinessTemplate.scoringRules as never,
      isActive: true
    }
  });

  auditLog({ actor: session.demoUserId, route: `/api/sector-templates/${code}`, action: "patch", result: "success", requestId });
  return NextResponse.json({ template });
}
