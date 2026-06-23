import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 12 (110-120)", async () => {
  await checkActualExcelSampleRange(110, 120);
});
