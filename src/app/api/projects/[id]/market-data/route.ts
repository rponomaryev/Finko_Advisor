import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/marketData/marketDataService";
import { getProjectForSession, toStructuredProjectData } from "@/lib/services/projectService";
import { isAuthResponse, requireUserSession } from "@/lib/server/auth";
import { safeMarketDataDto } from "@/lib/server/dto";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const session = requireUserSession(request);
  if (isAuthResponse(session)) return session;

  const { id } = await context.params;
  const project = await getProjectForSession(id, session);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const profile = toStructuredProjectData(project as unknown as Record<string, unknown>);
  const data = await getMarketData({
    businessType: profile.businessType ?? project.title,
    region: profile.region,
    locale: profile.userLanguage ?? "ru"
  });
  return NextResponse.json(safeMarketDataDto(data));
}
