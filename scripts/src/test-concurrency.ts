import { execFileSync } from "node:child_process";

const baseUrl = process.env.CONCURRENCY_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const CLIENT_EMAIL = process.env.CONCURRENCY_CLIENT_EMAIL ?? "client@mustashark.com";
const CLIENT_PASSWORD = process.env.CONCURRENCY_CLIENT_PASSWORD ?? "test1234";
const LAWYER_EMAIL = process.env.CONCURRENCY_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const LAWYER_PASSWORD = process.env.CONCURRENCY_LAWYER_PASSWORD ?? "test1234";
const SCRIPT_TIMEOUT_MS = 30_000;
const REQUEST_TIMEOUT_MS = 5_000;
const PSQL_TIMEOUT_MS = 2_000;

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`${label} timed out after ${timeoutMs}ms`)), timeoutMs);
  });
  return Promise.race([promise, timeout]).finally(() => {
    if (timer) clearTimeout(timer);
  });
}

async function post(path: string, body: unknown, token: string) {
  return withTimeout((async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      const text = await response.text();
      let json: unknown;
      try {
        json = JSON.parse(text);
      } catch {
        json = { raw: text };
      }
      return { status: response.status, body: json };
    } finally {
      clearTimeout(timer);
    }
  })(), REQUEST_TIMEOUT_MS + 500, `POST ${path}`);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-c", query], {
    encoding: "utf8",
    timeout: PSQL_TIMEOUT_MS,
  }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

const globalTimer = setTimeout(() => {
  console.error(`CONCURRENCY TEST TIMEOUT: exceeded ${SCRIPT_TIMEOUT_MS}ms`);
  process.exit(1);
}, SCRIPT_TIMEOUT_MS);

globalTimer.unref();

let seededAvailability = false;
let lawyerId = "";

try {
  const clientLogin = await post("/api/auth/local-auth", {
    email: CLIENT_EMAIL,
    password: CLIENT_PASSWORD,
    role: "client",
  }, "");
  assert(clientLogin.status === 200, `client login failed: ${clientLogin.status}`);
  const clientToken = (clientLogin.body as { jwt?: string }).jwt;
  assert(typeof clientToken === "string" && clientToken.length > 20, "client login did not return JWT");

  const lawyerLogin = await post("/api/auth/local-auth", {
    email: LAWYER_EMAIL,
    password: LAWYER_PASSWORD,
    role: "lawyer",
  }, "");
  assert(lawyerLogin.status === 200, `lawyer login failed: ${lawyerLogin.status}`);
  const lawyerUser = (lawyerLogin.body as { user?: { id?: string } }).user;
  assert(typeof lawyerUser?.id === "string", "lawyer login did not return user id");
  lawyerId = lawyerUser.id;

  let availabilityRows = psql(
    `SELECT day_of_week || '|' || start_time || '|' || end_time || '|' || slot_duration_minutes FROM lawyer_availability WHERE lawyer_id = ${sqlLiteral(lawyerId)} AND active = true ORDER BY day_of_week, start_time;`,
  );

  if (!availabilityRows) {
    psql(
      `INSERT INTO lawyer_availability (id, lawyer_id, day_of_week, start_time, end_time, slot_duration_minutes, active) VALUES (${sqlLiteral(`ci-concurrency-${lawyerId}`)}, ${sqlLiteral(lawyerId)}, 1, '09:00', '17:00', 60, true) ON CONFLICT (lawyer_id, day_of_week, start_time, end_time) DO UPDATE SET active = true, slot_duration_minutes = 60;`,
    );
    seededAvailability = true;
    availabilityRows = psql(
      `SELECT day_of_week || '|' || start_time || '|' || end_time || '|' || slot_duration_minutes FROM lawyer_availability WHERE lawyer_id = ${sqlLiteral(lawyerId)} AND active = true ORDER BY day_of_week, start_time;`,
    );
  }

  function dateForDayOfWeek(targetDay: number) {
    const date = new Date();
    date.setUTCHours(0, 0, 0, 0);
    for (let offset = 1; offset <= 14; offset += 1) {
      const candidate = new Date(date.getTime() + offset * 86_400_000);
      if (candidate.getUTCDay() === targetDay) return candidate;
    }
    throw new Error(`Could not find future weekday ${targetDay}`);
  }

  let scheduledDate: string;
  let scheduledTime = "09:00";
  let scheduledEndTime = "10:00";

  if (availabilityRows) {
    const rows = availabilityRows.split("\n").map((row) => row.split("|"));
    const candidate = rows
      .map(([day, start, end, duration]) => ({
        day: Number(day),
        start: start.slice(0, 5),
        end: end.slice(0, 5),
        duration: Number(duration),
      }))
      .find((row) => row.day >= 1 && row.day <= 5 && row.duration > 0 && row.start < row.end);

    if (candidate) {
      scheduledDate = dateForDayOfWeek(candidate.day).toISOString().slice(0, 10);
      scheduledTime = candidate.start;
      const [hour, minute] = candidate.start.split(":").map(Number);
      const endMinutes = hour * 60 + minute + candidate.duration;
      scheduledEndTime = `${String(Math.floor(endMinutes / 60)).padStart(2, "0")}:${String(endMinutes % 60).padStart(2, "0")}`;
      assert(endMinutes <= 24 * 60, "selected availability window exceeds end of day");
      assert(scheduledEndTime <= candidate.end, "selected availability duration exceeds configured window");
    } else {
      scheduledDate = dateForDayOfWeek(1).toISOString().slice(0, 10);
    }
  } else {
    scheduledDate = dateForDayOfWeek(1).toISOString().slice(0, 10);
  }

  const bookingPayload = {
    lawyerId,
    subject: "CI concurrency smoke test",
    description: "Ephemeral GitHub Actions concurrency test; safe to discard with the test database.",
    scheduledDate,
    scheduledTime,
    scheduledEndTime,
    type: "chat",
  };

  const activeBlockCount = Number(psql(
    `SELECT count(*) FROM booking_time_blocks btb INNER JOIN bookings b ON b.id = btb.booking_id WHERE btb.lawyer_id = ${sqlLiteral(lawyerId)} AND btb.scheduled_date = ${sqlLiteral(scheduledDate)} AND btb.start_time = ${sqlLiteral(scheduledTime)} AND btb.end_time = ${sqlLiteral(scheduledEndTime)} AND b.status NOT IN ('rejected', 'cancelled_by_lawyer', 'cancelled_by_client', 'refunded_absent');`,
  ));
  assert(activeBlockCount === 0, `selected test slot is already occupied: ${activeBlockCount} active block(s)`);

  const [requestA, requestB] = await withTimeout(Promise.all([
    post("/api/bookings", bookingPayload, clientToken),
    post("/api/bookings", bookingPayload, clientToken),
  ]), REQUEST_TIMEOUT_MS + 2_000, "concurrent booking requests");

  const results = [requestA, requestB];
  const successCount = results.filter((result) => result.status === 201).length;
  const conflictCount = results.filter((result) => result.status === 409 && (result.body as { error?: string }).error === "slot_already_booked").length;

  assert(successCount === 1, `expected exactly one successful booking, got ${successCount}: ${JSON.stringify(results)}`);
  assert(conflictCount === 1, `expected exactly one SLOT_ALREADY_BOOKED conflict, got ${conflictCount}: ${JSON.stringify(results)}`);

  const blockCount = Number(psql(
    `SELECT count(*) FROM booking_time_blocks WHERE lawyer_id = ${sqlLiteral(lawyerId)} AND scheduled_date = ${sqlLiteral(scheduledDate)} AND start_time = ${sqlLiteral(scheduledTime)} AND end_time = ${sqlLiteral(scheduledEndTime)};`,
  ));
  assert(blockCount === 1, `expected exactly one booking_time_blocks row, got ${blockCount}`);

  const bookingId = ((results.find((result) => result.status === 201)?.body as { booking?: { id?: string } }).booking?.id);
  assert(typeof bookingId === "string", "successful booking did not return booking id");

  const eventCount = Number(psql(
    `SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = 'CONSULTATION_CREATED';`,
  ));
  assert(eventCount === 1, `expected exactly one CONSULTATION_CREATED event, got ${eventCount}`);

  const notificationCount = Number(psql(
    `SELECT count(*) FROM notifications WHERE booking_id = ${sqlLiteral(bookingId)};`,
  ));
  assert(notificationCount === 2, `expected exactly two notifications for the single successful booking, got ${notificationCount}`);

  console.log("S01 CONCURRENCY SMOKE TEST PASSED");
  console.log(`- success responses: ${successCount}`);
  console.log(`- SLOT_ALREADY_BOOKED conflicts: ${conflictCount}`);
  console.log(`- booking_time_blocks rows: ${blockCount}`);
  console.log(`- CONSULTATION_CREATED events: ${eventCount}`);
  console.log(`- notifications for winner: ${notificationCount}`);
  console.log(`- slot: ${scheduledDate} ${scheduledTime}-${scheduledEndTime} (${lawyerId})`);
} finally {
  if (seededAvailability && lawyerId) {
    psql(`DELETE FROM lawyer_availability WHERE lawyer_id = ${sqlLiteral(lawyerId)} AND day_of_week = 1 AND start_time = '09:00' AND end_time = '17:00';`);
  }
  clearTimeout(globalTimer);
}
