import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 10 (90-100)", async () => {
  await checkActualPdfSampleRange(90, 100);
});
