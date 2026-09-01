import assert from "node:assert/strict";
import test from "node:test";
import {
  assertNeutralDocumentClientAccess,
  NeutralDocumentAuthorizationError,
  type NeutralDocumentClientAccessState,
} from "./neutralDocumentAuthorization";

const allowed: NeutralDocumentClientAccessState = {
  clientActive: true,
  relationshipActive: true,
  shareActive: true,
  documentStatus: "active",
  matterMatchesClientAndLawyer: true,
};

function denied(state: Partial<NeutralDocumentClientAccessState>, code: string) {
  assert.throws(
    () => assertNeutralDocumentClientAccess({ ...allowed, ...state }),
    (error: unknown) => error instanceof NeutralDocumentAuthorizationError && error.code === code,
  );
}

test("allows client access only when every authorization boundary passes", () => {
  assert.doesNotThrow(() => assertNeutralDocumentClientAccess(allowed));
});

test("denies inactive client", () => denied({ clientActive: false }, "CLIENT_NOT_ACTIVE"));
test("denies archived relationship", () => denied({ relationshipActive: false }, "RELATIONSHIP_NOT_ACTIVE"));
test("denies missing or revoked share", () => denied({ shareActive: false }, "SHARE_NOT_ACTIVE"));
test("denies archived document", () => denied({ documentStatus: "archived" }, "DOCUMENT_NOT_ACCESSIBLE"));
test("denies matter scope mismatch", () => denied({ matterMatchesClientAndLawyer: false }, "DOCUMENT_NOT_ACCESSIBLE"));

test("denies tampered cross-lawyer/matter scope even when share is active", () =>
  denied({ matterMatchesClientAndLawyer: false }, "DOCUMENT_NOT_ACCESSIBLE"));

test("does not permit a partial authorization signal to bypass another boundary", () => {
  denied({ relationshipActive: false, shareActive: true }, "RELATIONSHIP_NOT_ACTIVE");
  denied({ relationshipActive: true, shareActive: false }, "SHARE_NOT_ACTIVE");
});
