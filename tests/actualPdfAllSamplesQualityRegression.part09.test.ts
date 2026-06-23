import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 09 (80-90)", async () => {
  await checkActualPdfSampleRange(80, 90);
});
