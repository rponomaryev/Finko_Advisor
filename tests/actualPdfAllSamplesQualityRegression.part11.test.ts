import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 11 (100-110)", async () => {
  await checkActualPdfSampleRange(100, 110);
});
