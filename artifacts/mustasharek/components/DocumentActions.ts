export type DocumentKind = "memo" | "quote" | "agreement" | "payment_receipt" | "milestone" | "case_summary" | "handover_receipt" | "international_receipt" | "iban_proof" | "identity_proof" | "audit_log";
export type AppRole = "client" | "lawyer" | "admin";
export type DocumentAction = "view" | "pdf" | "print" | "share" | "verify" | "archive";

const BASE: Record<DocumentKind, DocumentAction[]> = {
  memo: ["view", "pdf", "print", "share"], quote: ["view", "pdf", "print", "share"], agreement: ["view", "pdf", "print", "share"], payment_receipt: ["view", "pdf", "print", "share"], milestone: ["view", "pdf", "print"], case_summary: ["view", "pdf", "print", "share"], handover_receipt: ["view", "pdf", "print", "share"], international_receipt: ["view", "pdf", "print", "share"], iban_proof: ["view", "verify"], identity_proof: ["view", "verify"], audit_log: ["view", "pdf", "print", "archive"],
};

export function getDocumentActions(kind: DocumentKind, role: AppRole): DocumentAction[] {
  const actions = [...BASE[kind]];
  if (role === "client" && (kind === "iban_proof" || kind === "identity_proof")) return ["view"];
  if (role === "lawyer" && kind === "identity_proof") return ["view"];
  if (role === "admin" && (kind === "iban_proof" || kind === "identity_proof")) return ["view", "verify", "archive"];
  return actions;
}
