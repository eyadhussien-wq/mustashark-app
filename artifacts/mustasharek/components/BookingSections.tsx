import React from "react";
import { Feather } from "@expo/vector-icons";
import { Text, TouchableOpacity, View } from "react-native";

export type BookingChannel = "email" | "chat" | "phone" | "video";

export const BOOKING_CHANNELS: Array<{
  id: BookingChannel;
  labelAR: string;
  labelEN: string;
  descriptionAR: string;
  descriptionEN: string;
  icon: keyof typeof Feather.glyphMap;
}> = [
  {
    id: "email",
    labelAR: "استشارة مكتوبة عبر البريد الإلكتروني",
    labelEN: "Written Email Consultation",
    descriptionAR: "تبادل السؤال والإجابة والمرفقات عبر البريد الإلكتروني",
    descriptionEN: "Exchange the question, answer and attachments by email",
    icon: "mail",
  },
  {
    id: "chat",
    labelAR: "محادثة نصية",
    labelEN: "Text Chat",
    descriptionAR: "محادثة داخل التطبيق",
    descriptionEN: "Conversation inside the app",
    icon: "message-square",
  },
  {
    id: "phone",
    labelAR: "مكالمة هاتفية",
    labelEN: "Phone Call",
    descriptionAR: "مكالمة هاتفية في الموعد المحدد",
    descriptionEN: "Scheduled phone call",
    icon: "phone",
  },
  {
    id: "video",
    labelAR: "مكالمة فيديو",
    labelEN: "Video Call",
    descriptionAR: "مكالمة فيديو في الموعد المحدد",
    descriptionEN: "Scheduled video call",
    icon: "video",
  },
];

export function BookingTypeSelector({
  value,
  available,
  lang,
  onChange,
}: {
  value: BookingChannel;
  available: Partial<Record<BookingChannel, boolean>>;
  lang: "ar" | "en";
  onChange: (type: BookingChannel) => void;
}) {
  const visible = BOOKING_CHANNELS.filter((channel) => available[channel.id] !== false);
  return (
    <View style={{ gap: 10 }}>
      {visible.map((channel) => {
        const selected = value === channel.id;
        return (
          <TouchableOpacity
            key={channel.id}
            onPress={() => onChange(channel.id)}
            activeOpacity={0.85}
            style={{
              flexDirection: lang === "ar" ? "row-reverse" : "row",
              alignItems: "center",
              gap: 12,
              padding: 14,
              borderRadius: 14,
              borderWidth: 1.5,
              borderColor: selected ? "#C9A035" : "#E5E7EB",
              backgroundColor: selected ? "rgba(201,160,53,0.10)" : "#FFFFFF",
            }}
          >
            <View style={{ width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: selected ? "rgba(201,160,53,0.16)" : "#F3F4F6" }}>
              <Feather name={channel.icon} size={18} color={selected ? "#132B4F" : "#6B7280"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: "700", color: "#132B4F", textAlign: lang === "ar" ? "right" : "left" }}>
                {lang === "ar" ? channel.labelAR : channel.labelEN}
              </Text>
              <Text style={{ marginTop: 3, fontSize: 12, color: "#6B7280", textAlign: lang === "ar" ? "right" : "left" }}>
                {lang === "ar" ? channel.descriptionAR : channel.descriptionEN}
              </Text>
            </View>
            <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: selected ? "#C9A035" : "#D1D5DB", alignItems: "center", justifyContent: "center" }}>
              {selected ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: "#C9A035" }} /> : null}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function BookingAvailability({ lang }: { lang: "ar" | "en" }) {
  return (
    <Text style={{ fontSize: 12, color: "#6B7280", textAlign: lang === "ar" ? "right" : "left" }}>
      {lang === "ar" ? "يظهر للعميل فقط ما يسمح به المحامي." : "Clients only see channels enabled by the lawyer."}
    </Text>
  );
}

export function EmailNotice({ lang }: { lang: "ar" | "en" }) {
  return (
    <View style={{ flexDirection: lang === "ar" ? "row-reverse" : "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 12, backgroundColor: "rgba(201,160,53,0.08)" }}>
      <Feather name="mail" size={16} color="#C9A035" />
      <Text style={{ flex: 1, fontSize: 12, lineHeight: 18, color: "#5B6472", textAlign: lang === "ar" ? "right" : "left" }}>
        {lang === "ar" ? "في الاستشارة البريدية يتم التواصل عبر البريد الإلكتروني المرتبط بحساب العميل والمحامي بعد تأكيد الحجز." : "For email consultations, the client and lawyer communicate through their account email after booking confirmation."}
      </Text>
    </View>
  );
}
