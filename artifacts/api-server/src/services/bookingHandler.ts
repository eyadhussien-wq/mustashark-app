import { communicationService } from './communicationService';

interface ConfirmBookingParams {
  consultationId: string;
  clientEmail: string;
  clientName: string;
  lawyerEmail: string;
  lawyerName: string;
  type: 'chat' | 'audio' | 'video';
  scheduledTime: string;
}

export async function handleBookingConfirmation(params: ConfirmBookingParams) {
  try {
    console.log(`[Agent System] Processing booking for consultation: ${params.consultationId}`);

    let meetingUrl = '';

    // الخطوة 1: إذا كانت الاستشارة صوتية أو مرئية، نقوم بتوليد رابط Google Meet آمن وخاص
    if (params.type === 'audio' || params.type === 'video') {
      meetingUrl = await communicationService.generateMeetingLink(params.consultationId);
    }

    // الخطوة 2: إرسال إيميل آمن ومستقل للعميل (بدون كشف إيميل أو هاتف المحامي)
    const clientEmailBody = `مرحباً ${params.clientName}،\n\nتم تأكيد موعد استشارتك القانونية.\nنوع الاستشارة: ${params.type.toUpperCase()}\nموعد الجلسة: ${params.scheduledTime}\n${meetingUrl ? `رابط الانضمام للمكالمة: ${meetingUrl}` : 'ستتم المراسلة عبر الشات داخل التطبيق.'}\n\nشكراً لاستخدامك منصة مستشارك.`;
    
    await communicationService.sendEmailNotification(
      params.clientEmail,
      'تأكيد حجز الاستشارة القانونية - مستشارك',
      clientEmailBody
    );

    // الخطوة 3: إرسال إيميل آمن ومستقل للمحامي (بدون إظهار معلومات اتصال حساسية غير مصرح بها)
    const lawyerEmailBody = `مرحباً د. ${params.lawyerName}،\n\nلديك استشارة جديدة مؤكدة مع العميل.\nموعد الجلسة: ${params.scheduledTime}\nنوع الاستشارة: ${params.type.toUpperCase()}\n${meetingUrl ? `رابط المكالمة: ${meetingUrl}` : 'يرجى متابعة الشات الداخلي.'}\n\nيرجى الاستعداد في الموعد المحدد.`;

    await communicationService.sendEmailNotification(
      params.lawyerEmail,
      'تنبيه: موعد استشارة جديدة مؤكدة - مستشارك',
      lawyerEmailBody
    );

    // الخطوة 4: تهيئة نظام المحادثة الفورية الآمنة داخل التطبيق (بسرية تامة وبدون أرقام هواتف)
    if (params.type === 'chat') {
      await communicationService.initializeChatSession(params.consultationId);
    }

    console.log('[Agent System] Booking flow completed securely and successfully.');
    return { success: true, meetingUrl };

  } catch (error) {
    console.error('[Agent Error] Failed to process secure booking flow:', error);
    throw new Error('فشل إتمام عملية الحجز وإرسال الإشعارات الآمنة.');
  }
}
