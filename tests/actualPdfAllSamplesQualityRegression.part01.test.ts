import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 01 (0-10)", async () => {
  await checkActualPdfSampleRange(0, 10);
});
