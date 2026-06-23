import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { parseCsvMarketData } from "@/lib/marketData/importers/csvImporter";
import { parseJsonMarketData, parseXlsxMarketData } from "@/lib/marketData/importers/xlsxImporter";
import { isAuthResponse, requireAdminSession } from "@/lib/server/auth";
import { assertCsrf, auditLog, enforceRateLimit } from "@/lib/server/security";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const allowedExtensions = new Set([".csv", ".json", ".xlsx"]);
const allowedTypes = new Set([
  "text/csv",
  "application/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/octet-stream"
]);

function extension(name: string) {
  const lower = name.toLowerCase();
  return [...allowedExtensions].find((ext) => lower.endsWith(ext));
}

async function parseUpload(file: File) {
  const ext = extension(file.name);
  const buffer = Buffer.from(await file.arrayBuffer());
  if (ext === ".csv") return parseCsvMarketData(buffer.toString("utf8"));
  if (ext === ".json") return parseJsonMarketData(JSON.parse(buffer.toString("utf8")));
  if (ext === ".xlsx") return parseXlsxMarketData(buffer);
  return [];
}

export async function POST(request: Request) {
  const session = requireAdminSession(request);
  if (isAuthResponse(session)) return session;

  const csrf = assertCsrf(request);
  if (csrf) return csrf;

  const limited = enforceRateLimit(request, "adminUpload", session);
  if (limited) return limited;

  const requestId = crypto.randomUUID();

  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      auditLog({ actor: session.demoUserId, route: "/api/admin/market-data/upload", action: "upload", result: "failure", requestId });
      return NextResponse.json({ error: "File is required" }, { status: 400 });
    }

    if (file.size > MAX_UPLOAD_BYTES || !extension(file.name) || !allowedTypes.has(file.type || "application/octet-stream")) {
      auditLog({ actor: session.demoUserId, route: "/api/admin/market-data/upload", action: "upload", result: "failure", requestId });
      return NextResponse.json({ error: "Unsupported or oversized file" }, { status: 400 });
    }

    const rows = await parseUpload(file);
    if (rows.length === 0) {
      auditLog({ actor: session.demoUserId, route: "/api/admin/market-data/upload", action: "upload", result: "failure", requestId });
      return NextResponse.json({ error: "No valid rows found" }, { status: 400 });
    }

    await prisma.marketDataPoint.createMany({
      data: rows.map((row) => ({
        sector: row.sector,
        businessType: row.businessType,
        indicator: row.indicator,
        year: row.year,
        region: row.region,
        value: row.value ?? null,
        unit: row.unit,
        currency: row.currency,
        hsCode: row.hsCode,
        activityCode: row.activityCode,
        tradeType: row.tradeType,
        country: row.country,
        productCategory: row.productCategory,
        valueUsd: row.valueUsd ?? null,
        volume: row.volume ?? null,
        sourceName: row.sourceName,
        sourceUrl: row.sourceUrl,
        sourceType: row.sourceType,
        lastUpdated: row.lastUpdated ? new Date(row.lastUpdated) : null
      }))
    });

    auditLog({ actor: session.demoUserId, route: "/api/admin/market-data/upload", action: "upload", result: "success", requestId });
    return NextResponse.json({ imported: rows.length, requestId });
  } catch {
    auditLog({ actor: session.demoUserId, route: "/api/admin/market-data/upload", action: "upload", result: "failure", requestId });
    return NextResponse.json({ error: "Could not process uploaded file" }, { status: 400 });
  }
}
