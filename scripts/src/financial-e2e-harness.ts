import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import {
  usersTable,
  representationQuotesTable,
  representationMilestonesTable,
  escrowAccountsTable,
  commissionTiersTable,
  lawyerWalletsTable,
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  paymentProofsTable,
  financialLedgerTable,
  escrowTransactionsTable,
} from "@workspace/db/schema";
import { fundMilestone } from "../../artifacts/api-server/src/services/fundMilestone";
import { releaseMilestone } from "../../artifacts/api-server/src/services/releaseMilestone";
import { refundMilestone } from "../../artifacts/api-server/src/services/refundMilestone";
import type { FundMilestoneResult } from "../../artifacts/api-server/src/services/fundMilestone";
import type { ReleaseMilestoneResult } from "../../artifacts/api-server/src/services/releaseMilestone";
import type { RefundMilestoneResult } from "../../artifacts/api-server/src/services/refundMilestone";

type ServiceRequest = Parameters<typeof fundMilestone>[0];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function assertOkBody(result: unknown, operation: string): asserts result is { body: { ok: true } } {
  assert(isRecord(result), `${operation} returned a non-object result`);
  const body = result.body;
  assert(isRecord(body) && body.ok === true, `${operation} failed: ${JSON.stringify(result)}`);
}

function assertReplay(result: unknown, operation: string): asserts result is { replay: true; body: unknown } {
  assert(isRecord(result) && result.replay === true, `${operation} replay failed: ${JSON.stringify(result)}`);
}

function requestWithIdempotency(key: string, body: unknown = {}): ServiceRequest {
  const headers = new Map<string, string>([["idempotency-key", key]]);
  return {
    method: "POST",
    path: "/synthetic/financial-e2e",
    params: {},
    query: {},
    body,
    route: { path: "/synthetic/financial-e2e" },
    get(name: string) { return headers.get(name.toLowerCase()); },
    header(name: string) { return headers.get(name.toLowerCase()); },
  } as ServiceRequest;
}

function expectSuccessfulFund(result: FundMilestoneResult, operation: string) { assertOkBody(result, operation); }
function expectSuccessfulRelease(result: ReleaseMilestoneResult, operation: string) { assertOkBody(result, operation); }
function expectSuccessfulRefund(result: RefundMilestoneResult, operation: string) { assertOkBody(result, operation); }

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required");
  const runId = crypto.randomUUID();
  const clientId = crypto.randomUUID();
  const lawyerId = crypto.randomUUID();
  const quoteId = crypto.randomUUID();
  const milestoneId = crypto.randomUUID();
  const escrowId = crypto.randomUUID();
  const walletId = crypto.randomUUID();
  const proofId = crypto.randomUUID();
  const releaseRequestId = crypto.randomUUID();
  const paymentProofId = crypto.randomUUID();
  const amount = "300.00";
  const commission = "45.00";
  const net = "255.00";

  try {
    await db.insert(usersTable).values([
      { id: clientId, name: "Synthetic Client", email: `financial-client-${runId}@test.invalid`, role: "client", country: "qatar", accountStatus: "active" },
      { id: lawyerId, name: "Synthetic Lawyer", email: `financial-lawyer-${runId}@test.invalid`, role: "lawyer", country: "qatar", accountStatus: "active" },
    ]);
    await db.insert(representationQuotesTable).values({ id: quoteId, clientId, lawyerId, title: "Synthetic legal consultation", description: "Financial E2E only", totalAmount: amount, currency: "QAR", status: "accepted", fundingMode: "full", acceptedAt: new Date() });
    await db.insert(representationMilestonesTable).values({ id: milestoneId, quoteId, stage: "stage_1", percentage: "100.00", amount, title: "Synthetic service", status: "awaiting_deposit" });
    await db.insert(escrowAccountsTable).values({ id: escrowId, quoteId, currency: "QAR" });
    await db.insert(lawyerWalletsTable).values({ id: walletId, lawyerId, currency: "QAR" });
    await db.insert(commissionTiersTable).values({ id: crypto.randomUUID(), country: "qatar", currency: "QAR", minQuoteAmount: "0", maxQuoteAmount: null, commissionRate: "15.00", active: true, effectiveFrom: new Date(Date.now() - 60_000), effectiveTo: null });
    await db.insert(milestoneProofsTable).values({ id: proofId, milestoneId, lawyerId, documentKey: `synthetic/${runId}`, proofType: "e2e", status: "approved" });
    await db.insert(milestoneReleaseRequestsTable).values({ id: releaseRequestId, milestoneId, proofId, clientId, lawyerId, status: "approved", reviewDeadlineAt: new Date(Date.now() + 3_600_000) });
    await db.insert(paymentProofsTable).values({ id: paymentProofId, bookingId: crypto.randomUUID(), clientId, amount, currency: "QAR", channel: "external", method: "other", proofUri: "synthetic://myfatoorah-test", reference: `MF-TEST-${runId}`, status: "confirmed" }).catch(() => console.log("PROVIDER_BOUNDARY_NOTE=payment_proofs booking FK unavailable; provider confirmation remains synthetic"));

    console.log(`FINANCIAL_E2E_RUN=${runId}`);
    console.log("PROVIDER=MYFATOORAH_TEST_SYNTHETIC");
    console.log(`AMOUNT=${amount} QAR`);

    const fund = await fundMilestone(requestWithIdempotency(`fund-${runId}`, { provider: "myfatoorah-test", reference: `MF-TEST-${runId}` }), milestoneId, clientId);
    expectSuccessfulFund(fund, "fund");
    const funded = (await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, escrowId)))[0];
    assert(funded?.depositedAmount === amount, `escrow deposit mismatch: ${funded?.depositedAmount}`);
    console.log(`LEDGER_AFTER_PAYMENT=escrow_deposit ${amount} QAR`);

    const releaseA = await releaseMilestone(requestWithIdempotency(`release-${runId}`), releaseRequestId, clientId);
    expectSuccessfulRelease(releaseA, "release");
    const releaseB = await releaseMilestone(requestWithIdempotency(`release-${runId}`), releaseRequestId, clientId);
    assertReplay(releaseB, "release");

    const escrow = (await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, escrowId)))[0];
    const wallet = (await db.select().from(lawyerWalletsTable).where(eq(lawyerWalletsTable.id, walletId)))[0];
    const ledger = await db.select().from(financialLedgerTable).where(eq(financialLedgerTable.correlationId, releaseRequestId));
    const escrowTx = await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.milestoneId, milestoneId));

    assert(escrow?.depositedAmount === amount, `deposit amount mismatch: ${escrow?.depositedAmount}`);
    assert(escrow?.releasedAmount === amount, `released amount mismatch: ${escrow?.releasedAmount}`);
    assert(escrow?.refundedAmount === "0.00", `unexpected refund: ${escrow?.refundedAmount}`);
    assert(wallet?.availableBalance === net, `lawyer wallet mismatch: expected ${net}, got ${wallet?.availableBalance}`);
    assert(escrowTx.length === 3, `expected 3 escrow transactions, got ${escrowTx.length}`);
    assert(ledger.length === 3, `expected 3 release/commission/lawyer-net ledger entries, got ${ledger.length}`);

    const debit = ledger.filter((x) => x.direction === "debit").reduce((sum, x) => sum + Number(x.amount), 0);
    const credit = ledger.filter((x) => x.direction === "credit").reduce((sum, x) => sum + Number(x.amount), 0);
    const lawyerNetLedger = ledger.filter((x) => {
      if (x.direction !== "credit" || !x.reference) return false;
      return x.reference.startsWith("lawyer-net:");
    });
    const commissionLedger = ledger.filter((x) => {
      if (x.direction !== "credit" || !x.reference) return false;
      return x.reference.startsWith("commission:");
    });
    assert(lawyerNetLedger.length === 1, `expected exactly 1 lawyer-net ledger entry, got ${lawyerNetLedger.length}`);
    assert(commissionLedger.length === 1, `expected exactly 1 commission ledger entry, got ${commissionLedger.length}`);
    assert(Number(lawyerNetLedger[0]?.amount) === Number(net), `lawyer-net ledger mismatch: expected ${net}, got ${lawyerNetLedger[0]?.amount}`);
    assert(Number(commissionLedger[0]?.amount) === Number(commission), `commission ledger mismatch: expected ${commission}, got ${commissionLedger[0]?.amount}`);
    assert(Math.abs(debit - Number(amount)) < 0.005, `LEDGER_DEBIT_MISMATCH debit=${debit.toFixed(2)} expected=${Number(amount).toFixed(2)}`);
    assert(Math.abs(credit - (Number(commission) + Number(net))) < 0.005, `LEDGER_CREDIT_MISMATCH credit=${credit.toFixed(2)} expected=${Number(amount).toFixed(2)}`);
    assert(Math.abs(debit - credit) < 0.005, `LEDGER_UNBALANCED debit=${debit.toFixed(2)} credit=${credit.toFixed(2)}`);
    console.log(`LEDGER_RELEASE_DEBIT=${debit.toFixed(2)} QAR`);
    console.log(`LEDGER_RELEASE_CREDIT=${credit.toFixed(2)} QAR`);
    console.log(`LAWYER_NET_SETTLEMENT=${wallet?.availableBalance} QAR`);
    console.log(`PLATFORM_COMMISSION=${commission} QAR`);
    console.log(`RECONCILIATION_PROVIDER=${amount} QAR`);
    console.log(`RECONCILIATION_ESCROW_RELEASED=${escrow?.releasedAmount} QAR`);
    console.log(`RECONCILIATION_LAWYER_NET=${wallet?.availableBalance} QAR`);
    console.log("REPLAY_ADDITIONAL_EFFECT=0 QAR");

    const refundQuoteId = crypto.randomUUID();
    const refundMilestoneId = crypto.randomUUID();
    const refundEscrowId = crypto.randomUUID();
    await db.insert(representationQuotesTable).values({ id: refundQuoteId, clientId, lawyerId, title: "Synthetic refund", totalAmount: "100.00", currency: "QAR", status: "accepted", fundingMode: "full", acceptedAt: new Date() });
    await db.insert(representationMilestonesTable).values({ id: refundMilestoneId, quoteId: refundQuoteId, stage: "stage_1", percentage: "100.00", amount: "100.00", title: "Synthetic refund service", status: "awaiting_deposit" });
    await db.insert(escrowAccountsTable).values({ id: refundEscrowId, quoteId: refundQuoteId, currency: "QAR" });
    const refundFund = await fundMilestone(requestWithIdempotency(`refund-fund-${runId}`), refundMilestoneId, clientId);
    expectSuccessfulFund(refundFund, "refund setup");
    const refund = await refundMilestone(requestWithIdempotency(`refund-${runId}`), refundMilestoneId, clientId);
    expectSuccessfulRefund(refund, "refund");
    const refundReplay = await refundMilestone(requestWithIdempotency(`refund-${runId}`), refundMilestoneId, clientId);
    assertReplay(refundReplay, "refund");
    const refundEscrow = (await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, refundEscrowId)))[0];
    assert(refundEscrow?.refundedAmount === "100.00", `refund amount mismatch: ${refundEscrow?.refundedAmount}`);
    console.log("REFUND_IDEMPOTENCY=PASS");
    console.log("FINANCIAL_E2E_RESULT=PASS");
  } finally {
    await pool.end();
  }
}

await main();
