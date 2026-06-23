import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 11 (100-110)", async () => {
  await checkActualExcelSampleRange(100, 110);
});
