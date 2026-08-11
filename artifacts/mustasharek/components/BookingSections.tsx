import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

export type ConsultationType = "email" | "chat" | "phone" | "video";
export type BookingChannel = ConsultationType;

export function isScheduledConsultation(type: ConsultationType) {
  return type !== "email";
}

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

const CHANNEL_META: Record<
  ConsultationType,
  {
    label: string;
    icon: keyof typeof Feather.glyphMap;
    color: string;
  }
> = {
  email: {
    label: "استشارة مكتوبة (بريد إلكتروني)",
    icon: "mail",
    color: C.gold,
  },
  chat: {
    label: "محادثة نصية",
    icon: "message-square",
    color: C.primary,
  },
  phone: {
    label: "مكالمة هاتفية",
    icon: "phone",
    color: "#2563EB",
  },
  video: {
    label: "مكالمة فيديو",
    icon: "video",
    color: "#7C3AED",
  },
};

export function BookingTypeSelector({
  value,
  onChange,
  options,
  available,
  lang = "ar",
}: {
  value: ConsultationType;
  onChange: (value: ConsultationType) => void;
  options?: ConsultationType[];
  available?: Partial<Record<BookingChannel, boolean>>;
  lang?: "ar" | "en";
}) {
  const list =
    options ??
    BOOKING_CHANNELS.filter(
      (channel) => available?.[channel.id] !== false,
    ).map((channel) => channel.id);

  /*
   * Keep the richer four-channel presentation when `available` or `lang`
   * is supplied, while retaining compatibility with the existing selector
   * API used by older booking screens.
   */
  const useRichLayout = available !== undefined || lang !== "ar";

  if (useRichLayout) {
    const visible = list.filter(
      (type) => available?.[type] !== false,
    );

    return (
      <View style={{ gap: 10 }}>
        {visible.map((type) => {
          const channel = BOOKING_CHANNELS.find((item) => item.id === type)!;
          const selected = value === type;

          return (
            <TouchableOpacity
              key={type}
              onPress={() => onChange(type)}
              activeOpacity={0.85}
              style={{
                flexDirection: lang === "ar" ? "row-reverse" : "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1.5,
                borderColor: selected ? "#C9A035" : "#E5E7EB",
                backgroundColor: selected
                  ? "rgba(201,160,53,0.10)"
                  : "#FFFFFF",
              }}
            >
              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: selected
                    ? "rgba(201,160,53,0.16)"
                    : "#F3F4F6",
                }}
              >
                <Feather
                  name={channel.icon}
                  size={18}
                  color={selected ? "#132B4F" : "#6B7280"}
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: "#132B4F",
                    textAlign: lang === "ar" ? "right" : "left",
                  }}
                >
                  {lang === "ar" ? channel.labelAR : channel.labelEN}
                </Text>

                <Text
                  style={{
                    marginTop: 3,
                    fontSize: 12,
                    color: "#6B7280",
                    textAlign: lang === "ar" ? "right" : "left",
                  }}
                >
                  {lang === "ar"
                    ? channel.descriptionAR
                    : channel.descriptionEN}
                </Text>
              </View>

              <View
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 10,
                  borderWidth: 2,
                  borderColor: selected ? "#C9A035" : "#D1D5DB",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {selected ? (
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: "#C9A035",
                    }}
                  />
                ) : null}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>نوع الاستشارة</Text>

      <View style={styles.grid}>
        {list.map((type) => {
          const meta = CHANNEL_META[type];
          const active = value === type;

          return (
            <TouchableOpacity
              key={type}
              onPress={() => onChange(type)}
              style={[
                styles.typeCard,
                active && {
                  borderColor: meta.color,
                  backgroundColor: `${meta.color}10`,
                },
              ]}
            >
              <View
                style={[
                  styles.icon,
                  {
                    backgroundColor: active ? meta.color : "#F4F5F7",
                  },
                ]}
              >
                <Feather
                  name={meta.icon}
                  size={18}
                  color={active ? "#fff" : meta.color}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  active && { color: meta.color },
                ]}
              >
                {meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export function EmailNotice({
  lang = "ar",
}: {
  lang?: "ar" | "en";
}) {
  return (
    <View
      style={
        lang === "ar"
          ? styles.notice
          : {
              flexDirection: "row",
              alignItems: "flex-start",
              gap: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: "rgba(201,160,53,0.08)",
              marginBottom: 12,
            }
      }
    >
      <Feather name="mail" size={18} color={C.gold} />

      <Text
        style={
          lang === "ar"
            ? styles.noticeText
            : {
                flex: 1,
                fontSize: 12,
                lineHeight: 18,
                color: "#5B6472",
                textAlign: "left",
              }
        }
      >
        {lang === "ar"
          ? "تنبيه: هذه استشارة مكتوبة، وسيصلك الرد المفصل من المحامي عبر بريدك الإلكتروني خلال 24 إلى 48 ساعة كحد أقصى."
          : "For email consultations, the client and lawyer communicate through their account email after booking confirmation."}
      </Text>
    </View>
  );
}

export function BookingAvailability({
  selectedDate,
  selectedTime,
  days,
  slots,
  onDate,
  onTime,
  duration = 60,
  lang = "ar",
}: {
  selectedDate?: string;
  selectedTime?: string;
  days?: {
    date: string;
    dayNum: number;
    monthLabel: string;
    weekdayLabel: string;
  }[];
  slots?: {
    time: string;
    available: boolean;
  }[];
  onDate?: (date: string) => void;
  onTime?: (time: string) => void;
  duration?: number;
  lang?: "ar" | "en";
}) {
  if (!days || !slots || !onDate || !onTime) {
    return (
      <Text
        style={{
          fontSize: 12,
          color: "#6B7280",
          textAlign: lang === "ar" ? "right" : "left",
        }}
      >
        {lang === "ar"
          ? "يظهر للعميل فقط ما يسمح به المحامي."
          : "Clients only see channels enabled by the lawyer."}
      </Text>
    );
  }

  return (
    <View style={styles.section}>
      <Text style={styles.title}>مواعيدي</Text>

      <Text style={styles.caption}>
        اختر الموعد المناسب لك قبل المتابعة
      </Text>

      <View style={styles.days}>
        {days.map((day) => (
          <TouchableOpacity
            key={day.date}
            onPress={() => onDate(day.date)}
            style={[
              styles.day,
              selectedDate === day.date && styles.dayActive,
            ]}
          >
            <Text
              style={[
                styles.small,
                selectedDate === day.date && styles.activeText,
              ]}
            >
              {day.monthLabel}
            </Text>

            <Text
              style={[
                styles.num,
                selectedDate === day.date && styles.activeText,
              ]}
            >
              {day.dayNum}
            </Text>

            <Text
              style={[
                styles.small,
                selectedDate === day.date && styles.activeText,
              ]}
            >
              {day.weekdayLabel}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selectedDate && (
        <View style={styles.slots}>
          {slots.map((slot) => (
            <TouchableOpacity
              key={slot.time}
              disabled={!slot.available}
              onPress={() => slot.available && onTime(slot.time)}
              style={[
                styles.slot,
                !slot.available && styles.disabled,
                selectedTime === slot.time && styles.slotActive,
              ]}
            >
              <Text
                style={[
                  styles.slotText,
                  selectedTime === slot.time && styles.activeText,
                ]}
              >
                {slot.time}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <Text style={styles.duration}>
        مدة الموعد: {duration} دقيقة
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    textAlign: "right",
  },
  caption: {
    fontSize: 10,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 4,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 11,
  },
  typeCard: {
    width: "48%",
    minHeight: 82,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 13,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },
  icon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
    textAlign: "center",
  },
  notice: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#FFF9E8",
    borderWidth: 1,
    borderColor: "#E7C96B",
    borderRadius: 14,
    padding: 13,
    marginBottom: 12,
  },
  noticeText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 18,
    color: C.foreground,
    textAlign: "right",
    fontFamily: "Inter_500Medium",
  },
  days: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
  },
  day: {
    minWidth: 63,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 8,
    alignItems: "center",
  },
  dayActive: {
    backgroundColor: C.navy,
    borderColor: C.navy,
  },
  small: {
    fontSize: 9,
    color: C.mutedForeground,
  },
  num: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    marginVertical: 3,
  },
  activeText: {
    color: "#fff",
  },
  slots: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
    marginTop: 12,
  },
  slot: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 10,
  },
  slotActive: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  slotText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
  },
  disabled: {
    opacity: 0.35,
  },
  duration: {
    fontSize: 9,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 10,
  },
});
