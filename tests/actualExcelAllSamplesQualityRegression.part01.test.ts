import test from "node:test";
import { checkActualExcelSampleRange } from "./helpers/checkActualExcelSampleRange.ts";

test("actual Excel all-samples quality regression batch 01 (0-10)", async () => {
  await checkActualExcelSampleRange(0, 10);
});
