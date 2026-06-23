import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 12 (110-120)", async () => {
  await checkActualPdfSampleRange(110, 120);
});
