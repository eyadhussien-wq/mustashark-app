import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { resolve } from "node:path";

const root = resolve(process.cwd());

async function source(relativePath: string) {
  return readFile(resolve(root, relativePath), "utf8");
}

function requirePatterns(name: string, text: string, patterns: RegExp[]) {
  for (const pattern of patterns) {
    assert.match(text, pattern, `${name}: missing authorization boundary ${pattern}`);
  }
}

test("E01-A negative authorization contract: lawyer client/consultation collections are actor-scoped", async () => {
  const clients = await source("src/controllers/lawyerClients.ts");
  const consultations = await source("src/controllers/lawyerConsultations.ts");
  requirePatterns("lawyerClients", clients, [/eq\(bookingsTable\.lawyerId, lawyerId\)/]);
  requirePatterns("lawyerConsultations", consultations, [/eq\(bookingsTable\.lawyerId, lawyerId\)/]);
});

test("E01-A negative authorization contract: consultation documentation is participant-scoped", async () => {
  const text = await source("src/controllers/consultationDocumentation.ts");
  requirePatterns("consultationDocumentation", text, [
    /booking\.clientId === user\.id/,
    /booking\.lawyerId === user\.id/,
  ]);
});

test("E01-A negative authorization contract: quote requests and proposals cannot cross actors or parent requests", async () => {
  const requests = await source("src/controllers/representationQuoteRequests.ts");
  const proposals = await source("src/controllers/lawyerProposals.ts");
  requirePatterns("representationQuoteRequests", requests, [/clientId,/]);
  requirePatterns("lawyerProposals", proposals, [
    /eq\(lawyerProposalsTable\.id, parsed\.data\.proposalId\)/,
    /eq\(lawyerProposalsTable\.requestId, parsed\.data\.requestId\)/,
    /row\.proposal\.lawyerId !== userId/,
    /row\.clientId !== userId/,
  ]);
});

test("E01-A negative authorization contract: cases and hearings bind child objects to the parent case", async () => {
  const cases = await source("src/services/cases.ts");
  const hearings = await source("src/services/caseHearings.ts");
  requirePatterns("cases", cases, [
    /caseRecord\.clientId !== actorUserId/,
    /caseRecord\.lawyerId !== actorUserId/,
    /eq\(caseMembershipsTable\.caseId, caseId\)/,
    /eq\(caseMembershipsTable\.userId, actorUserId\)/,
  ]);
  requirePatterns("caseHearings", hearings, [
    /eq\(caseHearingsTable\.id, input\.hearingId\)/,
    /eq\(caseHearingsTable\.caseId, input\.caseId\)/,
    /caseRecord\.lawyerId === actorUserId/,
    /eq\(caseMembershipsTable\.caseId, caseRecord\.id\)/,
  ]);
});

test("E01-A negative authorization contract: milestone mutations are bound to quote ownership and actor role", async () => {
  const fund = await source("src/services/fundMilestone.ts");
  const allocate = await source("src/services/allocateMilestone.ts");
  const proof = await source("src/services/createMilestoneProof.ts");
  const releaseRequest = await source("src/services/createMilestoneReleaseRequest.ts");
  const dispute = await source("src/services/disputeMilestoneRelease.ts");
  const release = await source("src/services/releaseMilestone.ts");
  const refund = await source("src/services/refundMilestone.ts");

  requirePatterns("fundMilestone", fund, [/row\.quote\.clientId !== clientId/]);
  requirePatterns("allocateMilestone", allocate, [/row\.quote\.clientId !== clientId/]);
  requirePatterns("createMilestoneProof", proof, [/row\.quote\.lawyerId !== lawyerId/]);
  requirePatterns("createMilestoneReleaseRequest", releaseRequest, [
    /row\.quote\.clientId !== clientId/,
    /row\.proof\.milestoneId !== row\.milestone\.id/,
    /row\.proof\.lawyerId !== row\.quote\.lawyerId/,
  ]);
  requirePatterns("disputeMilestoneRelease", dispute, [/row\.request\.clientId !== clientId/, /row\.quote\.clientId !== clientId/]);
  requirePatterns("releaseMilestone", release, [/row\.request\.clientId !== clientId/, /row\.quote\.clientId !== clientId/]);
  requirePatterns("refundMilestone", refund, [/row\.quote\.clientId !== clientId/]);
});

test("E01-A negative authorization contract: payment proof object binding includes bookingId", async () => {
  const text = await source("src/controllers/paymentProofs.ts");
  requirePatterns("paymentProofs", text, [
    /eq\(paymentProofsTable\.id, proofId\)/,
    /eq\(paymentProofsTable\.bookingId, bookingId\)/,
    /booking\.clientId !== authUser\.id/,
    /booking\.lawyerId !== authUser\.id/,
  ]);
});

test("E01-A negative authorization contract: document handover reads and delivery are participant-scoped", async () => {
  const text = await source("src/controllers/documentHandovers.ts");
  requirePatterns("documentHandovers", text, [
    /row\.documentOwnerId !== userId/,
    /row\.handover\.requestedBy !== userId/,
    /row\.handover\.recipientId !== userId/,
    /row\.handover\.recipientId !== authUser\.id/,
  ]);
});
