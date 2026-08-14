import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const clientApp = path.join(root, "artifacts/mustasharek/app/(client)");
const clientLayout = path.join(clientApp, "_layout.tsx");
const dashboard = path.join(clientApp, "index.tsx");
const services = path.join(clientApp, "services.tsx");
const consultations = path.join(clientApp, "consultations.tsx");
const offers = path.join(clientApp, "offers.tsx");
const offer = path.join(clientApp, "offer.tsx");
const memo = path.join(clientApp, "memo.tsx");
const activeCase = path.join(clientApp, "active-case.tsx");
const documentCenter = path.join(clientApp, "document-center.tsx");
const notificationBell = path.join(root, "artifacts/mustasharek/components/NotificationBell.tsx");
const notificationsRoute = path.join(clientApp, "notifications.tsx");
const colors = path.join(root, "artifacts/mustasharek/constants/colors.ts");

const files = await Promise.all([
  readFile(clientLayout, "utf8"),
  readFile(dashboard, "utf8"),
  readFile(services, "utf8"),
  readFile(consultations, "utf8"),
  readFile(offers, "utf8"),
  readFile(offer, "utf8"),
  readFile(memo, "utf8"),
  readFile(activeCase, "utf8"),
  readFile(documentCenter, "utf8"),
  readFile(notificationBell, "utf8"),
  readFile(notificationsRoute, "utf8"),
  readFile(colors, "utf8"),
]);

const [layout, home, servicesScreen, consultationsScreen, offersScreen, offerScreen, memoScreen, activeCaseScreen, documentCenterScreen, bell, notifications, colorTokens] = files;
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

// X/1.4 — Every client route must have an explicit navigation decision.
check(servicesScreen.includes('router.push("/(client)/offers")'), "Services must expose the client's offers destination.");
check(servicesScreen.includes('router.push("/(client)/memo")'), "Services must expose the memo service destination.");
check(consultationsScreen.length > 0, "Client consultations route must exist and be non-empty.");
check(offersScreen.includes('router.push("/(client)/active-case")'), "Accepted representation offers must expose the active-case destination.");
check(offersScreen.includes('pathname: "/(client)/offer"'), "Offers must expose the offer-detail destination.");
check(offerScreen.includes("useLocalSearchParams"), "Offer detail must receive a route offer id.");
check(memoScreen.includes("export default function ClientMemo"), "Memo route must have a concrete client service screen.");
check(activeCaseScreen.includes('role="client"'), "Active Case route must render the client workspace role.");
check(activeCaseScreen.includes('router.push("/(client)/document-center")'),
  "Active Case must expose the approved contextual entry to Client Document Center.");
check(activeCaseScreen.includes('accessibilityLabel="مركز المستندات"'),
  "Document Center entry must expose an accessible semantic label.");
check(documentCenterScreen.includes('export { default } from "../document-center";'), "Client document-center route must resolve to the shared document center.");

// Approved X/1.4 decision: Document Center is contextual/shared, not primary navigation.
check(!bottomTabNames.includes("document-center"), "Document Center must not become a primary bottom tab.");

// D02 — Navigation and visual semantics must stay coupled to the shared design tokens.
check(layout.includes('import { useColors } from "@/hooks/useColors";'),
  "Classic client navigation must consume the shared D02 color hook.");
check(layout.includes("tabBarActiveTintColor: colors.primary"),
  "Classic client navigation must use the D02 primary semantic token.");
check(layout.includes("tabBarInactiveTintColor: colors.mutedForeground"),
  "Classic client navigation must use the D02 mutedForeground semantic token.");
check(activeCaseScreen.includes("C.gold"), "Contextual document action must use the D02 gold semantic token.");
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
  console.log("- X/1.4 route inventory/entry decisions: PASS");
  console.log("- D02 navigation contract: PASS");
}
