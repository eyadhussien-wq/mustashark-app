import assert from "node:assert/strict";
import presentationSecurity from "../../artifacts/mustasharek/lib/security/presentationSecurity";
import retrySafety from "../../artifacts/mustasharek/lib/security/retrySafety";
import agendaPresentation from "../../artifacts/mustasharek/lib/agenda/agendaPresentation";
import type { AgendaItem } from "../../artifacts/mustasharek/lib/agenda/agendaTypes";

const {
  authorizeAgendaPresentation,
  canRenderSensitiveAgendaField,
  safeTimeZone,
} = presentationSecurity;

const {
  buildRetryKey,
  decideRetry,
} = retrySafety;

const {
  formatAgendaTime,
  formatDateKey,
  toAgendaReadModel,
} = agendaPresentation;

const item: AgendaItem = {
  bookingId: "b-1",
  subject: "Consultation",
  type: "video",
  status: "SCHEDULED",
  startsAtUtc: "2026-03-08T00:30:00.000Z",
  displayTimezone: "America/New_York",
  lawyerId: "lawyer-1",
  clientId: "client-1",
  reminderState: "scheduled",
};

const client = authorizeAgendaPresentation(
  { userId: "client-1", role: "client" },
  item,
);

assert.deepEqual(client, {
  canView: true,
  canOpen: true,
  canMutate: false,
  reason: "allowed",
});

const otherClient = authorizeAgendaPresentation(
  { userId: "client-2", role: "client" },
  item,
);

assert.equal(otherClient.canView, false);
assert.equal(otherClient.reason, "not_owner");

const lawyer = authorizeAgendaPresentation(
  { userId: "lawyer-1", role: "lawyer" },
  item,
);

assert.equal(lawyer.canView, true);

assert.equal(
  canRenderSensitiveAgendaField(
    { userId: "lawyer-1", role: "lawyer" },
    item,
    "clientId",
  ),
  false,
);

assert.equal(
  canRenderSensitiveAgendaField(
    { userId: "lawyer-1", role: "lawyer" },
    item,
    "lawyerId",
  ),
  true,
);

assert.equal(safeTimeZone("Not/A_Timezone"), "UTC");

assert.equal(
  formatDateKey(
    "2026-03-08T00:30:00.000Z",
    "America/New_York",
  ),
  "2026-03-07",
);

assert.equal(
  formatDateKey(
    "2026-03-08T06:30:00.000Z",
    "America/New_York",
  ),
  "2026-03-08",
);

assert.equal(
  formatAgendaTime(
    "2026-11-01T05:30:00.000Z",
    "America/New_York",
  ),
  "01:30",
);

assert.equal(
  formatAgendaTime(
    "2026-11-01T06:30:00.000Z",
    "America/New_York",
  ),
  "01:30",
);

assert.equal(
  formatDateKey(
    "2026-08-16T21:30:00.000Z",
    "Asia/Qatar",
  ),
  "2026-08-17",
);

const model = toAgendaReadModel(
  [item],
  "America/New_York",
);

assert.equal(
  model.days[0]?.dateKey,
  "2026-03-07",
);

const request = {
  actorId: "client-1",
  operation: "create_booking" as const,
  resourceId: "lawyer-1",
  intent: "  consultation  at  09:00 ",
};

const key = buildRetryKey(request);

assert.equal(
  decideRetry(request, null).kind,
  "new",
);

assert.equal(
  decideRetry(request, key).kind,
  "replay",
);

assert.equal(
  decideRetry(
    {
      ...request,
      intent: "consultation at 10:00",
    },
    key,
  ).kind,
  "conflict",
);

console.log("S01-10 SECURITY & EDGE CASES TEST PASSED");
console.log("- presentation ownership boundaries: PASS");
console.log("- sensitive field scoping: PASS");
console.log("- invalid timezone fallback: PASS");
console.log("- DST repeated-hour handling: PASS");
console.log("- midnight crossing: PASS");
console.log("- deterministic retry identity/replay/conflict: PASS");