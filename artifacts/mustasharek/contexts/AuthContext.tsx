import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SocialProfile } from "@/hooks/useSocialAuth";

export type UserRole = "client" | "lawyer" | "admin";
export type RecoveryChannel = "email" | "whatsapp";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  country: "qatar" | "jordan";
  avatar?: string;
  socialProvider?: string;
  specialization?: string | null;
  licenseNumber?: string;
  licenseVerified?: boolean;
  bio?: string | null;
  experience?: number;
  rating?: number;
  reviewsCount?: number;
  hourlyRate?: number | null;
  available?: boolean;
  deletionPendingRequest?: boolean;
  deletionRejectionNote?: string;
}

type StoredUser = User & { password: string };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, expectedRole?: "client" | "lawyer") => Promise<void>;
  loginWithSocial: (profile: SocialProfile, role: UserRole) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerLawyer: (data: RegisterLawyerData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ pendingFields: string[] }>;
  requestPasswordReset: (email: string, channel?: RecoveryChannel) => Promise<{ message: string; developmentOtp?: string; channel: RecoveryChannel }>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

export interface RegisterClientData {
  name: string; email: string; password: string; phone: string; country: "qatar" | "jordan";
}

export interface RegisterLawyerData {
  name: string; email: string; password: string; phone: string; country: "qatar" | "jordan";
  specialization: string; licenseNumber: string; bio: string; experience: number; hourlyRate: number;
}

const STORAGE_KEY = "mustasharek_users_v2";
const SESSION_KEY = "mustasharek_session_v2";
const JWT_KEY = "mustasharek_jwt_v1";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";
const normalizeEmail = (value: string) => value.trim().toLowerCase();

function decodeJwtUserId(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    return (JSON.parse(atob(payload)) as { userId?: string }).userId ?? null;
  } catch {
    return null;
  }
}

const SAMPLE_USERS: StoredUser[] = [
  { id: "client-demo", name: "أحمد الكواري", email: "ahmed@example.com", password: "123456", phone: "+97455123456", role: "client", country: "qatar" },
  { id: "lawyer-demo", name: "د. فاطمة الزهراني", email: "fatima@example.com", password: "123456", phone: "+97455234567", role: "lawyer", country: "qatar", specialization: "قانون تجاري", licenseNumber: "QAT-12345", licenseVerified: true, bio: "محامية متخصصة في القانون التجاري وعقود الأعمال مع خبرة 12 عاماً في المحاكم القطرية.", experience: 12, rating: 4.9, reviewsCount: 87, hourlyRate: 300, available: true },
  { id: "client-test", name: "عميل تجريبي", email: "client@mustashark.com", password: "test1234", phone: "+97450000001", role: "client", country: "qatar" },
  { id: "lawyer-test", name: "د. محامٍ تجريبي", email: "lawyer@mustashark.com", password: "test1234", phone: "+97450000002", role: "lawyer", country: "qatar", specialization: "قانون تجاري", licenseNumber: "QAT-99999", licenseVerified: true, bio: "حساب تجريبي لاختبار لوحة تحكم المحامي وجميع ميزات التطبيق.", experience: 5, rating: 4.5, reviewsCount: 20, hourlyRate: 200, available: true },
  { id: "admin-test", name: "مدير النظام", email: "admin@mustashark.com", password: "test1234", phone: "+97450000000", role: "admin", country: "qatar" },
];

const AuthContext = createContext<AuthContextValue | null>(null);

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(stored) && stored.length) {
        const map = new Map(stored.map((u) => [u.id, u]));
        for (const sample of SAMPLE_USERS) map.set(sample.id, sample);
        const merged = [...map.values()];
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        return merged;
      }
    }
  } catch {}
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SAMPLE_USERS));
  return [...SAMPLE_USERS];
}

async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function portalMismatch(role: "client" | "lawyer") {
  return role === "client"
    ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي."
    : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل.";
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => { if (raw) try { setUser(JSON.parse(raw) as User); } catch {} })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (next: User) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    setUser(next);
  }, []);

  const getAuthToken = useCallback(async () => {
    try { return await AsyncStorage.getItem(JWT_KEY); } catch { return null; }
  }, []);

  const syncDeletionStatus = useCallback(async (jwt: string, base: User) => {
    if (!API_BASE) return;
    try {
      const res = await fetch(`${API_BASE}/profile/deletion-status`, { headers: { Authorization: `Bearer ${jwt}` } });
      if (!res.ok) return;
      const status = await res.json() as { deletionPendingRequest?: boolean; deletionRejectionNote?: string | null };
      await persist({ ...base, deletionPendingRequest: status.deletionPendingRequest ?? false, deletionRejectionNote: status.deletionRejectionNote ?? undefined });
    } catch {}
  }, [persist]);

  const login = useCallback(async (emailRaw: string, passwordRaw: string, expectedRole?: "client" | "lawyer") => {
    if (!emailRaw.trim() || !passwordRaw) throw new Error("يرجى تعبئة البريد الإلكتروني وكلمة المرور");
    const email = normalizeEmail(emailRaw);
    const password = passwordRaw.trim();
    await AsyncStorage.removeItem(JWT_KEY).catch(() => {});
    const users = await readUsers();
    const localRecord = users.find((u) => normalizeEmail(u.email) === email);

    if (expectedRole && localRecord && localRecord.role !== expectedRole) throw new Error(portalMismatch(expectedRole));

    if (API_BASE) {
      let response: Response | null = null;
      try {
        response = await fetch(`${API_BASE}/auth/local-auth`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, ...(localRecord ? { name: localRecord.name, role: localRecord.role } : {}) }),
        });
      } catch {}

      if (response) {
        if (response.ok) {
          const data = await response.json() as {
            ok: boolean; jwt?: string; userId?: string;
            user?: { id: string; name: string; email: string; role: string; phone?: string | null; country?: string | null; specialization?: string | null; bio?: string | null; hourlyRate?: number | null };
          };
          if (data.ok && data.jwt) {
            const serverRole = data.user?.role as UserRole | undefined;
            if (expectedRole && serverRole && serverRole !== expectedRole) throw new Error(portalMismatch(expectedRole));
            await AsyncStorage.setItem(JWT_KEY, data.jwt);
            const serverId = decodeJwtUserId(data.jwt) ?? data.userId ?? data.user?.id;
            const base: User = localRecord
              ? { ...localRecord, id: serverId ?? localRecord.id, name: data.user?.name ?? localRecord.name, role: (serverRole ?? localRecord.role) as UserRole, phone: data.user?.phone ?? localRecord.phone, country: (data.user?.country ?? localRecord.country) as User["country"] }
              : { id: serverId ?? email, name: data.user?.name ?? email.split("@")[0], email, role: (serverRole ?? "client") as UserRole, phone: data.user?.phone ?? "", country: (data.user?.country ?? "qatar") as User["country"], specialization: data.user?.specialization ?? null, bio: data.user?.bio ?? null, hourlyRate: data.user?.hourlyRate ?? null };
            await persist(base);
            if (base.role === "lawyer") await syncDeletionStatus(data.jwt, base);
            return;
          }
        }
        if (response.status < 500) {
          const body = await response.json().catch(() => ({})) as { error?: string; message?: string };
          if (body.error === "social_account_only") throw new Error("هذا الحساب مرتبط بتسجيل دخول اجتماعي. يرجى استخدام Google أو Apple للدخول.");
          if (body.error === "account_terminated") throw new Error("تم إيقاف هذا الحساب. يرجى التواصل مع الدعم.");
          if (response.status === 401) throw new Error(localRecord ? "كلمة المرور غير صحيحة" : "البريد الإلكتروني غير مسجّل. يرجى إنشاء حساب جديد");
          throw new Error(body.message ?? "فشل تسجيل الدخول. يرجى المحاولة مجدداً.");
        }
      }
    }

    if (!localRecord || localRecord.password !== password) throw new Error(localRecord ? "كلمة المرور غير صحيحة" : "البريد الإلكتروني غير مسجّل. يرجى إنشاء حساب جديد");
    if (expectedRole && localRecord.role !== expectedRole) throw new Error(portalMismatch(expectedRole));
    const { password: _, ...safe } = localRecord;
    await persist(safe);
  }, [persist, syncDeletionStatus]);

  const loginWithSocial = useCallback(async (profile: SocialProfile, role: UserRole) => {
    if (profile.jwt) await AsyncStorage.setItem(JWT_KEY, profile.jwt);
    const users = await readUsers();
    const email = normalizeEmail(profile.email);
    const existing = users.find((u) => normalizeEmail(u.email) === email);
    if (existing && existing.role !== role && existing.role !== "admin") {
      await AsyncStorage.removeItem(JWT_KEY).catch(() => {});
      throw new Error(portalMismatch(role));
    }
    if (existing) {
      const updated = { ...existing, socialProvider: profile.provider };
      const { password: _, ...safe } = updated;
      await persist(safe);
      if (profile.jwt) await syncDeletionStatus(profile.jwt, safe);
      return;
    }
    const newUser: StoredUser = { id: `${profile.provider}-${Date.now()}`, name: profile.name, email: profile.email, phone: "", role, country: "qatar", socialProvider: profile.provider, password: "__social__", ...(role === "lawyer" ? { specialization: "", licenseVerified: false, rating: 0, reviewsCount: 0, hourlyRate: 150, available: true } : {}) };
    await writeUsers([...users, newUser]);
    const { password: _, ...safe } = newUser;
    await persist(safe);
  }, [persist, syncDeletionStatus]);

  const registerClient = useCallback(async (data: RegisterClientData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
    if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    const email = normalizeEmail(data.email);
    const users = await readUsers();
    if (users.some((u) => normalizeEmail(u.email) === email)) throw new Error("هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟");
    let id = `client-${Date.now()}`; let jwt: string | undefined;
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, name: data.name.trim(), email, password: data.password.trim(), phone: data.phone.trim(), role: "client" }) });
        if (res.ok) { const body = await res.json() as { jwt?: string; userId?: string }; jwt = body.jwt; id = body.userId ?? (body.jwt ? decodeJwtUserId(body.jwt) ?? id : id); }
        else if (res.status < 500) { const body = await res.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(body.message ?? body.error ?? "فشل في إنشاء الحساب"); }
      } catch (error) { if (error instanceof Error && !/fetch|network|failed/i.test(error.message)) throw error; }
    }
    if (jwt) await AsyncStorage.setItem(JWT_KEY, jwt);
    const newUser: StoredUser = { id, name: data.name.trim(), email, password: data.password.trim(), phone: data.phone.trim(), role: "client", country: data.country };
    await writeUsers([...users, newUser]);
    const { password: _, ...safe } = newUser;
    await persist(safe);
  }, [persist]);

  const registerLawyer = useCallback(async (data: RegisterLawyerData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
    if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    const email = normalizeEmail(data.email);
    const users = await readUsers();
    if (users.some((u) => normalizeEmail(u.email) === email)) throw new Error("هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟");
    let id = `lawyer-${Date.now()}`; let jwt: string | undefined;
    if (API_BASE) {
      try {
        const res = await fetch(`${API_BASE}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, name: data.name.trim(), email, password: data.password.trim(), phone: data.phone.trim(), role: "lawyer" }) });
        if (res.ok) { const body = await res.json() as { jwt?: string; userId?: string }; jwt = body.jwt; id = body.userId ?? (body.jwt ? decodeJwtUserId(body.jwt) ?? id : id); }
        else if (res.status < 500) { const body = await res.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(body.message ?? body.error ?? "فشل في إنشاء الحساب"); }
      } catch (error) { if (error instanceof Error && !/fetch|network|failed/i.test(error.message)) throw error; }
    }
    if (jwt) await AsyncStorage.setItem(JWT_KEY, jwt);
    const newUser: StoredUser = { id, name: data.name.trim(), email, password: data.password.trim(), phone: data.phone.trim(), role: "lawyer", country: data.country, specialization: data.specialization, licenseNumber: data.licenseNumber, licenseVerified: true, bio: data.bio, experience: data.experience, rating: 0, reviewsCount: 0, hourlyRate: data.hourlyRate, available: true };
    await writeUsers([...users, newUser]);
    const { password: _, ...safe } = newUser;
    await persist(safe);
  }, [persist]);

  const logout = useCallback(async () => { await AsyncStorage.multiRemove([SESSION_KEY, JWT_KEY]); setUser(null); }, []);

  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) return { pendingFields: [] };
    const moderated: (keyof User)[] = ["specialization", "bio", "hourlyRate"];
    let pendingFields: string[] = [];
    const token = await getAuthToken();
    if (token && API_BASE) {
      const apiUpdates: Record<string, unknown> = {};
      for (const field of ["name", "phone", "country", "specialization", "bio", "hourlyRate"] as const) if (updates[field] !== undefined) apiUpdates[field] = updates[field];
      if (Object.keys(apiUpdates).length) {
        const res = await fetch(`${API_BASE}/profile`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(apiUpdates) });
        if (!res.ok) { const body = await res.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(body.message ?? body.error ?? "فشل تحديث الملف الشخصي"); }
        pendingFields = ((await res.json().catch(() => ({}))) as { pendingFields?: string[] }).pendingFields ?? [];
      }
    }
    const localUpdates = { ...updates };
    for (const field of moderated) if (pendingFields.includes(field)) delete localUpdates[field];
    const updated = { ...user, ...localUpdates };
    await persist(updated);
    const users = await readUsers();
    const index = users.findIndex((u) => u.id === user.id);
    if (index >= 0) { users[index] = { ...users[index], ...localUpdates }; await writeUsers(users); }
    return { pendingFields };
  }, [user, persist, getAuthToken]);

  const requestPasswordReset = useCallback(async (emailRaw: string, channel: RecoveryChannel = "email") => {
    const email = normalizeEmail(emailRaw);
    if (!email) throw new Error("يرجى إدخال البريد الإلكتروني");
    if (!API_BASE) throw new Error("خدمة استعادة كلمة المرور غير متاحة حالياً");
    const res = await fetch(`${API_BASE}/auth/password-reset/request`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, channel }) });
    const body = await res.json().catch(() => ({})) as { message?: string; error?: string; developmentOtp?: string; channel?: RecoveryChannel };
    if (!res.ok) throw new Error(body.message ?? "تعذر إرسال رمز الاستعادة. يرجى المحاولة لاحقاً.");
    return { message: body.message ?? "تم إرسال رمز التحقق.", developmentOtp: body.developmentOtp, channel: body.channel ?? channel };
  }, []);

  const resetPassword = useCallback(async (emailRaw: string, otp: string, newPassword: string) => {
    const email = normalizeEmail(emailRaw);
    if (newPassword.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (!API_BASE) throw new Error("خدمة استعادة كلمة المرور غير متاحة حالياً");
    const res = await fetch(`${API_BASE}/auth/password-reset/confirm`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, otp: otp.trim(), newPassword: newPassword.trim() }) });
    const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
    if (!res.ok) throw new Error(body.message ?? "رمز التحقق غير صحيح أو منتهي الصلاحية.");
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    const token = await getAuthToken();
    if (user.role === "client") {
      if (token && API_BASE) { const res = await fetch(`${API_BASE}/profile`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) throw new Error("فشل في حذف الحساب"); }
      await AsyncStorage.multiRemove([SESSION_KEY, JWT_KEY]); setUser(null);
    } else if (user.role === "lawyer") {
      if (token && API_BASE) { const res = await fetch(`${API_BASE}/profile/deletion-request`, { method: "POST", headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) { const body = await res.json().catch(() => ({})) as { error?: string }; if (!body.error?.includes("قيد المراجعة")) throw new Error(body.error ?? "فشل في تقديم طلب الحذف"); } }
      await persist({ ...user, deletionPendingRequest: true });
    }
  }, [user, getAuthToken, persist]);

  return <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, registerClient, registerLawyer, logout, updateUser, requestPasswordReset, resetPassword, deleteAccount, getAuthToken }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
