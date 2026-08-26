import type { Consultation, ConsultationStatus } from "@/contexts/DataContext";

export const LAWYER_WORK_QUEUE_STATUSES = ["pending", "accepted"] as const satisfies readonly ConsultationStatus[];

export type LawyerWorkQueueItem = Pick<
  Consultation,
  "id" | "serialNumber" | "clientName" | "subject" | "date" | "time" | "status" | "type"
>;

/**
 * Selects the lawyer's actionable consultation queue from the existing
 * consultation source. This is read-only: it does not mutate consultation
 * state and deliberately excludes financial fields.
 */
export function buildLawyerWorkQueue(
  consultations: readonly Consultation[],
  lawyerId: string,
): LawyerWorkQueueItem[] {
  return consultations
    .filter((consultation) => consultation.lawyerId === lawyerId)
    .filter((consultation) =>
      LAWYER_WORK_QUEUE_STATUSES.includes(
        consultation.status as (typeof LAWYER_WORK_QUEUE_STATUSES)[number],
      ),
    )
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))
    .map(({ id, serialNumber, clientName, subject, date, time, status, type }) => ({
      id,
      serialNumber,
      clientName,
      subject,
      date,
      time,
      status,
      type,
    }));
}
