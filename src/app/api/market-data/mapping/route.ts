import { NextResponse } from "next/server";
import { mapBusinessToSector, shouldAskForMappingClarification } from "@/lib/marketData/hsCodeMapper";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const businessType = url.searchParams.get("businessType") ?? "Универсальный бизнес";
  const mapping = mapBusinessToSector(businessType);
  return NextResponse.json({
    mapping,
    needsClarification: shouldAskForMappingClarification(mapping)
  });
}
