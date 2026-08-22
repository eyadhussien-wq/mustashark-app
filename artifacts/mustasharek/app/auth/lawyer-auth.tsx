import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Image,
  KeyboardAvoidingView,
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
import { useAuth } from "@/contexts/AuthContext";
import { rateLabel } from "@/utils/currency";

const C = colors.light;
const LOGO = require("../../assets/images/logo-transparent.png");

const SPECIALIZATIONS = [
  { label: "قانون تجاري", icon: "briefcase" },
  { label: "قانون جنائي", icon: "shield" },
  { label: "أحوال شخصية", icon: "users" },
  { label: "قانون عقاري", icon: "home" },
  { label: "قانون عمالي", icon: "user-check" },
  { label: "قانون مدني", icon: "book" },
  { label: "قانون إداري", icon: "file-text" },
  { label: "ملكية فكرية", icon: "cpu" },
];

function verifyLicense(number: string, country: "qatar" | "jordan"): boolean {
  const n = number.trim().toUpperCase();
  if (country === "qatar") return /^QAT-\d{5}$/.test(n) || /^\d{5,8}$/.test(number.trim());
  return /^JOR-\d{5}$/.test(n) || /^\d{5,8}$/.test(number.trim());
}

type Tab = "login" | "register";

export default function LawyerAuth() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login, registerLawyer } = useAuth();
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();

  const [tab, setTab] = useState<Tab>("login");
  const tabAnim = useRef(new Animated.Value(0)).current;

  function switchTab(t: Tab) {
    setTab(t);
    Animated.spring(tabAnim, {
      toValue: t === "login" ? 0 : 1,
      useNativeDriver: false,
      tension: 80,
      friction: 12,
    }).start();
    setError("");
  }

  // ── Login state ─────────────────────────────────────────────
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [showLoginPass, setShowLoginPass] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // ── Register state ───────────────────────────────────────────
  const [form, setForm] = useState({
    name: "",
    email: prefillEmail ?? "",
    password: "",
    phone: "",
    country: "qatar" as "qatar" | "jordan",
    specialization: "",
    licenseNumber: "",
    bio: "",
    experience: "",
    hourlyRate: "",
  });
  const [showRegPass, setShowRegPass] = useState(false);
  const [licenseState, setLicenseState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [uploadedDoc, setUploadedDoc] = useState<{ name: string; uri: string } | null>(null);
  const [regLoading, setRegLoading] = useState(false);

  const [error, setError] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  function setField(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "licenseNumber") setLicenseState("idle");
  }

  // ── Document Upload ──────────────────────────────────────────
  async function pickDocument() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const name = asset.fileName ?? "بطاقة_الترخيص.jpg";
      setUploadedDoc({ name, uri: asset.uri });
    }
  }

  // ── License Verify ───────────────────────────────────────────
  async function checkLicense() {
    if (!form.licenseNumber) { setError("يرجى إدخال رقم الترخيص"); return; }
    setLicenseState("checking");
    await new Promise((r) => setTimeout(r, 1500));
    setLicenseState(verifyLicense(form.licenseNumber, form.country) ? "valid" : "invalid");
  }

  // ── Login handler ────────────────────────────────────────────
  async function handleLogin() {
    setError("");
    if (!loginEmail || !loginPassword) { setError("يرجى إدخال البريد وكلمة المرور"); return; }
    setLoginLoading(true);
    try {
      await login(loginEmail, loginPassword, "lawyer");
      router.replace("/");
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ في تسجيل الدخول");
    } finally {
      setLoginLoading(false);
    }
  }

  // ── Register handler ─────────────────────────────────────────
  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.phone || !form.specialization || !form.licenseNumber || !form.bio) {
      setError("يرجى تعبئة جميع الحقول المطلوبة");
      return;
    }
    if (licenseState !== "valid") { setError("يرجى التحقق من رقم الترخيص أولاً"); return; }
    setError("");
    setRegLoading(true);
    try {
      await registerLawyer({
        ...form,
        experience: parseInt(form.experience) || 1,
        hourlyRate: parseInt(form.hourlyRate) || 150,
        termsAccepted: true,
        termsAcceptedAt: new Date().toISOString(),
      });
      router.replace("/");
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ في التسجيل");
    } finally {
      setRegLoading(false);
    }
  }

  const indicatorLeft = tabAnim.interpolate({ inputRange: [0, 1], outputRange: ["2%", "51%"] });

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0E1E3D" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ── Dark navy header ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color="rgba(255,255,255,0.7)" />
        </TouchableOpacity>

        <View style={styles.logoRow}>
          <Image source={LOGO} style={styles.logoImg} resizeMode="contain" />
          <View>
            <Text style={styles.logoTitle}>مستشارك</Text>
            <Text style={styles.logoSub}>بوابة المحامين</Text>
          </View>
        </View>

        {/* Security badge */}
        <View style={styles.badge}>
          <Feather name="shield" size={11} color={C.gold} />
          <Text style={styles.badgeText}>نظام آمن ومعتمد</Text>
        </View>
      </View>

      {/* ── Tab toggle ── */}
      <View style={styles.tabWrap}>
        <View style={styles.tabBar}>
          <Animated.View style={[styles.tabIndicator, { left: indicatorLeft }]} />
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab("login")} activeOpacity={0.8}>
            <Feather name="log-in" size={14} color={tab === "login" ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>تسجيل الدخول</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabBtn} onPress={() => switchTab("register")} activeOpacity={0.8}>
            <Feather name="user-plus" size={14} color={tab === "register" ? "#fff" : "rgba(255,255,255,0.5)"} />
            <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>محامٍ جديد</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Form card ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.card,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 28) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {!!error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {tab === "login" ? (
          <LoginForm
            email={loginEmail} setEmail={setLoginEmail}
            password={loginPassword} setPassword={setLoginPassword}
            showPass={showLoginPass} setShowPass={setShowLoginPass}
            loading={loginLoading} onSubmit={handleLogin}
            focusedField={focusedField} setFocusedField={setFocusedField}
            onGoRegister={() => switchTab("register")}
          />
        ) : (
          <RegisterForm
            form={form} setField={setField}
            showPass={showRegPass} setShowPass={setShowRegPass}
            licenseState={licenseState} checkLicense={checkLicense}
            uploadedDoc={uploadedDoc} pickDocument={pickDocument}
            loading={regLoading} onSubmit={handleRegister}
            focusedField={focusedField} setFocusedField={setFocusedField}
            onGoLogin={() => switchTab("login")}
          />
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ════════════════════════════════════════════════════════════════
// Login Form
// ════════════════════════════════════════════════════════════════
function LoginForm({
  email, setEmail, password, setPassword,
  showPass, setShowPass, loading, onSubmit,
  focusedField, setFocusedField, onGoRegister,
}: any) {
  return (
    <View style={{ gap: 20 }}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name="lock" size={16} color={C.gold} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>مرحباً بعودتك</Text>
          <Text style={styles.sectionSub}>ادخل بياناتك للوصول إلى لوحة تحكمك</Text>
        </View>
      </View>

      <GoldInput
        label="البريد الإلكتروني"
        icon="mail"
        fieldId="login-email"
        focusedField={focusedField}
        setFocusedField={setFocusedField}
      >
        <TextInput
          style={styles.input}
          placeholder="lawyer@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("login-email")}
          onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      <GoldInput
        label="كلمة المرور"
        icon="lock"
        fieldId="login-pass"
        focusedField={focusedField}
        setFocusedField={setFocusedField}
        right={
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.mutedForeground} />
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input}
          placeholder="••••••••"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!showPass}
          placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("login-pass")}
          onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      <TouchableOpacity
        style={[styles.goldBtn, loading && { opacity: 0.7 }]}
        onPress={onSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading
          ? <ActivityIndicator color={C.navy} />
          : <>
              <Feather name="log-in" size={16} color={C.navy} />
              <Text style={styles.goldBtnText}>دخول إلى لوحة التحكم</Text>
            </>
        }
      </TouchableOpacity>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>لا تملك حساباً؟</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.outlineBtn} onPress={onGoRegister} activeOpacity={0.8}>
        <Feather name="user-plus" size={15} color={C.navy} />
        <Text style={styles.outlineBtnText}>تسجيل كمحامٍ جديد</Text>
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// Register Form
// ════════════════════════════════════════════════════════════════
function RegisterForm({
  form, setField, showPass, setShowPass,
  licenseState, checkLicense,
  uploadedDoc, pickDocument,
  loading, onSubmit,
  focusedField, setFocusedField,
  onGoLogin,
}: any) {
  return (
    <View style={{ gap: 22 }}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name="award" size={16} color={C.gold} />
        </View>
        <View>
          <Text style={styles.sectionTitle}>انضم كمحامٍ معتمد</Text>
          <Text style={styles.sectionSub}>أكمل بياناتك للانضمام إلى شبكة مستشارك</Text>
        </View>
      </View>

      {/* Section: Personal */}
      <SectionLabel label="المعلومات الشخصية" icon="user" />

      <GoldInput label="الاسم الكامل" icon="user" fieldId="name" focusedField={focusedField} setFocusedField={setFocusedField}>
        <TextInput
          style={styles.input} placeholder="د. أحمد المحمود"
          value={form.name} onChangeText={(v: string) => setField("name", v)}
          placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("name")} onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      <GoldInput label="البريد الإلكتروني" icon="mail" fieldId="reg-email" focusedField={focusedField} setFocusedField={setFocusedField}>
        <TextInput
          style={styles.input} placeholder="lawyer@example.com"
          value={form.email} onChangeText={(v: string) => setField("email", v)}
          keyboardType="email-address" autoCapitalize="none" autoCorrect={false}
          placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("reg-email")} onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      <GoldInput
        label="كلمة المرور" icon="lock" fieldId="reg-pass"
        focusedField={focusedField} setFocusedField={setFocusedField}
        right={
          <TouchableOpacity onPress={() => setShowPass(!showPass)}>
            <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.mutedForeground} />
          </TouchableOpacity>
        }
      >
        <TextInput
          style={styles.input} placeholder="••••••••"
          value={form.password} onChangeText={(v: string) => setField("password", v)}
          secureTextEntry={!showPass} placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("reg-pass")} onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      <GoldInput label="رقم الجوال" icon="phone" fieldId="phone" focusedField={focusedField} setFocusedField={setFocusedField}>
        <TextInput
          style={styles.input} placeholder="+974 55 000 000"
          value={form.phone} onChangeText={(v: string) => setField("phone", v)}
          keyboardType="phone-pad" placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("phone")} onBlur={() => setFocusedField(null)}
        />
      </GoldInput>

      {/* Section: Country */}
      <SectionLabel label="الدولة" icon="map-pin" />
      <View style={styles.countryRow}>
        {(["qatar", "jordan"] as const).map((c) => (
          <TouchableOpacity
            key={c}
            style={[styles.countryBtn, form.country === c && styles.countryBtnActive]}
            onPress={() => { setField("country", c); }}
            activeOpacity={0.8}
          >
            <Text style={styles.countryFlag}>{c === "qatar" ? "🇶🇦" : "🇯🇴"}</Text>
            <Text style={[styles.countryLabel, form.country === c && styles.countryLabelActive]}>
              {c === "qatar" ? "قطر" : "الأردن"}
            </Text>
            {form.country === c && (
              <View style={styles.countryCheck}>
                <Feather name="check" size={10} color="#fff" />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Section: Specialization */}
      <SectionLabel label="التخصص القانوني" icon="book-open" />
      <View style={styles.specGrid}>
        {SPECIALIZATIONS.map((s) => {
          const active = form.specialization === s.label;
          return (
            <TouchableOpacity
              key={s.label}
              style={[styles.specChip, active && styles.specChipActive]}
              onPress={() => setField("specialization", s.label)}
              activeOpacity={0.75}
            >
              <Feather name={s.icon as any} size={13} color={active ? "#fff" : C.mutedForeground} />
              <Text style={[styles.specChipText, active && styles.specChipTextActive]}>{s.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Section: License */}
      <SectionLabel label="الترخيص والمصداقية" icon="shield" />

      <View style={styles.licenseHint}>
        <Feather name="info" size={12} color={C.gold} />
        <Text style={styles.licenseHintText}>
          {form.country === "qatar" ? "الصيغة: QAT-12345 أو 5-8 أرقام" : "الصيغة: JOR-12345 أو 5-8 أرقام"}
        </Text>
      </View>

      <View style={styles.licenseRow}>
        <View style={[
          styles.licenseInputWrap,
          licenseState === "valid" && styles.licenseValid,
          licenseState === "invalid" && styles.licenseInvalid,
          focusedField === "license" && styles.licenseInputFocus,
        ]}>
          <Feather
            name="file-text" size={16}
            color={licenseState === "valid" ? C.success : licenseState === "invalid" ? C.destructive : C.mutedForeground}
          />
          <TextInput
            style={styles.input}
            placeholder={form.country === "qatar" ? "QAT-12345" : "JOR-12345"}
            value={form.licenseNumber}
            onChangeText={(v: string) => setField("licenseNumber", v)}
            autoCapitalize="characters"
            placeholderTextColor={C.mutedForeground}
            onFocus={() => setFocusedField("license")} onBlur={() => setFocusedField(null)}
          />
          {licenseState === "valid" && <Feather name="check-circle" size={16} color={C.success} />}
          {licenseState === "invalid" && <Feather name="x-circle" size={16} color={C.destructive} />}
        </View>
        <TouchableOpacity
          style={[styles.verifyBtn, licenseState === "checking" && { opacity: 0.6 }]}
          onPress={checkLicense}
          disabled={licenseState === "checking"}
          activeOpacity={0.85}
        >
          {licenseState === "checking"
            ? <ActivityIndicator color="#fff" size="small" />
            : <Text style={styles.verifyText}>تحقق</Text>
          }
        </TouchableOpacity>
      </View>

      {licenseState === "valid" && (
        <View style={styles.licenseStatusRow}>
          <Feather name="check-circle" size={13} color={C.success} />
          <Text style={[styles.licenseStatusText, { color: C.success }]}>تم التحقق من رقم الترخيص بنجاح ✓</Text>
        </View>
      )}
      {licenseState === "invalid" && (
        <View style={styles.licenseStatusRow}>
          <Feather name="alert-circle" size={13} color={C.destructive} />
          <Text style={[styles.licenseStatusText, { color: C.destructive }]}>رقم الترخيص غير صحيح، يرجى المراجعة</Text>
        </View>
      )}

      {/* Document Upload */}
      <TouchableOpacity
        style={[styles.uploadBox, uploadedDoc && styles.uploadBoxDone]}
        onPress={pickDocument}
        activeOpacity={0.8}
      >
        {uploadedDoc ? (
          <View style={styles.uploadedContent}>
            <View style={styles.uploadedIconWrap}>
              <Feather name="check-circle" size={22} color={C.success} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.uploadedTitle}>تم رفع الوثيقة بنجاح</Text>
              <Text style={styles.uploadedName} numberOfLines={1}>{uploadedDoc.name}</Text>
            </View>
            <TouchableOpacity onPress={pickDocument} style={styles.changeDocBtn}>
              <Text style={styles.changeDocText}>تغيير</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.uploadIconWrap}>
              <Feather name="upload-cloud" size={28} color={C.gold} />
            </View>
            <Text style={styles.uploadTitle}>رفع بطاقة القيد / مزاولة المهنة</Text>
            <Text style={styles.uploadSub}>اضغط لاختيار صورة أو ملف PDF</Text>
            <View style={styles.uploadFormats}>
              {["JPG", "PNG", "PDF"].map((f) => (
                <View key={f} style={styles.formatTag}>
                  <Text style={styles.formatTagText}>{f}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </TouchableOpacity>

      {/* Professional details */}
      <SectionLabel label="التفاصيل المهنية" icon="briefcase" />

      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <GoldInput label="سنوات الخبرة" icon="clock" fieldId="exp" focusedField={focusedField} setFocusedField={setFocusedField}>
            <TextInput
              style={styles.input} placeholder="5"
              value={form.experience} onChangeText={(v: string) => setField("experience", v)}
              keyboardType="number-pad" placeholderTextColor={C.mutedForeground}
              onFocus={() => setFocusedField("exp")} onBlur={() => setFocusedField(null)}
            />
          </GoldInput>
        </View>
        <View style={{ flex: 1 }}>
          <GoldInput label={rateLabel(form.country)} icon="dollar-sign" fieldId="rate" focusedField={focusedField} setFocusedField={setFocusedField}>
            <TextInput
              style={styles.input} placeholder="200"
              value={form.hourlyRate} onChangeText={(v: string) => setField("hourlyRate", v)}
              keyboardType="number-pad" placeholderTextColor={C.mutedForeground}
              onFocus={() => setFocusedField("rate")} onBlur={() => setFocusedField(null)}
            />
          </GoldInput>
          {form.hourlyRate ? (
            <Text style={{ fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4 }}>
              صافي ربحك: {Math.round((parseInt(form.hourlyRate) || 0) * 0.85)} {rateLabel(form.country)} بعد خصم 15% عمولة المنصة
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>نبذة مختصرة عنك</Text>
        <TextInput
          style={[
            styles.textArea,
            focusedField === "bio" && styles.textAreaFocus,
          ]}
          placeholder="اكتب نبذة تعريفية تُبرز خبراتك القانونية وإنجازاتك..."
          value={form.bio}
          onChangeText={(v: string) => setField("bio", v)}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          placeholderTextColor={C.mutedForeground}
          onFocus={() => setFocusedField("bio")} onBlur={() => setFocusedField(null)}
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, (loading || licenseState !== "valid") && styles.submitBtnDisabled]}
        onPress={onSubmit}
        disabled={loading || licenseState !== "valid"}
        activeOpacity={0.85}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="send" size={16} color="#fff" />
            <Text style={styles.submitBtnText}>تقديم طلب الانضمام</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.securityNote}>
        <Feather name="lock" size={12} color={C.mutedForeground} />
        <Text style={styles.securityNoteText}>بياناتك محمية ومشفرة بالكامل · SSL 256-bit</Text>
      </View>

      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>لديك حساب؟</Text>
        <View style={styles.divider} />
      </View>

      <TouchableOpacity style={styles.outlineBtn} onPress={onGoLogin} activeOpacity={0.8}>
        <Feather name="log-in" size={15} color={C.navy} />
        <Text style={styles.outlineBtnText}>تسجيل الدخول</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Helpers ──────────────────────────────────────────────────────
function SectionLabel({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={styles.sectionLabelRow}>
      <View style={styles.sectionLabelLine} />
      <Feather name={icon as any} size={13} color={C.navy} />
      <Text style={styles.sectionLabelText}>{label}</Text>
    </View>
  );
}

function GoldInput({
  label, icon, fieldId, focusedField, setFocusedField, children, right,
}: {
  label: string; icon: string; fieldId: string;
  focusedField: string | null; setFocusedField: (v: string | null) => void;
  children: React.ReactNode; right?: React.ReactNode;
}) {
  const focused = focusedField === fieldId;
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.inputRow, focused && styles.inputRowFocus]}>
        <Feather name={icon as any} size={16} color={focused ? C.gold : C.mutedForeground} />
        {children}
        {right}
      </View>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════
// Styles
// ════════════════════════════════════════════════════════════════
const styles = StyleSheet.create({
  // Header
  topBar: {
    backgroundColor: "#0E1E3D",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 14,
  },
  backBtn: { alignSelf: "flex-end", padding: 4 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoImg: { width: 48, height: 48, borderRadius: 10 },
  logoTitle: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  logoSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  badge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(201,160,53,0.12)",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5,
  },
  badgeText: { fontSize: 11, color: C.gold, fontFamily: "Inter_600SemiBold" },

  // Tab bar
  tabWrap: { backgroundColor: "#0E1E3D", paddingHorizontal: 20, paddingBottom: 0 },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    padding: 3,
    position: "relative",
    marginBottom: -1,
  },
  tabIndicator: {
    position: "absolute",
    top: 3, bottom: 3,
    width: "47%",
    backgroundColor: C.navy,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: C.gold + "40",
  },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10,
  },
  tabText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.5)" },
  tabTextActive: { color: "#fff" },

  // Scroll / card
  scroll: { flex: 1, backgroundColor: C.background },
  card: { padding: 24, gap: 0 },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 12, padding: 14, marginBottom: 20,
  },
  errorText: { flex: 1, color: C.destructive, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "right" },

  // Section header
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 4 },
  sectionIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(201,160,53,0.1)",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.2)",
    alignItems: "center", justifyContent: "center",
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.foreground },
  sectionSub: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Section label
  sectionLabelRow: {
    flexDirection: "row", alignItems: "center", gap: 8,
    marginBottom: 10, marginTop: 4,
  },
  sectionLabelLine: { flex: 1, height: 1, backgroundColor: C.border },
  sectionLabelText: { fontSize: 12, fontFamily: "Inter_700Bold", color: C.navy },

  // Fields
  field: { gap: 6 },
  fieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  inputRowFocus: { borderColor: C.gold, backgroundColor: "#FFFCF3" },
  input: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },
  textArea: {
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular",
    textAlign: "right", minHeight: 96,
  },
  textAreaFocus: { borderColor: C.gold, backgroundColor: "#FFFCF3" },

  // Country
  countryRow: { flexDirection: "row", gap: 10 },
  countryBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  countryBtnActive: { borderColor: C.navy, backgroundColor: "#EEF2F8" },
  countryFlag: { fontSize: 20 },
  countryLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.mutedForeground },
  countryLabelActive: { color: C.navy },
  countryCheck: {
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
  },

  // Specialization
  specGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  specChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  specChipActive: { borderColor: C.navy, backgroundColor: C.navy },
  specChipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  specChipTextActive: { color: "#fff" },

  // License
  licenseHint: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#FEF9EC", borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 7,
    borderWidth: 1, borderColor: "rgba(201,160,53,0.25)",
  },
  licenseHintText: { fontSize: 12, color: C.gold, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right" },
  licenseRow: { flexDirection: "row", gap: 10 },
  licenseInputWrap: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  licenseInputFocus: { borderColor: C.gold, backgroundColor: "#FFFCF3" },
  licenseValid: { borderColor: C.success, backgroundColor: "#F0FDF4" },
  licenseInvalid: { borderColor: C.destructive, backgroundColor: "#FFF5F5" },
  licenseStatusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  licenseStatusText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  verifyBtn: {
    backgroundColor: C.navy, borderRadius: 12,
    paddingHorizontal: 16, alignItems: "center", justifyContent: "center", minWidth: 76,
  },
  verifyText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },

  // Upload
  uploadBox: {
    borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(201,160,53,0.35)",
    borderRadius: 16, paddingVertical: 28, paddingHorizontal: 20,
    alignItems: "center", gap: 8, backgroundColor: "#FFFCF3",
  },
  uploadBoxDone: { borderStyle: "solid", borderColor: C.success, backgroundColor: "#F0FDF4", paddingVertical: 16 },
  uploadIconWrap: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(201,160,53,0.12)",
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  uploadTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
  uploadSub: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  uploadFormats: { flexDirection: "row", gap: 6, marginTop: 4 },
  formatTag: {
    paddingHorizontal: 8, paddingVertical: 3,
    backgroundColor: "rgba(201,160,53,0.1)",
    borderRadius: 6, borderWidth: 1, borderColor: "rgba(201,160,53,0.2)",
  },
  formatTagText: { fontSize: 10, color: C.gold, fontFamily: "Inter_700Bold" },
  uploadedContent: { flexDirection: "row", alignItems: "center", gap: 12, width: "100%" },
  uploadedIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: "#DCFCE7", alignItems: "center", justifyContent: "center",
  },
  uploadedTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.success },
  uploadedName: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  changeDocBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: C.muted, borderRadius: 8 },
  changeDocText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: C.foreground },

  // Two columns
  twoCol: { flexDirection: "row", gap: 12 },

  // Buttons
  goldBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.gold, borderRadius: 14, paddingVertical: 15,
  },
  goldBtnText: { color: C.navy, fontSize: 15, fontFamily: "Inter_700Bold" },
  submitBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.navy, borderRadius: 14, paddingVertical: 16,
    borderWidth: 1, borderColor: "rgba(201,160,53,0.4)",
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  outlineBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.card, borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: C.navy,
  },
  outlineBtnText: { color: C.navy, fontSize: 14, fontFamily: "Inter_700Bold" },

  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divider: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  securityNote: {
    flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "center", marginTop: 4,
  },
  securityNoteText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
});
