export interface ConsultationDetails {
  id: string;
  clientId: string;
  lawyerId: string;
  type: 'chat' | 'audio' | 'video' | 'email';
  clientEmail: string;
  lawyerEmail: string;
  scheduledAt: string;
}

class CommunicationService {
  async generateMeetingLink(consultationId: string): Promise<string> {
    const uniqueRoom = `mustasharek-${consultationId.slice(0, 8)}`;
    return `https://meet.google.com/${uniqueRoom}`;
  }

  async sendEmailNotification(to: string, subject: string, body: string): Promise<boolean> {
    console.log(`[Email Service Log] To: ${to} | Subject: ${subject}`);
    return true;
  }

  async initializeChatSession(consultationId: string): Promise<void> {
    console.log(`[Chat Service Log] Initialized chat for consultation: ${consultationId}`);
  }
}

export const communicationService = new CommunicationService();
