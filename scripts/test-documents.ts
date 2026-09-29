/**
 * Spec 0003 C unit checks for the document history helpers.
 * Run: node --experimental-strip-types scripts/test-documents.ts
 */
import assert from "node:assert/strict";
import {
  EMPTY_FILTERS,
  documentHref,
  documentStatus,
  exportPath,
  filterError,
  filtersToQuery,
  financialYears,
} from "../lib/billing-documents.ts";

// April starts the year: 29 Sept 2026 is FY 2026-27; 10 Feb 2027 is still FY 2026-27.
assert.deepEqual(financialYears(new Date("2026-09-29T12:00:00"), 3), ["2026-27", "2025-26", "2024-25"]);
assert.deepEqual(financialYears(new Date("2027-02-10T12:00:00"), 1), ["2026-27"]);
assert.deepEqual(financialYears(new Date("2099-04-01T12:00:00"), 1), ["2099-00"]);

assert.deepEqual(filtersToQuery(EMPTY_FILTERS), {});
assert.deepEqual(filtersToQuery({ ...EMPTY_FILTERS, financialYear: "2026-27", source: "v6_document" }), {
  financialYear: "2026-27",
  source: "v6_document",
});
assert.equal(filterError({ ...EMPTY_FILTERS, from: "2026-10-01", to: "2026-09-01" }), "The start date is after the end date.");
assert.equal(filterError({ ...EMPTY_FILTERS, from: "2026-09-01", to: "2026-10-01" }), null);

assert.equal(documentHref({ id: "d1", source: "v6_document", bookingId: "b1" }), "/dashboard/profile/invoices/d1?source=document");
assert.equal(documentHref({ id: "i1", source: "v1_invoice", bookingId: null }), "/dashboard/profile/invoices/i1");
assert.equal(documentHref({ id: "pi_b1", source: "provider_upload", bookingId: "b1" }), "/dashboard/bookings/b1");

// Rule 4: a reversed v6 document is still valid; a cancelled one without the flag is void.
assert.equal(documentStatus({ status: "cancelled", reversedByCreditNote: true, isCreditNote: false }).label, "Reversed");
assert.equal(documentStatus({ status: "cancelled", reversedByCreditNote: false, isCreditNote: false }).label, "Void");
assert.equal(documentStatus({ status: "issued", reversedByCreditNote: false, isCreditNote: true }).label, "Credit note");

assert.equal(exportPath("zip", { ...EMPTY_FILTERS, financialYear: "2026-27" }), "/api/bff/client/billing-documents/export.zip?financialYear=2026-27");
assert.equal(exportPath("csv", EMPTY_FILTERS), "/api/bff/client/billing-documents/export.csv");

console.log("document history helpers passed");
