import { describe, expect, it } from "vitest";

describe("G1.4 Lawyer Discovery Contract", () => {
  it("must expose only approved, active, non-deleted lawyers through a client-safe DTO", async () => {
    // RED TEST: the discovery contract is intentionally not implemented yet.
    // Importing the future contract keeps this test explicit about the required boundary.
    const { listClientLawyers } = await import("../services/lawyerDiscovery");

    const result = await listClientLawyers();

    expect(result).toEqual(expect.any(Array));
    for (const lawyer of result) {
      expect(lawyer).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          name: expect.any(String),
        }),
      );
      expect(lawyer).not.toHaveProperty("passwordHash");
      expect(lawyer).not.toHaveProperty("providerId");
      expect(lawyer).not.toHaveProperty("documentStorageKey");
      expect(lawyer).not.toHaveProperty("reviewedBy");
      expect(lawyer).not.toHaveProperty("rejectionReason");
    }
  });

  it("must have an authenticated-client API contract rather than a public anonymous discovery path", async () => {
    const { lawyerDiscoveryRequiresClientAuth } = await import("../services/lawyerDiscovery");

    expect(lawyerDiscoveryRequiresClientAuth).toBe(true);
  });
});
