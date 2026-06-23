import { NextResponse } from "next/server";
import { getUsdUzsExchangeRate, isExchangeRateUnavailableError } from "@/lib/services/exchangeRateService";
import { enforceRateLimit } from "@/lib/server/security";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "exchangeRate");
  if (limited) return limited;

  const requestedDate = new URL(request.url).searchParams.get("date") ?? undefined;
  try {
    const snapshot = await getUsdUzsExchangeRate(requestedDate);
    return NextResponse.json(snapshot);
  } catch (error) {
    if (isExchangeRateUnavailableError(error)) {
      console.error("[exchange-rate] CBU rate unavailable", { requestedDate, message: error.message });
      return NextResponse.json(
        { error: "Official CBU USD/UZS exchange rate is temporarily unavailable.", requestedDate },
        { status: 503 }
      );
    }
    throw error;
  }
}
