import { execFileSync } from "node:child_process";

const baseUrl = process.env.S01_02_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const lawyerEmail = process.env.S01_02_LAWYER_EMAIL ?? "testlawyer@mustashark.com";
const lawyerPassword = process.env.S01_02_LAWYER_PASSWORD ?? "test1234";
const clientEmail = process.env.S01_02_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.S01_02_CLIENT_PASSWORD ?? "test1234";
const timeoutMs = 8_000;
const TEST_SUBJECT = "S01-02 automated verification";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: any = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const result = await request("/api/auth/local-auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  assert(result.status === 200 && typeof result.body?.jwt === "string", `${role} login failed: ${JSON.stringify(result)}`);
  return result.body as { jwt: string; userId: string; user?: { id?: string } };
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-c", query], {
    encoding: "utf8",
    timeout: timeoutMs,
  }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function nextDateForDay(targetDay: number) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let offset = 1; offset <= 21; offset += 1) {
    const candidate = new Date(today.getTime() + offset * 86_400_000);
    if (candidate.getUTCDay() === targetDay) return candidate.toISOString().slice(0, 10);
  }
  throw new Error(`Could not find a future date for weekday ${targetDay}`);
}

const originalAvailability: string[] = [];
let lawyerId = "";
const createdBookingIds: string[] = [];

try {
  const lawyerLogin = await login(lawyerEmail, lawyerPassword, "lawyer");
  lawyerId = lawyerLogin.userId || lawyerLogin.user?.id || "";
  assert(lawyerId, "lawyer login did not return user id");
  const clientLogin = await login(clientEmail, clientPassword, "client");
  const lawyerToken = lawyerLogin.jwt;
  const clientToken = clientLogin.jwt;

  let result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ slots: [] }),
  });
  assert(result.status === 403, `client availability mutation was not rejected: ${JSON.stringify(result)}`);
  result = await request("/api/availability/lawyers/me", { method: "DELETE", headers: { authorization: `Bearer ${clientToken}` } });
  assert(result.status === 403, `client availability deletion was not rejected: ${JSON.stringify(result)}`);

  const original = psql(`SELECT id || '|' || day_of_week || '|' || start_time || '|' || end_time || '|' || slot_duration_minutes || '|' || active FROM lawyer_availability WHERE lawyer_id = ${sqlLiteral(lawyerId)} ORDER BY day_of_week, start_time;`);
  if (original) originalAvailability.push(...original.split("\n"));

  const monday = nextDateForDay(1);
  const initial = { slots: [
    { dayOfWeek: 1, startTime: "09:00", endTime: "11:00", slotDurationMinutes: 60 },
    { dayOfWeek: 3, startTime: "14:00", endTime: "16:00", slotDurationMinutes: 60 },
  ] };
  const modified = { slots: [
    { dayOfWeek: 1, startTime: "10:00", endTime: "12:00", slotDurationMinutes: 60 },
    { dayOfWeek: 3, startTime: "15:00", endTime: "17:00", slotDurationMinutes: 60 },
  ] };

  result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${lawyerToken}` },
    body: JSON.stringify({ slots: [
      { dayOfWeek: 1, startTime: "10:00", endTime: "12:00", slotDurationMinutes: 60 },
      { dayOfWeek: 1, startTime: "11:00", endTime: "13:00", slotDurationMinutes: 60 },
    ] }),
  });
  assert(result.status === 400 && result.body?.error === "availability_slots_overlap", `availability overlap validation failed: ${JSON.stringify(result)}`);

  result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${lawyerToken}` },
    body: JSON.stringify({ slots: [{ dayOfWeek: 1, startTime: "10:00", endTime: "10:30", slotDurationMinutes: 60 }] }),
  });
  assert(result.status === 400 && result.body?.error === "availability_window_shorter_than_slot_duration", `availability duration validation failed: ${JSON.stringify(result)}`);

  result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${lawyerToken}` },
    body: JSON.stringify(initial),
  });
  assert(result.status === 200 && result.body?.availability?.length === 2, `availability create failed: ${JSON.stringify(result)}`);

  result = await request(`/api/availability/lawyers/${lawyerId}`, { headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200, `availability read failed: ${JSON.stringify(result)}`);
  assert(JSON.stringify(result.body.availability.map((x: any) => [x.dayOfWeek, x.startTime.slice(0, 5), x.endTime.slice(0, 5), x.slotDurationMinutes])) === JSON.stringify([[1, "09:00", "11:00", 60], [3, "14:00", "16:00", 60]]), "availability create/read values mismatch");

  result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${lawyerToken}` },
    body: JSON.stringify(modified),
  });
  assert(result.status === 200 && result.body?.availability?.length === 2, `availability update failed: ${JSON.stringify(result)}`);

  result = await request(`/api/availability/lawyers/${lawyerId}`, { headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200, `availability re-read failed: ${JSON.stringify(result)}`);
  assert(JSON.stringify(result.body.availability.map((x: any) => [x.dayOfWeek, x.startTime.slice(0, 5), x.endTime.slice(0, 5), x.slotDurationMinutes])) === JSON.stringify([[1, "10:00", "12:00", 60], [3, "15:00", "17:00", 60]]), "availability update/read values mismatch");

  result = await request(`/api/availability/lawyers/${lawyerId}/slots?date=${monday}`, { headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200, `available slots read failed: ${JSON.stringify(result)}`);
  assert(result.body.timezone === "Asia/Qatar", "availability slots must declare Qatar timezone");
  assert(JSON.stringify(result.body.slots.map((x: any) => [x.startTime, x.endTime])) === JSON.stringify([["10:00", "11:00"], ["11:00", "12:00"]]), "slot generation does not match persisted availability");

  result = await request("/api/availability/lawyers/me", { method: "DELETE", headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200 && Number(result.body.deleted) === 2, `availability delete failed: ${JSON.stringify(result)}`);

  result = await request(`/api/availability/lawyers/${lawyerId}`, { headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200 && result.body.availability.length === 0, `availability delete verification failed: ${JSON.stringify(result)}`);
  result = await request(`/api/availability/lawyers/${lawyerId}/slots?date=${monday}`, { headers: { authorization: `Bearer ${lawyerToken}` } });
  assert(result.status === 200 && result.body.slots.length === 0, `strict availability failed: slots appeared without persisted availability: ${JSON.stringify(result.body)}`);

  result = await request("/api/availability/lawyers/me", {
    method: "PUT",
    headers: { "content-type": "application/json", authorization: `Bearer ${lawyerToken}` },
    body: JSON.stringify(modified),
  });
  assert(result.status === 200, `availability restore failed: ${JSON.stringify(result)}`);

  result = await request("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` },
    body: JSON.stringify({ lawyerId, subject: TEST_SUBJECT, description: "outside availability", scheduledDate: monday, scheduledTime: "13:00", scheduledEndTime: "14:00", type: "chat" }),
  });
  assert(result.status === 409 && result.body?.error === "slot_not_available", `outside-availability rule failed: ${JSON.stringify(result)}`);

  const validPayload = { lawyerId, subject: TEST_SUBJECT, description: "overlap test", scheduledDate: monday, scheduledTime: "10:00", scheduledEndTime: "11:00", type: "chat" };
  result = await request("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` },
    body: JSON.stringify(validPayload),
  });
  assert(result.status === 201 && typeof result.body?.booking?.id === "string", `valid booking failed: ${JSON.stringify(result)}`);
  createdBookingIds.push(result.body.booking.id);
  assert(typeof result.body.booking.reference === "string" && result.body.booking.reference === result.body.booking.serialNumber, "consultation reference is not canonical serialNumber");

  result = await request("/api/bookings", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` },
    body: JSON.stringify(validPayload),
  });
  assert(result.status === 409 && result.body?.error === "slot_already_booked", `overlap rule failed: ${JSON.stringify(result)}`);

  const concurrentPayload = { lawyerId, subject: TEST_SUBJECT, description: "concurrency test", scheduledDate: monday, scheduledTime: "11:00", scheduledEndTime: "12:00", type: "chat" };
  const [a, b] = await Promise.all([
    request("/api/bookings", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` }, body: JSON.stringify(concurrentPayload) }),
    request("/api/bookings", { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${clientToken}` }, body: JSON.stringify(concurrentPayload) }),
  ]);
  const results = [a, b];
  const winners = results.filter((x) => x.status === 201);
  const conflicts = results.filter((x) => x.status === 409 && x.body?.error === "slot_already_booked");
  assert(winners.length === 1 && conflicts.length === 1, `concurrency rule failed: ${JSON.stringify(results)}`);
  createdBookingIds.push(winners[0].body.booking.id);

  const blockCount = Number(psql(`SELECT count(*) FROM booking_time_blocks WHERE lawyer_id=${sqlLiteral(lawyerId)} AND scheduled_date=${sqlLiteral(monday)} AND start_time='11:00' AND end_time='12:00';`));
  assert(blockCount === 1, `booking_time_blocks exact-slot invariant failed: expected 1, got ${blockCount}`);

  console.log("S01-02 AVAILABILITY + BOOKING RULES PASSED");
  console.log("- authorization boundary: PASS");
  console.log("- availability validation: PASS");
  console.log("- availability CRUD: PASS");
  console.log("- strict no-fallback slots: PASS");
  console.log("- outside availability: PASS (409 slot_not_available)");
  console.log("- overlap: PASS (409 slot_already_booked)");
  console.log("- concurrency: PASS (1 success / 1 conflict)");
  console.log(`- booking_time_blocks exact slot: PASS (${blockCount} row)`);
} finally {
  if (lawyerId) {
    for (const bookingId of createdBookingIds) {
      psql(`DELETE FROM consultation_events WHERE booking_id=${sqlLiteral(bookingId)}; DELETE FROM bookings WHERE id=${sqlLiteral(bookingId)};`);
    }
    psql(`DELETE FROM lawyer_availability WHERE lawyer_id=${sqlLiteral(lawyerId)};`);
    for (const row of originalAvailability) {
      const [id, day, start, end, duration, active] = row.split("|");
      psql(`INSERT INTO lawyer_availability (id, lawyer_id, day_of_week, start_time, end_time, slot_duration_minutes, active) VALUES (${sqlLiteral(id)}, ${sqlLiteral(lawyerId)}, ${Number(day)}, ${sqlLiteral(start)}, ${sqlLiteral(end)}, ${Number(duration)}, ${active === "t"});`);
    }
  }
}
