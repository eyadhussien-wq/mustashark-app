import React from "react";
import { describe, expect, it } from "vitest";
import type { LawyerWorkQueueItem } from "@/lib/agenda/lawyerWorkQueue";
import { LawyerWorkQueue } from "../LawyerWorkQueue";

const item = (overrides: Partial<LawyerWorkQueueItem> = {}): LawyerWorkQueueItem => ({
  id: "c-1",
  serialNumber: "MST-001",
  clientName: "عميل",
  subject: "استشارة تجارية",
  date: "2026-08-28",
  time: "10:00",
  status: "pending",
  type: "video",
  ...overrides,
});

describe("LawyerWorkQueue", () => {
  it("renders an empty state without requiring a native testing library", () => {
    expect(LawyerWorkQueue({ items: [] })).toBeTruthy();
  });

  it("accepts read-only operational queue items", () => {
    const result = LawyerWorkQueue({ items: [item({ status: "accepted" })] });
    expect(result).toBeTruthy();
  });
});
