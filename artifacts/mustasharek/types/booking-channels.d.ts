import "@/contexts/DataContext";

declare module "@/contexts/DataContext" {
  interface CommunicationChannels {
    email: boolean;
  }

  interface Lawyer {
    litigationTier?: string;
  }
}

export type ConsultationChannel = "video" | "phone" | "chat" | "email";
