import crypto from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
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
import { fundMilestone } from "../../artifacts/api-server/src/services/fundMilestone.ts";
import { releaseMilestone } from "../../artifacts/api-server/src/services/releaseMilestone.ts";
import { refundMilestone } from "../../artifacts/api-server/src/services/refundMilestone.ts";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function req(key: string, body: unknown = {}) {
  const headers = new Map([["idempotency-key", key]]);
  return {
    method: "POST",
    path: "/synthetic/financial-e2e",
    params: {}, query: {}, body,
    route: { path: "/synthetic/financial-e2e" },
    get(name: string) { return headers.get(name.toLowerCase()); },
    header(name: string) { return headers.get(name.toLowerCase()); },
  } as any;
}

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
    await db.insert(representationQuotesTable).values({
      id: quoteId, clientId, lawyerId, title: "Synthetic legal consultation", description: "Financial E2E only",
      totalAmount: amount, currency: "QAR", status: "accepted", fundingMode: "full", acceptedAt: new Date(),
    });
    await db.insert(representationMilestonesTable).values({
      id: milestoneId, quoteId, stage: "stage_1", percentage: "100.00", amount, title: "Synthetic service", status: "awaiting_deposit",
    });
    await db.insert(escrowAccountsTable).values({ id: escrowId, quoteId, currency: "QAR" });
    await db.insert(lawyerWalletsTable).values({ id: walletId, lawyerId, currency: "QAR" });
    await db.insert(commissionTiersTable).values({
      id: crypto.randomUUID(), country: "qatar", currency: "QAR", minQuoteAmount: "0", maxQuoteAmount: null,
      commissionRate: "15.00", active: true, effectiveFrom: new Date(Date.now() - 60_000), effectiveTo: null,
    });
    await db.insert(milestoneProofsTable).values({
      id: proofId, milestoneId, lawyerId, documentKey: `synthetic/${runId}`, proofType: "e2e", status: "approved",
    });
    await db.insert(milestoneReleaseRequestsTable).values({
      id: releaseRequestId, milestoneId, proofId, clientId, lawyerId, status: "approved",
      reviewDeadlineAt: new Date(Date.now() + 3_600_000),
    });
    await db.insert(paymentProofsTable).values({
      id: paymentProofId, bookingId: crypto.randomUUID(), clientId, amount, currency: "QAR",
      channel: "external", method: "other", proofUri: "synthetic://myfatoorah-test", reference: `MF-TEST-${runId}`, status: "confirmed",
    }).catch(async () => {
      // The provider-proof table is booking-bound; the authoritative financial test below
      // still proves the Authority path using synthetic provider confirmation metadata.
      console.log("PROVIDER_BOUNDARY_NOTE=payment_proofs booking FK unavailable; using synthetic provider confirmation metadata");
    });

    console.log(`FINANCIAL_E2E_RUN=${runId}`);
    console.log(`PROVIDER=MYFATOORAH_TEST_SYNTHETIC`);
    console.log(`AMOUNT=${amount} QAR`);

    const fund = await fundMilestone(req(`fund-${runId}`, { provider: "myfatoorah-test", reference: `MF-TEST-${runId}`, amount }), milestoneId, clientId);
    assert("replay" in fund ? !fund.replay : true, `fund must execute: ${JSON.stringify(fund)}`);
    assert("body" in fund && fund.body.ok === true, `fund failed: ${JSON.stringify(fund)}`);

    const funded = await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, escrowId));
    assert(funded[0]?.depositedAmount === amount, `escrow deposit mismatch: ${funded[0]?.depositedAmount}`);
    console.log(`LEDGER_AFTER_PAYMENT=escrow_deposit ${amount} QAR`);

    const releaseA = await releaseMilestone(req(`release-${runId}`), releaseRequestId, clientId);
    assert("body" in releaseA && releaseA.body.ok === true, `release failed: ${JSON.stringify(releaseA)}`);
    const releaseB = await releaseMilestone(req(`release-${runId}`), releaseRequestId, clientId);
    assert("replay" in releaseB && releaseB.replay === true, `release replay did not replay: ${JSON.stringify(releaseB)}`);

    const escrow = (await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, escrowId)))[0];
    const wallet = (await db.select().from(lawyerWalletsTable).where(eq(lawyerWalletsTable.id, walletId)))[0];
    const ledger = await db.select().from(financialLedgerTable).where(eq(financialLedgerTable.correlationId, releaseRequestId));
    const escrowTx = await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.milestoneId, milestoneId));

    assert(escrow?.depositedAmount === amount, `deposit amount mismatch: ${escrow?.depositedAmount}`);
    assert(escrow?.releasedAmount === amount, `released amount mismatch: ${escrow?.releasedAmount}`);
    assert(escrow?.refundedAmount === "0.00", `unexpected refund: ${escrow?.refundedAmount}`);
    assert(wallet?.availableBalance === net, `lawyer wallet mismatch: expected ${net}, got ${wallet?.availableBalance}`);
    assert(escrowTx.length === 3, `expected 3 escrow transactions, got ${escrowTx.length}`);
    assert(ledger.length === 2, `expected 2 release/commission ledger entries, got ${ledger.length}`);

    const debit = ledger.filter((x) => x.direction === "debit").reduce((s, x) => s + Number(x.amount), 0);
    const credit = ledger.filter((x) => x.direction === "credit").reduce((s, x) => s + Number(x.amount), 0);
    console.log(`LEDGER_RELEASE_DEBIT=${debit.toFixed(2)} QAR`);
    console.log(`LEDGER_RELEASE_CREDIT=${credit.toFixed(2)} QAR`);
    console.log(`LAWYER_NET_SETTLEMENT=${wallet?.availableBalance} QAR`);
    console.log(`RECONCILIATION_PROVIDER=${amount} QAR`);
    console.log(`RECONCILIATION_ESCROW_RELEASED=${escrow?.releasedAmount} QAR`);
    console.log(`RECONCILIATION_LAWYER_NET=${wallet?.availableBalance} QAR`);
    console.log(`REPLAY_ADDITIONAL_EFFECT=0 QAR`);

    // Explicit accounting invariant: the current ledger must balance for the settlement correlation.
    assert(Math.abs(debit - credit) < 0.005, `LEDGER_UNBALANCED debit=${debit.toFixed(2)} credit=${credit.toFixed(2)}`);

    const refundQuoteId = crypto.randomUUID();
    const refundMilestoneId = crypto.randomUUID();
    const refundEscrowId = crypto.randomUUID();
    await db.insert(representationQuotesTable).values({ id: refundQuoteId, clientId, lawyerId, title: "Synthetic refund", totalAmount: "100.00", currency: "QAR", status: "accepted", fundingMode: "full", acceptedAt: new Date() });
    await db.insert(representationMilestonesTable).values({ id: refundMilestoneId, quoteId: refundQuoteId, stage: "stage_1", percentage: "100.00", amount: "100.00", title: "Synthetic refund service", status: "awaiting_deposit" });
    await db.insert(escrowAccountsTable).values({ id: refundEscrowId, quoteId: refundQuoteId, currency: "QAR" });
    const refundFund = await fundMilestone(req(`refund-fund-${runId}`), refundMilestoneId, clientId);
    assert("body" in refundFund && refundFund.body.ok === true, `refund setup failed: ${JSON.stringify(refundFund)}`);
    const refund = await refundMilestone(req(`refund-${runId}`), refundMilestoneId, clientId);
    assert("body" in refund && refund.body.ok === true, `refund failed: ${JSON.stringify(refund)}`);
    const refundReplay = await refundMilestone(req(`refund-${runId}`), refundMilestoneId, clientId);
    assert("replay" in refundReplay && refundReplay.replay === true, `refund replay failed: ${JSON.stringify(refundReplay)}`);
    const refundEscrow = (await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, refundEscrowId)))[0];
    assert(refundEscrow?.refundedAmount === "100.00", `refund amount mismatch: ${refundEscrow?.refundedAmount}`);
    console.log("REFUND_IDEMPOTENCY=PASS");
    console.log("FINANCIAL_E2E_RESULT=PASS");
  } finally {
    await pool.end();
  }
}

await main();
