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
    console.log(`REPLAY_ADDITIONAL_EFFECT=0 QAR`);

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
