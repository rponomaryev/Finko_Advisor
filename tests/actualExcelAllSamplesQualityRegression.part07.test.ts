import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 07 (60-70)", async () => {
  await checkActualExcelSampleRange(60, 70);
});
