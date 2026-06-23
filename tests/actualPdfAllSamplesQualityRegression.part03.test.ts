import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 03 (20-30)", async () => {
  await checkActualPdfSampleRange(20, 30);
});
