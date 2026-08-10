export const REPRESENTATION_MILESTONES = [
  {
    stage: "stage_1" as const,
    percentage: 30,
    title: "Contract Signing & Case Filing",
    titleAr: "دفعة البدء وتأسيس الدعوى",
  },
  {
    stage: "stage_2" as const,
    percentage: 40,
    title: "Court Hearings & Pleadings",
    titleAr: "مرحلة الجلسات والمذكرات",
  },
  {
    stage: "stage_3" as const,
    percentage: 30,
    title: "Final Judgment & Case Closure",
    titleAr: "مرحلة الحكم وختام القضية",
  },
] as const;

export type RepresentationMilestoneStage =
  (typeof REPRESENTATION_MILESTONES)[number]["stage"];

export type GeneratedMilestone = {
  stage: RepresentationMilestoneStage;
  percentage: number;
  amount: string;
  title: string;
  titleAr: string;
};

/**
 * Representation quotes always use the platform's 30/40/30 milestone model.
 * Amounts are rounded to two decimals and the final stage receives the
 * remainder so the milestone total always equals the quote total exactly.
 */
export function generateRepresentationMilestones(totalAmount: number): GeneratedMilestone[] {
  if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
    throw new Error("Representation quote amount must be greater than zero");
  }

  const first = Math.round(totalAmount * 0.30 * 100) / 100;
  const second = Math.round(totalAmount * 0.40 * 100) / 100;
  const third = Math.round((totalAmount - first - second) * 100) / 100;
  const amounts = [first, second, third];

  return REPRESENTATION_MILESTONES.map((milestone, index) => ({
    ...milestone,
    amount: amounts[index].toFixed(2),
  }));
}

export function getReviewDeadline(from: Date = new Date()): Date {
  return new Date(from.getTime() + 72 * 60 * 60 * 1000);
}

export function getInitialFundingAmount(
  totalAmount: number,
  fundingMode: "full" | "per_stage",
): string {
  if (fundingMode === "full") return totalAmount.toFixed(2);
  return generateRepresentationMilestones(totalAmount)[0].amount;
}
