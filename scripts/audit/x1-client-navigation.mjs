import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const clientLayout = path.join(root, "artifacts/mustasharek/app/(client)/_layout.tsx");
const dashboard = path.join(root, "artifacts/mustasharek/app/(client)/index.tsx");
const notificationBell = path.join(root, "artifacts/mustasharek/components/NotificationBell.tsx");
const notificationsRoute = path.join(root, "artifacts/mustasharek/app/notifications.tsx");
const colors = path.join(root, "artifacts/mustasharek/constants/colors.ts");

const [layout, home, bell, notifications, colorTokens] = await Promise.all([
  readFile(clientLayout, "utf8"),
  readFile(dashboard, "utf8"),
  readFile(notificationBell, "utf8"),
  readFile(notificationsRoute, "utf8"),
  readFile(colors, "utf8"),
]);

const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};

// X/1.1 — Dashboard is the protected client entry point and exposes the current client context.
check(layout.includes('if (!user) return <Redirect href="/auth/login?role=client" />;'),
  "Client layout must redirect unauthenticated users to the client login.");
check(layout.includes('if (user.role !== "client") return <Redirect href="/" />;'),
  "Client layout must deny non-client identities from the client portal.");
check(home.includes("useAuth"), "Client Dashboard must be connected to authenticated client context.");
check(home.includes("myConsultations"), "Client Dashboard must expose the client's consultation state.");
check(home.includes("nextConsultation"), "Client Dashboard must expose the client's current/upcoming activity state.");
check(home.includes("router.push(`/lawyer/${item.id}`)"), "Client Dashboard must provide the primary lawyer-discovery destination.");
check(home.includes("/consultation/${nextConsultation.id}"), "Client Dashboard must provide the current consultation destination.");

// X/1.2 — Bottom navigation is reserved for primary recurring client functions.
const bottomTabNames = [...layout.matchAll(/(?:Tabs\.Screen|NativeTabs\.Trigger) name="([^"]+)"/g)].map((m) => m[1]);
const requiredTabs = ["index", "services", "consultations", "profile"];
for (const name of requiredTabs) check(bottomTabNames.includes(name), `Required client primary tab missing: ${name}`);
check(!bottomTabNames.includes("notifications"),
  "X/1 violation: notifications is currently exposed as a bottom tab; the Master Audit Map reserves notifications for the top Bell unless a later audit justifies a tab.");

// X/1.3 — Notifications remain reachable from the shared top Bell.
check(layout.includes("<NotificationBell />"), "Client header must expose NotificationBell.");
check(bell.includes('router.push("/notifications")'), "NotificationBell must navigate to /notifications.");
check(notifications.length > 0, "Notifications route must exist.");
check(bell.includes('colors from "@/constants/colors"'), "NotificationBell must consume the D02 color token source.");
check(bell.includes("C.gold"), "NotificationBell must use the D02 gold semantic token.");
check(bell.includes("C.navy"), "NotificationBell must use the D02 navy semantic token.");
check(bell.includes("C.destructive"), "NotificationBell badge must use the D02 destructive semantic token.");

// X/1.4 + D02 — Navigation and visual semantics must stay coupled to the shared design tokens.
check(layout.includes('import { useColors } from "@/hooks/useColors";'),
  "Classic client navigation must consume the shared D02 color hook.");
check(layout.includes("tabBarActiveTintColor: colors.primary"),
  "Classic client navigation must use the D02 primary semantic token.");
check(layout.includes("tabBarInactiveTintColor: colors.mutedForeground"),
  "Classic client navigation must use the D02 mutedForeground semantic token.");
check(colorTokens.includes("primary:"), "D02 color contract must expose a primary token.");
check(colorTokens.includes("mutedForeground:"), "D02 color contract must expose a mutedForeground token.");
check(colorTokens.includes("gold:"), "D02 color contract must expose a gold token.");
check(colorTokens.includes("navy:"), "D02 color contract must expose a navy token.");
check(colorTokens.includes("destructive:"), "D02 color contract must expose a destructive token.");

if (failures.length) {
  console.error("X/1 CLIENT NAVIGATION + D02 — FAIL");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("X/1 CLIENT NAVIGATION + D02 — PASS");
  console.log("- X/1.1 dashboard entry/context: PASS");
  console.log("- X/1.2 primary bottom tabs: PASS");
  console.log("- X/1.3 notifications top-Bell path: PASS");
  console.log("- X/1.4 navigation/D02 contract: PASS");
}
