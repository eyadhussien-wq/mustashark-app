import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { ConsultationCard } from "@/components/ConsultationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData, type Consultation } from "@/contexts/DataContext";

const C = colors.light;

// ── Star Rating component ────────────────────────────────────────────────────
function StarRating({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => {
            void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onChange(star);
          }}
          activeOpacity={0.7}
          style={starStyles.btn}
        >
          <Feather
            name="star"
            size={36}
            color={star <= value ? C.gold : C.border}
            style={star <= value ? starStyles.filled : starStyles.empty}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

const starStyles = StyleSheet.create({
  row: { flexDirection: "row-reverse", justifyContent: "center", gap: 6 },
  btn: { padding: 4 },
  filled: {},
  empty: { opacity: 0.35 },
});

const STAR_LABELS: Record<number, string> = {
  1: "ضعيف",
  2: "مقبول",
  3: "جيد",
  4: "جيد جداً",
  5: "ممتاز",
};

// ── Rating Modal ────────────────────────────────────────────────────────────
function RatingModal({
  consultation,
  onSubmit,
  onSkip,
}: {
  consultation: Consultation;
  onSubmit: (stars: number, comment: string) => void;
  onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 7,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  async function handleSubmit() {
    if (stars === 0) return;
    setSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(stars, comment);
  }

  return (
    <Modal
      visible
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onSkip}
    >
      <Animated.View style={[styles.ratingOverlay, { opacity: fadeAnim }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={{ width: "100%" }}
        >
          <Animated.View
            style={[
              styles.ratingSheet,
              {
                paddingBottom: insets.bottom + 20,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            {/* Header */}
            <View style={styles.ratingHeader}>
              <View style={styles.ratingStarBg}>
                <Feather name="award" size={28} color={C.gold} />
              </View>
              <Text style={styles.ratingTitle}>قيّم تجربتك مع المحامي</Text>
              <Text style={styles.ratingSubtitle}>
                {consultation.lawyerName}
              </Text>
              <Text style={styles.ratingConsultMeta}>
                {consultation.subject} •{" "}
                {consultation.lawyerSpecialization}
              </Text>
            </View>

            {/* Stars */}
            <View style={styles.starsSection}>
              <StarRating value={stars} onChange={setStars} />
              {stars > 0 && (
                <Text style={styles.starLabel}>{STAR_LABELS[stars]}</Text>
              )}
            </View>

            {/* Comment */}
            <View style={styles.commentSection}>
              <Text style={styles.commentLabel}>
                أضف تعليقك (اختياري)
              </Text>
              <TextInput
                style={styles.commentInput}
                placeholder="شارك تجربتك مع هذا المحامي..."
                placeholderTextColor={C.mutedForeground}
                value={comment}
                onChangeText={setComment}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                textAlign="right"
              />
            </View>

            {/* Actions */}
            <View style={styles.ratingActions}>
              <TouchableOpacity
                style={styles.skipBtn}
                onPress={onSkip}
                activeOpacity={0.7}
              >
                <Text style={styles.skipBtnText}>تخطّى</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.submitBtn,
                  stars === 0 && styles.submitBtnDisabled,
                  submitting && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={stars === 0 || submitting}
                activeOpacity={0.85}
              >
                <Feather name="send" size={15} color="#fff" />
                <Text style={styles.submitBtnText}>إرسال التقييم</Text>
              </TouchableOpacity>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Animated.View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ClientConsultations() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { consultations, rateLawyer, refreshData } = useData();
  const [pendingRating, setPendingRating] = useState<Consultation | null>(null);
  const [ratingDone, setRatingDone] = useState<Set<string>>(new Set());

  const myConsultations = useMemo(
    () => consultations.filter((c) => c.clientId === user?.id),
    [consultations, user]
  );

  // Check for completed consultations that haven't been rated yet
  useEffect(() => {
    const toRate = myConsultations.find(
      (c) =>
        c.status === "completed" &&
        !c.rating &&
        !ratingDone.has(c.id)
    );
    if (toRate) {
      setPendingRating(toRate);
    }
  }, [myConsultations, ratingDone]);

  async function handleRatingSubmit(stars: number, comment: string) {
    if (!pendingRating) return;
    await rateLawyer(pendingRating.id, stars, comment);
    setRatingDone((prev) => new Set(prev).add(pendingRating.id));
    setPendingRating(null);
    await refreshData();
  }

  function handleRatingSkip() {
    if (!pendingRating) return;
    setRatingDone((prev) => new Set(prev).add(pendingRating.id));
    setPendingRating(null);
  }

  return (
    <>
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) },
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>استشاراتي</Text>
          <Text style={styles.sub}>{myConsultations.length} استشارة</Text>
        </View>

        <FlatList
          data={myConsultations}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View>
              <ConsultationCard consultation={item} viewAs="client" />
              {/* Rating badge if already rated */}
              {item.status === "completed" && item.rating && (
                <View style={styles.ratingBadgeRow}>
                  <View style={styles.ratingBadge}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Feather
                        key={s}
                        name="star"
                        size={11}
                        color={s <= item.rating!.stars ? C.gold : C.border}
                      />
                    ))}
                    <Text style={styles.ratingBadgeText}>
                      تقييمك: {item.rating.stars}/5
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) },
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="calendar" size={44} color={C.border} />
              <Text style={styles.emptyTitle}>لا توجد استشارات بعد</Text>
              <Text style={styles.emptyText}>
                ابحث عن محامٍ واحجز استشارتك الأولى
              </Text>
            </View>
          }
        />
      </View>

      {/* Rating modal */}
      {pendingRating && (
        <RatingModal
          consultation={pendingRating}
          onSubmit={handleRatingSubmit}
          onSkip={handleRatingSkip}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  sub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.foreground },
  emptyText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },

  ratingBadgeRow: { paddingHorizontal: 20, paddingBottom: 6, marginTop: -4 },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-end",
    backgroundColor: "rgba(201,160,53,0.1)",
    borderWidth: 1,
    borderColor: "rgba(201,160,53,0.25)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  ratingBadgeText: {
    fontSize: 11,
    color: C.gold,
    fontFamily: "Inter_600SemiBold",
    marginRight: 4,
  },

  // ── Rating Modal ─────────────────────────────────────────────────────────
  ratingOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  ratingSheet: {
    width: "100%",
    backgroundColor: C.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingHorizontal: 24,
    gap: 20,
  },
  ratingHeader: { alignItems: "center", gap: 8 },
  ratingStarBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(201,160,53,0.12)",
    borderWidth: 2,
    borderColor: "rgba(201,160,53,0.3)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  ratingTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    textAlign: "center",
  },
  ratingSubtitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: C.navy,
    textAlign: "center",
  },
  ratingConsultMeta: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  starsSection: { alignItems: "center", gap: 10 },
  starLabel: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.gold,
  },
  commentSection: { gap: 8 },
  commentLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
    textAlign: "right",
  },
  commentInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.foreground,
    backgroundColor: C.card,
    minHeight: 88,
  },
  ratingActions: { flexDirection: "row", gap: 12 },
  skipBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: "center",
  },
  skipBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.mutedForeground,
  },
  submitBtn: {
    flex: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.navy,
    borderRadius: 14,
    paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
