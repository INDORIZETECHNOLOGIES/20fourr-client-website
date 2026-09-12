/**
 * Spec 0002 unit checks for toDisplayLines.
 * Run: node --experimental-strip-types scripts/test-quote.ts
 */
import assert from "node:assert/strict";
import { quoteTotalPaise, tagPriceQuote, toDisplayLines } from "../lib/api/pricing.ts";

const v6Registered = {
  billingEngine: "v6",
  lines: [
    { key: "service", label: "Security Service", amountPaise: 10000 },
    {
      key: "serviceGst",
      label: "GST on Security Service",
      ratePct: 18,
      amountPaise: 1800,
      split: { intraState: true, cgst: 900, sgst: 900, igst: 0 },
    },
    { key: "platformFee", label: "20fourr Platform Fee", amountPaise: 1500 },
    {
      key: "platformGst",
      label: "GST on Platform Fee",
      ratePct: 18,
      amountPaise: 270,
      split: { intraState: false, cgst: 0, sgst: 0, igst: 270 },
    },
  ],
  clientTotalPaise: 13570,
  providerNetPaise: 11738,
  tcsPaise: 50,
};

const tagged = tagPriceQuote(v6Registered);
assert.equal(tagged.engine, "v6");
const lines = toDisplayLines(tagged);
const sum = lines.reduce((n, l) => n + l.amountPaise, 0);
assert.equal(sum, 13570);
assert.equal(quoteTotalPaise(tagged), 13570);
assert.equal(lines.length, 4);
assert.ok(!JSON.stringify(lines).includes("11738"));
assert.ok(!JSON.stringify(lines).includes("tcs"));

const v1 = tagPriceQuote({
  baseAmount: 100000,
  platformFee: 5000,
  gstAmount: 900,
  totalAmount: 106166,
  totalHours: 8,
  numberOfDays: 1,
  isHourlyBilling: false,
  hourlyRate: null,
  dailyRate: 100000,
});
assert.equal(v1.engine, "v1");
const v1Lines = toDisplayLines(v1);
assert.ok(v1Lines.some((l) => l.label.includes("not itemized")));
assert.equal(
  v1Lines.reduce((n, l) => n + l.amountPaise, 0),
  106166,
);

console.log("toDisplayLines fixtures passed");

// --- spec 0005 worked example: the marketing page must match the engine ----
// platformFee = round(providerPreGst × 0.15); GST 18% on each component.
import { workedQuote } from "../lib/sample-quote.ts";

const q = workedQuote("guard", 8);
const service = q.lines.find((l) => l.id === "service")!.amountPaise;
const platform = q.lines.find((l) => l.id === "platform")!.amountPaise;

if (platform !== Math.round(service * 0.15)) {
  throw new Error(
    `worked example platform fee ${platform} != 15% of ${service} (${Math.round(service * 0.15)})`,
  );
}
const summed = q.lines.reduce((s, l) => s + l.amountPaise, 0);
if (summed !== q.totalPaise) {
  throw new Error(`worked example lines sum to ${summed}, total says ${q.totalPaise}`);
}
console.log(
  `worked example passed: service ${service} + fee ${platform} (15%) → total ${q.totalPaise}`,
);

// --- spec 0009: refund copy must match the engine's actual destination -------
import { refundNotice } from "../lib/cancellation-policy.ts";

const v6Settled = refundNotice("settled", "₹1,221.30", "v6", "2026-09-12T09:30:00.000Z");
const v1Settled = refundNotice("settled", "₹1,221.30", "v1");
const v6Pending = refundNotice("pending", "₹1,221.30", "v6");
const v6Manual = refundNotice("manual_review", "₹1,221.30", "v6");

if (!v6Settled?.text.includes("original payment method")) {
  throw new Error("v6 settled copy must name the payment method");
}
if (v6Settled.text.includes("wallet") || v6Settled.text.includes("SecureCoins")) {
  throw new Error("v6 refund copy must never mention the wallet");
}
if (!v1Settled?.text.includes("SecureCoins")) {
  throw new Error("v1 settled copy must name SecureCoins");
}
if (v1Settled.text.includes("original payment method")) {
  throw new Error("v1 refund copy must not promise the card");
}
if (v6Pending?.tone !== "pending" || v6Manual?.tone !== "attention") {
  throw new Error("refund tones are wrong");
}
// Never a platform-promised delivery date, and never an internal reference.
for (const n of [v6Settled, v1Settled, v6Pending, v6Manual]) {
  if (/\b\d+\s*(business|working)\s*days?\b/i.test(n!.text) && !n!.text.includes("may take")) {
    throw new Error(`refund copy promises a timeframe: ${n!.text}`);
  }
}
if (refundNotice(null, "₹0", "v6") !== null) {
  throw new Error("no refund state must render no notice");
}
console.log("refund copy passed: engine-correct destination, no promised date");
