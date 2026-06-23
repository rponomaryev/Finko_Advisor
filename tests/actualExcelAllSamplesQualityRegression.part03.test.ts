import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 03 (20-30)", async () => {
  await checkActualExcelSampleRange(20, 30);
});
