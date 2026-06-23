import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 02 (10-20)", async () => {
  await checkActualPdfSampleRange(10, 20);
});
