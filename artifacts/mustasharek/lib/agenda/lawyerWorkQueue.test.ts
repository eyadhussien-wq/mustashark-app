import { describe, expect, it } from "vitest";
import type { Consultation } from "@/contexts/DataContext";
import { buildLawyerWorkQueue } from "./lawyerWorkQueue";

const consultation = (overrides: Partial<Consultation>): Consultation => ({
  id: "c-1",
  serialNumber: "MST-001",
  clientId: "client-1",
  clientName: "عميل",
  lawyerId: "lawyer-1",
  lawyerName: "محامٍ",
  lawyerSpecialization: "قانون تجاري",
  subject: "استشارة",
  description: "وصف",
  date: "2026-08-28",
  time: "10:00",
  status: "pending",
  createdAt: "2026-08-27T10:00:00Z",
  type: "video",
  price: 500,
  ...overrides,
});

describe("buildLawyerWorkQueue", () => {
  it("keeps only the lawyer's actionable pending and accepted consultations", () => {
    const result = buildLawyerWorkQueue(
      [
        consultation({ id: "other", lawyerId: "lawyer-2" }),
        consultation({ id: "done", status: "completed" }),
        consultation({ id: "pending", status: "pending" }),
        consultation({ id: "accepted", status: "accepted", date: "2026-08-27", time: "09:00" }),
      ],
      "lawyer-1",
    );

    expect(result.map((item) => item.id)).toEqual(["accepted", "pending"]);
    expect(result[0]).not.toHaveProperty("price");
    expect(result[0]).not.toHaveProperty("paymentStatus");
  });

  it("does not mutate the input array", () => {
    const input = [consultation({ id: "late", time: "15:00" }), consultation({ id: "early", time: "09:00" })];
    const originalOrder = input.map((item) => item.id);

    buildLawyerWorkQueue(input, "lawyer-1");

    expect(input.map((item) => item.id)).toEqual(originalOrder);
  });
});
