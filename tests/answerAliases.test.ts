import test from "node:test";
import assert from "node:assert/strict";
import { compatibleAnswerAliases } from "../src/lib/interview/answerAliases.ts";
import { valueByPathWithAliases } from "../src/lib/interview/interviewValidation.ts";

test("compatible answer aliases cover customer segment and ticket key variants", () => {
  assert.ok(compatibleAnswerAliases.targetCustomerSegments.includes("targetCustomers"));
  assert.ok(compatibleAnswerAliases.targetCustomers.includes("targetCustomerSegments"));
  assert.ok(compatibleAnswerAliases.targetCustomers.includes("customerSegments"));
  assert.ok(compatibleAnswerAliases.averageTicket.includes("averageServiceTicket"));
  assert.ok(compatibleAnswerAliases.averageTicket.includes("averageWashTicket"));
  assert.ok(compatibleAnswerAliases.averagePrice.includes("averageServiceTicket"));
  assert.ok(compatibleAnswerAliases.averagePrice.includes("averageWashTicket"));
});

test("valueByPathWithAliases resolves target customers and ticket aliases", () => {
  assert.deepEqual(
    valueByPathWithAliases({ targetCustomers: ["b2c", "repeat"] }, "targetCustomerSegments"),
    ["b2c", "repeat"]
  );
  assert.equal(valueByPathWithAliases({ averageServiceTicket: 180000 }, "averageTicket"), 180000);
  assert.equal(valueByPathWithAliases({ averageWashTicket: 65000 }, "averagePrice"), 65000);
});
