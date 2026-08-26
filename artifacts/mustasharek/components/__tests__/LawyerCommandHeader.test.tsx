import React from "react";
import { render } from "@testing-library/react-native";
import { LawyerCommandHeader } from "../LawyerCommandHeader";
import type { LawyerIdentityReadDto } from "@/hooks/useLawyerIdentity";

const identity: LawyerIdentityReadDto = {
  id: "lawyer-1",
  name: "أحمد المحامي",
  email: "lawyer@example.com",
  phone: null,
  country: "qatar",
  role: "lawyer",
  accountStatus: "active",
  specialization: "القانون التجاري",
  litigationTier: "standard",
  bio: null,
  hourlyRate: null,
  rating: null,
  reviewsCount: 0,
  verification: {
    status: "approved",
    licenseNumber: null,
    barAssociation: null,
    reviewedAt: null,
    rejectionReason: null,
  },
};

describe("LawyerCommandHeader", () => {
  it("renders canonical identity and status", () => {
    const { getByText } = render(<LawyerCommandHeader identity={identity} />);
    expect(getByText("أحمد المحامي")).toBeTruthy();
    expect(getByText("القانون التجاري")).toBeTruthy();
    expect(getByText("التحقق: موثّق")).toBeTruthy();
    expect(getByText("الحساب نشط")).toBeTruthy();
  });
});
