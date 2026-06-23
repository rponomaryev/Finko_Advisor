import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 05 (40-50)", async () => {
  await checkActualPdfSampleRange(40, 50);
});
