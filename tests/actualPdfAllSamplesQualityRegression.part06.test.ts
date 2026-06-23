import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 06 (50-60)", async () => {
  await checkActualPdfSampleRange(50, 60);
});
