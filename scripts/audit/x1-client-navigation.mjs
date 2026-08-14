import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const clientLayout = path.join(root, "artifacts/mustasharek/app/(client)/_layout.tsx");
const notificationBell = path.join(root, "artifacts/mustasharek/components/NotificationBell.tsx");
const notificationsRoute = path.join(root, "artifacts/mustasharek/app/notifications.tsx");

const [layout, bell, notifications] = await Promise.all([
  readFile(clientLayout, "utf8"),
  readFile(notificationBell, "utf8"),
  readFile(notificationsRoute, "utf8"),
]);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// X/1.1 — Client entry must be protected by client identity.
check(layout.includes('if (!user) return <Redirect href="/auth/login?role=client" />;'),
  "Client layout must redirect unauthenticated users to the client login.");
check(layout.includes('if (user.role !== "client") return <Redirect href="/" />;'),
  "Client layout must deny non-client identities from the client portal.");

// X/1.2 — Bottom navigation is reserved for primary recurring client functions.
const bottomTabNames = [...layout.matchAll(/(?:Tabs\.Screen|NativeTabs\.Trigger) name="([^"]+)"/g)].map((m) => m[1]);
const requiredTabs = ["index", "services", "consultations", "profile"];
for (const name of requiredTabs) check(bottomTabNames.includes(name), `Required client primary tab missing: ${name}`);
check(!bottomTabNames.includes("notifications"),
  "X/1 violation: notifications is currently exposed as a bottom tab; the Master Audit Map reserves notifications for the top Bell unless a later audit justifies a tab.");

// X/1.3 — Notifications must remain reachable from the shared top Bell.
check(layout.includes("<NotificationBell />"), "Client header must expose NotificationBell.");
check(bell.includes('router.push("/notifications")'), "NotificationBell must navigate to /notifications.");
check(notifications.length > 0, "Notifications route must exist.");

if (failures.length) {
  console.error("X/1 CLIENT NAVIGATION — FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("X/1 CLIENT NAVIGATION — PASS");
  console.log("- client identity gate: PASS");
  console.log("- primary bottom tabs: PASS");
  console.log("- notifications top-Bell path: PASS");
}
