export type NeutralAuthorizationActorState = "active" | "inactive";
export type NeutralRelationshipState = "active" | "inactive";
export type NeutralMatterState = "active" | "completed" | "archived";
export type NeutralResourceState = "draft" | "active" | "archived";

export type NeutralAuthorizationOperation =
  | "read"
  | "create"
  | "update"
  | "archive"
  | "share"
  | "revoke_share"
  | "export";

export type NeutralExistenceDisclosure = "hide" | "confirm";

export type NeutralAuthorizationDecision = {
  allowed: boolean;
  status: 200 | 403 | 404;
  reasonCode: string;
  existenceDisclosure: NeutralExistenceDisclosure;
};

export type NeutralAuthorizationContext = {
  actorState: NeutralAuthorizationActorState;
  relationshipState: NeutralRelationshipState;
  matterState: NeutralMatterState | null;
  resourceState: NeutralResourceState | null;
  resourceExists: boolean;
  resourceInActorScope: boolean;
  resourceMatchesMatter: boolean;
  operation: NeutralAuthorizationOperation;
  actorRole: "lawyer" | "client" | "admin";
};

/**
 * Central Neutral Core authorization policy.
 *
 * The policy deliberately separates:
 * 1. authentication/account state,
 * 2. relationship state,
 * 3. matter lifecycle,
 * 4. resource scope/lifecycle,
 * 5. operation permission, and
 * 6. existence disclosure.
 *
 * It never consults financial, marketplace, escrow, wallet, settlement,
 * payout, or client-fund authorities.
 */
export function decideNeutralAuthorization(context: NeutralAuthorizationContext): NeutralAuthorizationDecision {
  if (context.actorState !== "active") {
    return deny("ACTOR_NOT_ACTIVE", "hide");
  }

  if (context.actorRole === "admin") {
    return deny("ADMIN_CONFIDENTIAL_ACCESS_DENIED", "hide");
  }

  if (!context.resourceExists || !context.resourceInActorScope) {
    return deny("RESOURCE_NOT_ACCESSIBLE", "hide");
  }

  if (context.relationshipState !== "active") {
    return deny("RELATIONSHIP_NOT_ACTIVE", "confirm");
  }

  if (context.matterState === "archived") {
    return deny("MATTER_ARCHIVED", "confirm");
  }

  if (context.matterState !== null && !context.resourceMatchesMatter) {
    return deny("RESOURCE_MATTER_SCOPE_MISMATCH", "hide");
  }

  if (context.resourceState === "archived" && context.operation !== "export") {
    return deny("RESOURCE_ARCHIVED", "confirm");
  }

  if (context.actorRole === "client" && context.resourceState === "draft") {
    return deny("CLIENT_DRAFT_ACCESS_DENIED", "confirm");
  }

  return {
    allowed: true,
    status: 200,
    reasonCode: "AUTHORIZED",
    existenceDisclosure: "confirm",
  };
}

function deny(reasonCode: string, existenceDisclosure: NeutralExistenceDisclosure): NeutralAuthorizationDecision {
  return {
    allowed: false,
    status: existenceDisclosure === "hide" ? 404 : 403,
    reasonCode,
    existenceDisclosure,
  };
}
