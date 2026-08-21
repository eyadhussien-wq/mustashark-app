export type QuickAction = "create_hearing" | "create_decision";

export type QuickActionContext = {
  userId: string;
  role: "client" | "lawyer" | "admin";
  caseId: string;
  membershipVerified: boolean;
  ownershipVerified: boolean;
};

export type QuickActionResult = {
  action: QuickAction;
  caseId: string;
  persisted: false;
  requiresDomainHandler: true;
};

export const executeQuickAction = (
  action: QuickAction,
  context: QuickActionContext,
): QuickActionResult => {
  if (!context.userId) throw new Error("UNAUTHORIZED");
  if (!context.caseId) throw new Error("CASE_ID_REQUIRED");
  if (!context.membershipVerified || !context.ownershipVerified) {
    throw new Error("FORBIDDEN");
  }

  if (action !== "create_hearing" && action !== "create_decision") {
    throw new Error("UNSUPPORTED_QUICK_ACTION");
  }

  // Z01-J exposes a safe command contract only. Actual domain mutations stay
  // in the existing hearing/decision services and are not invoked here.
  return {
    action,
    caseId: context.caseId,
    persisted: false,
    requiresDomainHandler: true,
  };
};
