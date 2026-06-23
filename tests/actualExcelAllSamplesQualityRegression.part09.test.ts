import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 09 (80-90)", async () => {
  await checkActualExcelSampleRange(80, 90);
});
