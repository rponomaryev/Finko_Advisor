import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 08 (70-80)", async () => {
  await checkActualExcelSampleRange(70, 80);
});
