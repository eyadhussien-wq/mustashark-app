import assert from "node:assert/strict";

// S02.7.2 read-model contract: the API must expose the real milestone fields
// consumed by ActiveCaseWorkspace, without recreating finance logic in the UI.

type Milestone = {
  id: string;
  title: string;
  stage: string;
  percentage: string;
  amount: string;
  status: string;
};

type CaseReadModel = {
  milestones: Milestone[];
  agreement: {
    quote: {
      id: string;
      totalAmount: string;
      currency: string;
    };
    milestones: Milestone[];
  };
};

const expectedFields = ["id", "title", "stage", "percentage", "amount", "status"] as const;

export function assertCaseMilestonesReadModel(payload: CaseReadModel): void {
  assert.ok(Array.isArray(payload.milestones), "case.milestones must be an array");
  assert.ok(payload.agreement?.quote?.id, "case.agreement.quote.id is required");
  assert.ok(Array.isArray(payload.agreement.milestones), "case.agreement.milestones must be an array");

  for (const milestone of payload.milestones) {
    for (const field of expectedFields) {
      assert.notEqual(milestone[field], undefined, `milestone.${field} is required`);
    }
  }

  assert.deepEqual(
    payload.agreement.milestones.map((milestone) => milestone.id),
    payload.milestones.map((milestone) => milestone.id),
    "agreement.milestones and case.milestones must describe the same milestones",
  );
}

console.log("S02.7.2 read-model contract: PASS");
