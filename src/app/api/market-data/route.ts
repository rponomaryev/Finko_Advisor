import { NextResponse } from "next/server";
import { getMarketData } from "@/lib/marketData/marketDataService";
import { normalizeLocale } from "@/lib/i18n";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessType = url.searchParams.get("businessType") ?? "Универсальный бизнес";
  const region = url.searchParams.get("region") ?? undefined;
  const locale = normalizeLocale(url.searchParams.get("locale"));
  const data = await getMarketData({ businessType, region, locale });
  return NextResponse.json(data);
}
