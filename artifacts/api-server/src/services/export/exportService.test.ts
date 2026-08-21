import assert from "node:assert/strict";
import test from "node:test";
import { authorizeExport } from "./exportPolicy";
import { redactRecords } from "./redactionPolicy";
import { prepareExport } from "./exportService";
import { renderPrintableHtml } from "./printRenderer";

test("rejects export without trusted ownership or membership", () => {
  assert.throws(
    () =>
      authorizeExport(
        { resource: "case", resourceId: "case-1", format: "print" },
        {
          actor: { userId: "lawyer-1", role: "lawyer" },
          resourceOwnerVerified: false,
          membershipVerified: false,
        },
      ),
    { message: "FORBIDDEN" },
  );
});

test("prevents clients from requesting full-scope exports", () => {
  assert.throws(
    () =>
      authorizeExport(
        { resource: "client_file", resourceId: "file-1", format: "print", scope: "full" },
        {
          actor: { userId: "client-1", role: "client" },
          resourceOwnerVerified: true,
          membershipVerified: true,
        },
      ),
    { message: "EXPORT_FULL_SCOPE_FORBIDDEN" },
  );
});

test("redacts sensitive and private records for clients", () => {
  const result = redactRecords(
    [
      { label: "Case number", value: "2026/1", clientVisible: true },
      { label: "Internal note", value: "private", sensitive: true },
      { label: "Lawyer-only field", value: "secret", clientVisible: false },
    ],
    "client",
    "summary",
  );

  assert.deepEqual(result.map((record) => record.label), ["Case number"]);
});

test("prepares a P0 export without persistence", () => {
  const result = prepareExport(
    { resource: "hearing", resourceId: "hearing-1", format: "print" },
    {
      actor: { userId: "lawyer-1", role: "lawyer" },
      resourceOwnerVerified: true,
      membershipVerified: true,
    },
    {
      resource: "hearing",
      resourceId: "hearing-1",
      title: "Hearing 2026/1",
      records: [
        { label: "Judge", value: "Judge Example" },
        { label: "Internal note", value: "hidden in summary", sensitive: true },
      ],
    },
  );

  assert.equal(result.persisted, false);
  assert.equal(result.contentType, "text/html; charset=utf-8");
  assert.match(result.body, /Hearing 2026\/1/);
  assert.match(result.body, /Judge Example/);
});

test("renderer escapes untrusted values before producing printable HTML", () => {
  const html = renderPrintableHtml("<Case>", [
    { label: "Note", value: "<script>alert('x')</script>" },
  ]);

  assert.match(html, /&lt;Case&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>alert/);
});

test("rejects snapshot/resource mismatches", () => {
  assert.throws(
    () =>
      prepareExport(
        { resource: "case", resourceId: "case-1", format: "print" },
        {
          actor: { userId: "lawyer-1", role: "lawyer" },
          resourceOwnerVerified: true,
          membershipVerified: true,
        },
        {
          resource: "decision",
          resourceId: "decision-1",
          title: "Decision",
          records: [],
        },
      ),
    { message: "EXPORT_SNAPSHOT_MISMATCH" },
  );
});
