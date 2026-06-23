import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 05 (40-50)", async () => {
  await checkActualExcelSampleRange(40, 50);
});
