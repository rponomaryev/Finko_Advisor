import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 07 (60-70)", async () => {
  await checkActualPdfSampleRange(60, 70);
});
