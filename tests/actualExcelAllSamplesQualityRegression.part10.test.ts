import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 10 (90-100)", async () => {
  await checkActualExcelSampleRange(90, 100);
});
