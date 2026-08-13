import { readFile } from "node:fs/promises";

const controller = await readFile("artifacts/api-server/src/controllers/paymentProofs.ts", "utf8");
const routes = await readFile("artifacts/api-server/src/routes/paymentProofs.ts", "utf8");

const requiredControllerGuards = [
  "FOR UPDATE",
  "booking.clientId !== authUser.id",
  "payment_currency_not_configured",
  "payment_currency_mismatch",
  "paymentStatus === \"paid\"",
  "amount_exceeds_remaining_balance",
  "paymentProofsTable.status, \"submitted\"",
];

for (const guard of requiredControllerGuards) {
  if (!controller.includes(guard)) {
    throw new Error(`Missing payment security guard: ${guard}`);
  }
}

const requiredRoutes = [
  '"/bookings/:id/payment-proofs"',
  '"/bookings/:id/payment-proofs/:proofId/confirm"',
  '"/bookings/:id/payment-proofs/:proofId/reject"',
  'requireAuth',
  'requireClient',
  'requireLawyerOrAdmin',
];

for (const route of requiredRoutes) {
  if (!routes.includes(route)) {
    throw new Error(`Missing payment route contract: ${route}`);
  }
}

console.log("Payment proof security contract: PASS");
