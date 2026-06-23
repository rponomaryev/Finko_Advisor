import test from "node:test";
import { checkActualPdfSampleRange } from "./helpers/checkActualPdfSampleRange.ts";

test("actual PDF all-samples quality regression batch 08 (70-80)", async () => {
  await checkActualPdfSampleRange(70, 80);
});
