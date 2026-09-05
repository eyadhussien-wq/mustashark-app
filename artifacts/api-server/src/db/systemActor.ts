export const SYSTEM_INTERNAL_ACTOR_ID = "system_internal_actor" as const;

export type UserActor = {
  kind: "user";
  userId: string;
  role: string;
};

export type SystemActor = {
  kind: "system";
  actorId: typeof SYSTEM_INTERNAL_ACTOR_ID;
};

export type DbActor = UserActor | SystemActor;

export const userActor = (userId: string, role: string): UserActor => ({
  kind: "user",
  userId,
  role,
});

export const systemActor = (): SystemActor => ({
  kind: "system",
  actorId: SYSTEM_INTERNAL_ACTOR_ID,
});
