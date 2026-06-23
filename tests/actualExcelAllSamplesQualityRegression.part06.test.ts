import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 06 (50-60)", async () => {
  await checkActualExcelSampleRange(50, 60);
});
