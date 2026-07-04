import { google } from "googleapis";
import { logger } from "../lib/logger";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!email || !key) return null;
  return new google.auth.JWT({ email, key, scopes: SCOPES });
}

function getCalendarId() {
  return process.env.GOOGLE_CALENDAR_ID ?? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "primary";
}

function buildDateTimeRfc(date: string, time: string) {
  return { dateTime: `${date}T${time}:00`, timeZone: "Asia/Qatar" };
}

function addMinutes(date: string, time: string, mins: number) {
  const dt = new Date(`${date}T${time}:00`);
  dt.setMinutes(dt.getMinutes() + mins);
  const iso = dt.toISOString();
  return { dateTime: iso, timeZone: "Asia/Qatar" };
}

export interface CreateMeetEventInput {
  bookingId: string;
  lawyerName: string;
  clientName: string;
  subject: string;
  scheduledDate: string;
  scheduledTime: string;
  slotDurationMinutes?: number;
}

export interface MeetEventResult {
  googleMeetLink: string;
  googleEventId: string;
  isSimulated: boolean;
}

/**
 * Create a Google Calendar event with Meet conferencing.
 * Privacy: attendees are listed by display name only — no real emails exposed.
 * Falls back to a deterministic simulated link when credentials are not configured.
 */
export async function createMeetEvent(
  input: CreateMeetEventInput,
): Promise<MeetEventResult> {
  const auth = getAuth();

  if (!auth) {
    logger.warn(
      "GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY not set — using simulated Meet link",
    );
    return simulatedMeetEvent(input.bookingId);
  }

  try {
    const calendar = google.calendar({ version: "v3", auth });
    const calendarId = getCalendarId();
    const duration = input.slotDurationMinutes ?? 30;

    const event = await calendar.events.insert({
      calendarId,
      conferenceDataVersion: 1,
      requestBody: {
        summary: `استشارة قانونية — ${input.subject}`,
        description: [
          `منصة مستشارك — استشارة قانونية`,
          `المحامي: ${input.lawyerName}`,
          `العميل: ${input.clientName}`,
          `رقم الحجز: ${input.bookingId}`,
        ].join("\n"),
        start: buildDateTimeRfc(input.scheduledDate, input.scheduledTime),
        end: addMinutes(input.scheduledDate, input.scheduledTime, duration),
        visibility: "private",
        guestsCanSeeOtherGuests: false,
        guestsCanModify: false,
        conferenceData: {
          createRequest: {
            requestId: `mustasharek-${input.bookingId}`,
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        },
        // No attendee emails are included — privacy preserved.
        // The Meet link will be shared through the app.
        attendees: [],
      },
    });

    const meetLink =
      event.data.conferenceData?.entryPoints?.find(
        (ep) => ep.entryPointType === "video",
      )?.uri ?? null;

    if (!meetLink || !event.data.id) {
      logger.warn({ bookingId: input.bookingId }, "Google event created but no Meet link returned — using simulated");
      return simulatedMeetEvent(input.bookingId);
    }

    logger.info({ bookingId: input.bookingId, eventId: event.data.id }, "Google Calendar event created");
    return { googleMeetLink: meetLink, googleEventId: event.data.id, isSimulated: false };
  } catch (err) {
    logger.error({ err, bookingId: input.bookingId }, "Failed to create Google Calendar event — falling back to simulated");
    return simulatedMeetEvent(input.bookingId);
  }
}

/**
 * Cancel a Google Calendar event (e.g. on lawyer no-show / refunded_absent).
 * Silently succeeds if credentials are not configured.
 */
export async function cancelCalendarEvent(eventId: string): Promise<boolean> {
  const auth = getAuth();
  if (!auth) return false;

  try {
    const calendar = google.calendar({ version: "v3", auth });
    await calendar.events.delete({ calendarId: getCalendarId(), eventId });
    logger.info({ eventId }, "Google Calendar event cancelled");
    return true;
  } catch (err) {
    logger.error({ err, eventId }, "Failed to cancel Google Calendar event");
    return false;
  }
}

/**
 * Generate a deterministic simulated Meet link from booking ID.
 * Used when Google credentials are not configured (dev / demo mode).
 */
function simulatedMeetEvent(bookingId: string): MeetEventResult {
  const hash = bookingId
    .split("")
    .reduce((acc, ch) => (acc * 31 + ch.charCodeAt(0)) & 0x7fffffff, 0);
  const suffix = hash.toString(36).padStart(8, "0").substring(0, 8);
  const googleMeetLink = `https://meet.google.com/mst-${suffix.substring(0, 4)}-${suffix.substring(4)}`;
  const googleEventId = `simulated_${bookingId}_${Date.now()}`;
  return { googleMeetLink, googleEventId, isSimulated: true };
}
