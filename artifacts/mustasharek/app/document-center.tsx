import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { DocumentActions, DocumentRole, getDocumentActions, type DocumentKind } from "@/components/DocumentActions";
import { DOCUMENT_PRESENTATION, ROLE_DOCUMENT_COPY } from "@/constants/documentDesign";

const C = colors.light;
const DOCS: DocumentKind[] = ["memo", "quote", "agreement", "payment_receipt", "milestone", "case_summary", "handover", "international_handover", "audit"];

export default function DocumentCenter() {
  const router = useRouter();
  const { user } = useAuth();
  const role: DocumentRole = user?.role === "admin" ? "admin" : user?.role === "lawyer" ? "lawyer" : "client";
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={20} color="#fff" /></TouchableOpacity>
      <View style={styles.headerCopy}><Text style={styles.eyebrow}>المستندات والصلاحيات</Text><Text style={styles.title}>مركز المستندات</Text><Text style={styles.subtitle}>{ROLE_DOCUMENT_COPY[role]}</Text></View>
      <View style={styles.shield}><Feather name="shield" size={21} color={C.gold} /></View>
    </View>

    <View style={styles.archiveCard}>
      <View style={styles.archiveIcon}><Feather name="archive" size={19} color={C.gold} /></View>
      <View style={styles.archiveCopy}><Text style={styles.archiveTitle}>أرشيف الاستشارات والمطبوعات</Text><Text style={styles.archiveText}>الاستشارات المنتهية، أرقامها التسلسلية، وسجل الوثائق القابل للطباعة.</Text></View>
      <TouchableOpacity style={styles.archiveButton} onPress={() => router.push("/consultation-archive")}><Text style={styles.archiveButtonText}>فتح</Text></TouchableOpacity>
    </View>

    {DOCS.map((kind) => { const doc = DOCUMENT_PRESENTATION[kind]; const actions = getDocumentActions(role, kind); return <View key={kind} style={[styles.card, doc.sensitive && styles.sensitive]}><View style={styles.top}><View style={[styles.icon, doc.sensitive && styles.sensitiveIcon]}><Feather name={doc.icon as any} size={18} color={doc.sensitive ? "#B42318" : C.primary} /></View><View style={styles.copy}><View style={styles.titleLine}><Text style={styles.cardTitle}>{doc.title}</Text>{doc.sensitive && <View style={styles.privateTag}><Feather name="lock" size={10} color="#B42318" /><Text style={styles.privateText}>حساس</Text></View>}</View><Text style={styles.description}>{doc.description}</Text></View></View><DocumentActions role={role} kind={kind} compact onAction={(action) => { if (__DEV__) console.log("document-action", { role, kind, action }); }} /><Text style={styles.permissions}>متاح لك: {actions.map((a) => ({ view: "العرض", pdf: "PDF", print: "الطباعة", share: "المشاركة", verify: "التحقق", archive: "الأرشفة" } as Record<string,string>)[a]).join(" • ")}</Text></View>; })}
  </ScrollView>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background }, content: { padding: 18, paddingTop: 52, paddingBottom: 110 },
  header: { backgroundColor: C.navy, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,53,0.35)", marginBottom: 14 }, headerCopy: { flex: 1, alignItems: "flex-end", marginHorizontal: 10 }, eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" }, title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 3 }, subtitle: { color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 4, fontFamily: "Inter_400Regular" }, back: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }, shield: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  archiveCard: { backgroundColor: C.navy, borderRadius: 16, padding: 13, marginBottom: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "rgba(201,160,53,0.35)" }, archiveIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }, archiveCopy: { flex: 1, alignItems: "flex-end" }, archiveTitle: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" }, archiveText: { color: "rgba(255,255,255,0.68)", fontSize: 9, lineHeight: 15, textAlign: "right", marginTop: 3 }, archiveButton: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 }, archiveButtonText: { color: C.navy, fontSize: 10, fontFamily: "Inter_700Bold" },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14, marginBottom: 9 }, sensitive: { borderColor: "rgba(180,35,24,0.28)", backgroundColor: "#FFF9F8" }, top: { flexDirection: "row", alignItems: "flex-start", gap: 10 }, icon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center" }, sensitiveIcon: { backgroundColor: "#FDECEC" }, copy: { flex: 1, alignItems: "flex-end" }, titleLine: { flexDirection: "row", alignItems: "center", gap: 7 }, cardTitle: { color: C.foreground, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" }, description: { color: C.mutedForeground, fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 3, fontFamily: "Inter_400Regular" }, privateTag: { flexDirection: "row", alignItems: "center", gap: 3, backgroundColor: "#FDECEC", paddingHorizontal: 6, paddingVertical: 3, borderRadius: 8 }, privateText: { color: "#B42318", fontSize: 8, fontFamily: "Inter_700Bold" }, permissions: { color: C.mutedForeground, fontSize: 9, textAlign: "right", marginTop: 7, fontFamily: "Inter_400Regular" },
});
