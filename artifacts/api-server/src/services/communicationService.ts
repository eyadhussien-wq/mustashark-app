export interface BookingCommunicationInput {
  bookingId: string;
  clientId: string;
  lawyerId: string;
  type: 'chat' | 'audio' | 'video';
  scheduledDate: string;
  scheduledTime: string;
  meetingUrl: string | null;
}

export interface BookingNotificationInput {
  userId: string;
  kind: 'info' | 'success' | 'warning' | 'error' | 'verification' | 'finance';
  title: string;
  message: string;
}

class CommunicationService {
  async generateMeetingLink(consultationId: string): Promise<string> {
    const baseUrl = process.env.MEETING_BASE_URL?.replace(/\/+$/, '');
    if (!baseUrl) throw new Error('MEETING_BASE_URL_NOT_CONFIGURED');
    const uniqueRoom = `mustasharek-${consultationId.slice(0, 8)}`;
    return `${baseUrl}/${uniqueRoom}`;
  }

  buildBookingConfirmationNotifications(
    input: BookingCommunicationInput,
  ): BookingNotificationInput[] {
    const sessionText = input.meetingUrl
      ? `رابط الانضمام للجلسة: ${input.meetingUrl}`
      : 'سيتم التواصل عبر المحادثة داخل التطبيق.';

    return [
      {
        userId: input.clientId,
        kind: 'success',
        title: 'تم تأكيد الاستشارة',
        message: `تم تأكيد موعد استشارتك القانونية.\nنوع الاستشارة: ${input.type.toUpperCase()}\nموعد الجلسة: ${input.scheduledDate} ${input.scheduledTime}\n${sessionText}`,
      },
      {
        userId: input.lawyerId,
        kind: 'info',
        title: 'تم تأكيد استشارة جديدة',
        message: `لديك استشارة جديدة مؤكدة.\nموعد الجلسة: ${input.scheduledDate} ${input.scheduledTime}\nنوع الاستشارة: ${input.type.toUpperCase()}\n${sessionText}`,
      },
    ];
  }
}

export const communicationService = new CommunicationService();
