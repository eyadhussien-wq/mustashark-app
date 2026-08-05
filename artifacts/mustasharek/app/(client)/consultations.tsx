import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { ConsultationCard } from "@/components/ConsultationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData, type Consultation } from "@/contexts/DataContext";

const C = colors.light;
type Tab = "active" | "archive";

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "";

// ── Star Rating ──────────────────────────────────────────────────────────────
function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [pressed, setPressed] = useState(0);

  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const filled = star <= value;
        return (
          <TouchableOpacity
            key={star}
            onPressIn={() => setPressed(star)}
            onPressOut={() => setPressed(0)}
            onPress={() => {
              void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              onChange(star);
            }}
            activeOpacity={0.6}
            style={[
              starStyles.btn,
              pressed === star && starStyles.btnPressed,
            ]}
          >
            <Feather name="star" size={40}
              color={filled ? C.gold : C.border}
              style={filled
                ? { ...starStyles.filled, textShadowColor: "rgba(201,160,53,0.3)", textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }
                : starStyles.empty
              }
            />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const starStyles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "center", gap: 8, alignItems: "center" },
  btn: {
    padding: 6, borderRadius: 10,
    transform: [{ scale: 1 }],
  },
  btnPressed: {
    transform: [{ scale: 1.2 }],
    backgroundColor: "rgba(201,160,53,0.12)",
  },
  filled: {},
  empty: { opacity: 0.25 },
});
const STAR_LABELS: Record<number, string> = { 1: "ضعيف", 2: "مقبول", 3: "جيد", 4: "جيد جداً", 5: "ممتاز" };

// ── Rating Modal ─────────────────────────────────────────────────────────────
// Text comments are off by default — stars only
function RatingModal({ consultation, onSubmit, onSkip }: {
  consultation: Consultation; onSubmit: (s: number) => void; onSkip: () => void;
}) {
  const insets = useSafeAreaInsets();
  const [stars, setStars] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const slideAnim = useRef(new Animated.Value(80)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, { toValue: 0, friction: 7, tension: 50, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
    ]).start();
  }, [slideAnim, fadeAnim]);

  async function handleSubmit() {
    if (stars === 0) return;
    setSubmitting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onSubmit(stars);
  }

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onSkip}>
      <Animated.View style={[styles.ratingOverlay, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.ratingSheet, { paddingBottom: insets.bottom + 20, transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.ratingHeader}>
            <View style={styles.ratingStarBg}><Feather name="award" size={28} color={C.gold} /></View>
            <Text style={styles.ratingTitle}>قيّم تجربتك مع المحامي</Text>
            <Text style={styles.ratingSubtitle}>{consultation.lawyerName}</Text>
            <Text style={styles.ratingConsultMeta}>{consultation.subject} • {consultation.lawyerSpecialization}</Text>
          </View>
          <View style={styles.starsSection}>
            <StarRating value={stars} onChange={setStars} />
            {stars > 0 && <Text style={styles.starLabel}>{STAR_LABELS[stars]}</Text>}
          </View>
          <View style={styles.ratingActions}>
            <TouchableOpacity style={styles.skipBtn} onPress={onSkip} activeOpacity={0.7}>
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
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Feather name="send" size={15} color="#fff" />
                  <Text style={styles.submitBtnText}>إرسال التقييم</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// ── Main screen ──────────────────────────────────────────────────────────────
export default function ClientConsultations() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, getAuthToken } = useAuth();
  const { consultations, rateLawyer, refreshData } = useData();
  const [tab, setTab] = useState<Tab>("active");
  const [pendingRating, setPendingRating] = useState<Consultation | null>(null);
  const [ratingDone, setRatingDone] = useState<Set<string>>(new Set());

  const myConsultations = useMemo(
    () => consultations.filter((c) => c.clientId === user?.id),
    [consultations, user]
  );

  const activeConsultations = useMemo(
    () => myConsultations.filter((c) => c.status === "pending" || c.status === "accepted"),
    [myConsultations]
  );

  const archivedConsultations = useMemo(
    () =>
      myConsultations.filter(
        (c) =>
          c.status === "completed" ||
          c.status === "rejected" ||
          c.status === "cancelled_by_lawyer" ||
          c.status === "cancelled_by_client" ||
          c.status === "no_show_lawyer" ||
          c.status === "no_show_client" ||
          c.status === "disputed"
      ),
    [myConsultations]
  );

  const displayed = tab === "active" ? activeConsultations : archivedConsultations;

  // Check for completed consultations without ratings
  useEffect(() => {
    const toRate = myConsultations.find(
      (c) => c.status === "completed" && !c.rating && !ratingDone.has(c.id)
    );
    if (toRate) setPendingRating(toRate);
  }, [myConsultations, ratingDone]);

  async function handleRatingSubmit(stars: number) {
    if (!pendingRating) return;
    // Persist to real API (best-effort; local state updates regardless)
    if (API_BASE) {
      try {
        const token = await getAuthToken();
        await fetch(`${API_BASE}/reviews`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token ?? ""}`,
          },
          body: JSON.stringify({
            consultationId: pendingRating.id,
            lawyerId: pendingRating.lawyerId,
            stars,
          }),
        });
      } catch {
        // Silent — local state still gets updated below
      }
    }
    await rateLawyer(pendingRating.id, stars, "");
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
      <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>استشاراتي</Text>
          <Text style={styles.sub}>{myConsultations.length} استشارة</Text>
        </View>

        {/* Archive tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tab, tab === "active" && styles.tabActive]}
            onPress={() => setTab("active")}
            activeOpacity={0.8}
          >
            <Feather name="activity" size={13} color={tab === "active" ? "#fff" : C.mutedForeground} />
            <Text style={[styles.tabText, tab === "active" && styles.tabTextActive]}>
              نشطة
            </Text>
            {activeConsultations.length > 0 && (
              <View style={[styles.tabBadge, tab === "active" && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === "active" && { color: C.navy }]}>
                  {activeConsultations.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === "archive" && styles.tabActive]}
            onPress={() => setTab("archive")}
            activeOpacity={0.8}
          >
            <Feather name="archive" size={13} color={tab === "archive" ? "#fff" : C.mutedForeground} />
            <Text style={[styles.tabText, tab === "archive" && styles.tabTextActive]}>
              الأرشيف
            </Text>
            {archivedConsultations.length > 0 && (
              <View style={[styles.tabBadge, tab === "archive" && styles.tabBadgeActive]}>
                <Text style={[styles.tabBadgeText, tab === "archive" && { color: C.navy }]}>
                  {archivedConsultations.length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <FlatList
          data={displayed}
          keyExtractor={(c) => c.id}
          renderItem={({ item }) => (
            <View>
              {/* Serial number */}
              <View style={styles.serialRow}>
                <Feather name="hash" size={10} color={C.mutedForeground} />
                <Text style={styles.serialText}>{item.serialNumber ?? item.id}</Text>
              </View>
              <ConsultationCard
                consultation={item}
                viewAs="client"
                onPress={() => router.push(`/consultation/${item.id}`)}
              />
              {/* Rating badge for archived rated ones */}
              {item.status === "completed" && item.rating && (
                <View style={styles.ratingBadgeRow}>
                  <View style={styles.ratingBadge}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Feather key={s} name="star" size={11}
                        color={s <= item.rating!.stars ? C.gold : C.border} />
                    ))}
                    <Text style={styles.ratingBadgeText}>تقييمك: {item.rating.stars}/5</Text>
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
              <Feather name={tab === "active" ? "calendar" : "archive"} size={44} color={C.border} />
              <Text style={styles.emptyTitle}>
                {tab === "active" ? "لا توجد استشارات نشطة" : "الأرشيف فارغ"}
              </Text>
              <Text style={styles.emptyText}>
                {tab === "active"
                  ? "ابحث عن محامٍ واحجز استشارتك الأولى"
                  : "ستظهر هنا الاستشارات المكتملة والمرفوضة"}
              </Text>
            </View>
          }
        />
      </View>

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
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingVertical: 16,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  sub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  tabBar: {
    flexDirection: "row", gap: 10,
    paddingHorizontal: 20, paddingBottom: 14,
  },
  tab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 11, borderRadius: 14,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  tabActive: { backgroundColor: C.navy, borderColor: C.navy },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.mutedForeground },
  tabTextActive: { color: "#fff" },
  tabBadge: {
    minWidth: 20, height: 20, borderRadius: 10,
    backgroundColor: C.border, alignItems: "center", justifyContent: "center",
    paddingHorizontal: 5,
  },
  tabBadgeActive: { backgroundColor: C.gold },
  tabBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: C.mutedForeground },

  serialRow: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 20, paddingBottom: 4,
  },
  serialText: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  list: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.foreground },
  emptyText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },

  ratingBadgeRow: { paddingHorizontal: 0, paddingBottom: 6, marginTop: -4 },
  ratingBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    alignSelf: "flex-end",
    backgroundColor: "rgba(201,160,53,0.1)", borderWidth: 1,
    borderColor: "rgba(201,160,53,0.25)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  ratingBadgeText: { fontSize: 11, color: C.gold, fontFamily: "Inter_600SemiBold", marginRight: 4 },

  // Rating modal
  ratingOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.65)", justifyContent: "flex-end", alignItems: "center" },
  ratingSheet: {
    width: "100%", backgroundColor: C.background,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingTop: 24, paddingHorizontal: 24, gap: 20,
  },
  ratingHeader: { alignItems: "center", gap: 8 },
  ratingStarBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: "rgba(201,160,53,0.12)", borderWidth: 2,
    borderColor: "rgba(201,160,53,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  ratingTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "center" },
  ratingSubtitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.navy, textAlign: "center" },
  ratingConsultMeta: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
  starsSection: { alignItems: "center", gap: 10 },
  starLabel: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.gold },
  commentSection: { gap: 8 },
  commentLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  commentInput: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, fontFamily: "Inter_400Regular", color: C.foreground,
    backgroundColor: C.card, minHeight: 88,
  },
  ratingActions: { flexDirection: "row", gap: 12 },
  skipBtn: { flex: 1, paddingVertical: 14, borderRadius: 14, borderWidth: 1.5, borderColor: C.border, alignItems: "center" },
  skipBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.mutedForeground },
  submitBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.navy, borderRadius: 14, paddingVertical: 14,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
