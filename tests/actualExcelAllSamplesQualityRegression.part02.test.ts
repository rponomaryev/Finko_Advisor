import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 02 (10-20)", async () => {
  await checkActualExcelSampleRange(10, 20);
});
