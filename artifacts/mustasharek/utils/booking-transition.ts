export type BookingTransition =
  | "confirm"
  | "cancel"
  | "join"
  | "complete"
  | "dispute";

export class BookingTransitionError extends Error {
  readonly status: number;
  readonly conflict: boolean;
  readonly data: unknown;

  constructor(status: number, message: string, data: unknown) {
    super(message);
    this.name = "BookingTransitionError";
    this.status = status;
    this.conflict = status === 409;
    this.data = data;
  }
}

function createIdempotencyKey(): string {
  const cryptoApi = globalThis.crypto;
  if (cryptoApi?.randomUUID) return cryptoApi.randomUUID();

  return `mst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

export async function bookingTransitionRequest<T>(options: {
  baseUrl: string;
  token: string;
  transition: BookingTransition;
  path: string;
  body?: unknown;
}): Promise<T> {
  const response = await fetch(`${options.baseUrl}${options.path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${options.token}`,
      "Idempotency-Key": createIdempotencyKey(),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : `تعذر تنفيذ عملية ${options.transition}`;
    throw new BookingTransitionError(response.status, message, data);
  }

  return data as T;
}
