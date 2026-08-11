import "@/contexts/DataContext";

declare module "@/contexts/DataContext" {
  interface CommunicationChannels {
    email: boolean;
  }
}

export type ConsultationChannel = "video" | "phone" | "chat" | "email";
