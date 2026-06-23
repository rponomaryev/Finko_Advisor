import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 04 (30-40)", async () => {
  await checkActualPdfSampleRange(30, 40);
});
