import test from "node:test";
import assert from "node:assert/strict";
import { buildPdfReportBuffer } from "../src/lib/export/pdfReportExporter.ts";
import { buildExcelReportBuffer } from "../src/lib/export/excelReportExporter.ts";
import { buildCalculatedProject, genericProfile } from "./helpers/systemicFixtures.ts";

const nonStringPayloads = {
  sectionNotes: {
    finance: { debt: "loan", leasing: ["lift", "diagnostics"] },
    salesMarketing: ["maps", "repeat clients", 42],
    equipment: { list: ["lift", "scanner"], ready: true },
    complianceExperience: null
  },
  locationTraffic: { street: "main road", cars: 120 },
  storageModel: ["shelves", "warehouse"],
  includedInfrastructure: { lift: true, electricity: true },
  paymentSettlementTerms: ["daily", "card"],
  damageLossPolicy: { policy: "client act" },
  toolMaintenancePlan: 12345,
  wastewaterHandling: false,
  equipmentList: { items: ["lift", "scanner"] }
};

test("report generation, PDF and Excel do not crash on non-string text-like answers", async () => {
  const profile = genericProfile({
    businessType: "Автосервис / СТО",
    category: "services",
    volumeKey: "plannedVolumeMonthly",
    priceKey: "averageServiceTicket",
    overrides: {
      plannedVolumeMonthly: 300,
      averageServiceTicket: 350_000,
      creditNeeded: "yes",
      requestedLoanAmount: 120_000_000,
      requestedLoanCurrency: "UZS",
      requestedLoanUZS: 120_000_000,
      loanPurpose: { equipment: "scanner", workingCapital: true },
      loanTermMonths: 36,
      loanAnnualRatePct: 26,
      loanRepaymentType: "annuity",
      collateralAvailable: true,
      collateralType: ["vehicle", "equipment"],
      needsLeasing: true,
      leasingItem: { asset: "diagnostic lift" },
      leasingAssetType: "equipment",
      requestedLeasingAmount: 85_000_000,
      requestedLeasingCurrency: "UZS",
      leasingTermMonths: 36,
      leasingAnnualRatePct: 24,
      leasingMonthlyPayment: 3_300_000,
      ...nonStringPayloads
    }
  });

  assert.doesNotThrow(() => buildCalculatedProject(profile));
  const project = buildCalculatedProject(profile);
  const pdf = await buildPdfReportBuffer(project, "ru");
  const xlsx = await buildExcelReportBuffer(project, "ru");
  assert.ok(pdf.length > 10_000);
  assert.ok(xlsx.length > 5_000);
});
