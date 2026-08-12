import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { SocialProfile } from "@/hooks/useSocialAuth";

export type UserRole = "client" | "lawyer" | "admin";

export interface User {
  id: string; name: string; email: string; phone: string; role: UserRole;
  country: "qatar" | "jordan"; avatar?: string; socialProvider?: string;
  specialization?: string | null; licenseNumber?: string; licenseVerified?: boolean;
  bio?: string | null; experience?: number; rating?: number; reviewsCount?: number;
  hourlyRate?: number | null; available?: boolean;
  deletionPendingRequest?: boolean; deletionRejectionNote?: string;
}

type StoredUser = User & { password: string };

interface AuthContextValue {
  user: User | null; isLoading: boolean;
  login: (email: string, password: string, expectedRole?: "client" | "lawyer") => Promise<void>;
  loginWithSocial: (profile: SocialProfile, role: UserRole) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerLawyer: (data: RegisterLawyerData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<{ pendingFields: string[] }>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  getAuthToken: () => Promise<string | null>;
}

export interface RegisterClientData { name: string; email: string; password: string; phone: string; country: "qatar" | "jordan"; }
export interface RegisterLawyerData { name: string; email: string; password: string; phone: string; country: "qatar" | "jordan"; specialization: string; licenseNumber: string; bio: string; experience: number; hourlyRate: number; }

const STORAGE_KEY = "mustasharek_users_v2";
const SESSION_KEY = "mustasharek_session_v2";
const JWT_KEY = "mustasharek_jwt_v1";
const OTP_KEY = "mustasharek_reset_otp";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";
const normalizeEmail = (e: string) => e.trim().toLowerCase();

function decodeJwtUserId(token: string): string | null {
  try { const payload = token.split(".")[1]; const decoded = JSON.parse(atob(payload)) as { userId?: string }; return decoded.userId ?? null; } catch { return null; }
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
      if (Array.isArray(stored) && stored.length > 0) {
        const storedMap = new Map(stored.map((u) => [u.id, u]));
        for (const sample of SAMPLE_USERS) storedMap.set(sample.id, sample);
        const merged = Array.from(storedMap.values());
        await writeUsers(merged); return merged;
      }
    }
  } catch {}
  await writeUsers(SAMPLE_USERS); return [...SAMPLE_USERS];
}
async function writeUsers(users: StoredUser[]) { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users)); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { AsyncStorage.getItem(SESSION_KEY).then((raw) => { if (raw) try { setUser(JSON.parse(raw) as User); } catch {} }).finally(() => setIsLoading(false)); }, []);
  const persist = useCallback(async (u: User) => { await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u)); setUser(u); }, []);

  const syncDeletionStatus = useCallback(async (jwt: string, base: User): Promise<void> => {
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
    await new Promise((r) => setTimeout(r, 700));
    const email = normalizeEmail(emailRaw); const password = passwordRaw.trim();
    await AsyncStorage.removeItem(JWT_KEY).catch(() => {});
    const users = await readUsers();
    const localRecord = users.find((u) => normalizeEmail(u.email) === email);

    if (expectedRole && localRecord && localRecord.role !== expectedRole) {
      throw new Error(expectedRole === "client" ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي." : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل.");
    }

    if (API_BASE) {
      let serverRes: Response | null = null;
      try {
        serverRes = await fetch(`${API_BASE}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, ...(localRecord ? { name: localRecord.name, phone: localRecord.phone, country: localRecord.country, specialization: localRecord.specialization, bio: localRecord.bio, hourlyRate: localRecord.hourlyRate } : {}), ...(expectedRole ? { role: expectedRole } : localRecord ? { role: localRecord.role } : {}) }) });
      } catch {
        throw new Error("تعذر الاتصال بخدمة تسجيل الدخول. يرجى المحاولة مرة أخرى.");
      }
      if (serverRes !== null) {
        if (serverRes.ok) {
          const data = await serverRes.json() as { ok: boolean; jwt?: string; userId?: string; user?: { id: string; name: string; email: string; role: string; phone?: string | null; country?: string | null; specialization?: string | null; bio?: string | null; hourlyRate?: number | null } };
          if (data.ok && data.jwt) {
            const serverProfile = data.user;
            const serverRole = serverProfile?.role as UserRole | undefined;
            if (expectedRole && serverRole && serverRole !== expectedRole) {
              await AsyncStorage.removeItem(JWT_KEY).catch(() => {});
              throw new Error(expectedRole === "client" ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي." : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل.");
            }
            await AsyncStorage.setItem(JWT_KEY, data.jwt);
            const serverId = decodeJwtUserId(data.jwt) ?? data.userId ?? data.user?.id;
            const base: User = localRecord ? { ...localRecord, id: serverId ?? localRecord.id, name: serverProfile?.name ?? localRecord.name, role: (serverRole ?? localRecord.role) as UserRole, phone: serverProfile?.phone ?? localRecord.phone, country: (serverProfile?.country ?? localRecord.country) as User["country"] } : { id: serverId ?? email, name: serverProfile?.name ?? email.split("@")[0], email, role: (serverRole ?? "client") as UserRole, phone: serverProfile?.phone ?? "", country: (serverProfile?.country ?? "qatar") as User["country"], specialization: serverProfile?.specialization ?? null, bio: serverProfile?.bio ?? null, hourlyRate: serverProfile?.hourlyRate ?? null };
            if (serverId) {
              const idx = users.findIndex((u) => normalizeEmail(u.email) === email);
              if (idx !== -1) { users[idx] = { ...users[idx], id: serverId }; await writeUsers(users); }
              else if (!localRecord) await writeUsers([...users, { ...(base as User), password: "__server_auth__" }]);
            }
            await persist(base);
            if (base.role === "lawyer") await syncDeletionStatus(data.jwt, base);
            return;
          } else {
            throw new Error("تعذر إنشاء جلسة دخول آمنة. يرجى المحاولة مرة أخرى.");
          }
        }
        if (!serverRes.ok) {
          const errBody = await serverRes.json().catch(() => ({}) as Record<string, unknown>);
          const errCode = (errBody as { error?: string }).error ?? "";
          const errMsg = (errBody as { message?: string }).message ?? "";
          if (errCode === "social_account_only") throw new Error("هذا الحساب مرتبط بتسجيل دخول اجتماعي. يرجى استخدام Google أو Apple للدخول.");
          if (errCode === "account_terminated") throw new Error("تم إيقاف هذا الحساب. يرجى التواصل مع الدعم.");
          if (errCode === "account_permanently_deleted") throw new Error("تم حذف هذا الحساب نهائياً ولا يمكن استعادته.");
          if (serverRes.status === 401) throw new Error(users.some((u) => normalizeEmail(u.email) === email) ? "كلمة المرور غير صحيحة" : "البريد الإلكتروني غير مسجّل. يرجى إنشاء حساب جديد");
          throw new Error(errMsg || "تعذر الاتصال بخدمة تسجيل الدخول. يرجى المحاولة مرة أخرى.");
        }
      }
    }

    if (!localRecord || localRecord.password !== password) {
      if (users.some((u) => normalizeEmail(u.email) === email)) throw new Error("كلمة المرور غير صحيحة");
      throw new Error("البريد الإلكتروني غير مسجّل. يرجى إنشاء حساب جديد");
    }
    if (expectedRole && localRecord.role !== expectedRole) throw new Error(expectedRole === "client" ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي." : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل.");
    const { password: _, ...offlineSafe } = localRecord;
    await persist(offlineSafe);
  }, [persist, syncDeletionStatus]);

  const loginWithSocial = useCallback(async (profile: SocialProfile, role: UserRole) => {
    if (profile.jwt) await AsyncStorage.setItem(JWT_KEY, profile.jwt);
    const users = await readUsers(); const email = normalizeEmail(profile.email);
    const existing = users.find((u) => normalizeEmail(u.email) === email);
    if (existing) {
      if (existing.role !== role) { await AsyncStorage.removeItem(JWT_KEY).catch(() => {}); throw new Error(role === "client" ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي." : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل."); }
      const updated = { ...existing, socialProvider: profile.provider }; const { password: _, ...safe } = updated; await persist(safe); if (profile.jwt) await syncDeletionStatus(profile.jwt, safe); return;
    }
    const newUser: StoredUser = { id: `${profile.provider}-${Date.now()}`, name: profile.name, email: profile.email, phone: "", role, country: "qatar", socialProvider: profile.provider, password: "__social__", ...(role === "lawyer" ? { specialization: "", licenseVerified: false, rating: 0, reviewsCount: 0, hourlyRate: 150, available: true } : {}) };
    await writeUsers([...users, newUser]); const { password: _, ...safe } = newUser; await persist(safe);
  }, [persist, syncDeletionStatus]);

  const registerClient = useCallback(async (data: RegisterClientData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
    if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    await new Promise((r) => setTimeout(r, 900)); const email = normalizeEmail(data.email); const users = await readUsers();
    if (users.some((u) => normalizeEmail(u.email) === email)) throw new Error("هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟");
    let canonicalId = `client-${Date.now()}`; let storedJwt: string | null = null;
    if (API_BASE) { let serverRes: Response | null = null; try { serverRes = await fetch(`${API_BASE}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.name.trim(), email: data.email.trim(), password: data.password.trim(), phone: data.phone.trim(), country: data.country, role: "client" }) }); } catch {} if (serverRes !== null) { if (serverRes.ok) { const body = await serverRes.json() as { ok: boolean; jwt?: string; userId?: string }; if (body.ok && body.jwt) { const serverId = decodeJwtUserId(body.jwt) ?? body.userId; if (serverId) canonicalId = serverId; storedJwt = body.jwt; } } else if (serverRes.status >= 400 && serverRes.status < 500) { const errBody = await serverRes.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(errBody.message ?? errBody.error ?? "فشل في إنشاء الحساب. يرجى المحاولة مجدداً."); } } }
    if (storedJwt) await AsyncStorage.setItem(JWT_KEY, storedJwt);
    const newUser: StoredUser = { id: canonicalId, name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), role: "client", country: data.country, password: data.password.trim() };
    await writeUsers([...users, newUser]); const { password: _, ...safe } = newUser; await persist(safe);
  }, [persist]);

  const registerLawyer = useCallback(async (data: RegisterLawyerData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
    if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    await new Promise((r) => setTimeout(r, 1000)); const email = normalizeEmail(data.email); const users = await readUsers();
    if (users.some((u) => normalizeEmail(u.email) === email)) throw new Error("هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟");
    let canonicalId = `lawyer-${Date.now()}`; let storedJwt: string | null = null;
    if (API_BASE) { let serverRes: Response | null = null; try { serverRes = await fetch(`${API_BASE}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.name.trim(), email: data.email.trim(), password: data.password.trim(), phone: data.phone.trim(), country: data.country, role: "lawyer", specialization: data.specialization, bio: data.bio, hourlyRate: data.hourlyRate }) }); } catch {} if (serverRes !== null) { if (serverRes.ok) { const body = await serverRes.json() as { ok: boolean; jwt?: string; userId?: string }; if (body.ok && body.jwt) { const serverId = decodeJwtUserId(body.jwt) ?? body.userId; if (serverId) canonicalId = serverId; storedJwt = body.jwt; } } else if (serverRes.status >= 400 && serverRes.status < 500) { const errBody = await serverRes.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(errBody.message ?? errBody.error ?? "فشل في إنشاء الحساب. يرجى المحاولة مجدداً."); } } }
    if (storedJwt) await AsyncStorage.setItem(JWT_KEY, storedJwt);
    const newUser: StoredUser = { id: canonicalId, name: data.name.trim(), email: data.email.trim(), phone: data.phone.trim(), role: "lawyer", country: data.country, specialization: data.specialization, licenseNumber: data.licenseNumber, licenseVerified: true, bio: data.bio, experience: data.experience, rating: 0, reviewsCount: 0, hourlyRate: data.hourlyRate, available: true, password: data.password.trim() };
    await writeUsers([...users, newUser]); const { password: _, ...safe } = newUser; await persist(safe);
  }, [persist]);

  const logout = useCallback(async () => { await AsyncStorage.multiRemove([SESSION_KEY, JWT_KEY]); setUser(null); }, []);
  const getAuthToken = useCallback(async (): Promise<string | null> => { try { return await AsyncStorage.getItem(JWT_KEY); } catch { return null; } }, []);

  const deleteAccount = useCallback(async () => {
    if (!user) return;
    if (user.role === "client") {
      const token = await getAuthToken(); if (token && API_BASE) { const res = await fetch(`${API_BASE}/profile`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) { const data = await res.json().catch(() => ({}) as Record<string, string>); throw new Error((data as any).message || "فشل في حذف الحساب"); } }
      const users = await readUsers(); await writeUsers(users.filter((u) => u.id !== user.id)); await AsyncStorage.multiRemove([SESSION_KEY, JWT_KEY]); setUser(null);
    } else if (user.role === "lawyer") {
      const token = await getAuthToken(); if (token && API_BASE) { const res = await fetch(`${API_BASE}/profile/deletion-request`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }); if (!res.ok) { const data = await res.json().catch(() => ({})); const errMsg = (data as any).error as string ?? ""; if (!errMsg.includes("قيد المراجعة")) throw new Error(errMsg || "فشل في تقديم طلب الحذف"); } }
      const updatedUser: User = { ...user, deletionPendingRequest: true }; await persist(updatedUser); const users = await readUsers(); const idx = users.findIndex((u) => u.id === user.id); if (idx !== -1) { (users[idx] as any).deletionPendingRequest = true; await writeUsers(users); }
    }
  }, [user, getAuthToken, persist]);

  const updateUser = useCallback(async (updates: Partial<User>): Promise<{ pendingFields: string[] }> => {
    if (!user) return { pendingFields: [] };
    const MODERATED: (keyof User)[] = ["specialization", "bio", "hourlyRate"]; let pendingFields: string[] = [];
    const token = await getAuthToken();
    if (token && API_BASE) {
      const apiUpdates: Record<string, unknown> = {}; if (updates.name !== undefined) apiUpdates.name = updates.name; if (updates.phone !== undefined) apiUpdates.phone = updates.phone; if (updates.country !== undefined) apiUpdates.country = updates.country; if (updates.specialization !== undefined) apiUpdates.specialization = updates.specialization; if (updates.bio !== undefined) apiUpdates.bio = updates.bio; if (updates.hourlyRate !== undefined) apiUpdates.hourlyRate = updates.hourlyRate;
      if (Object.keys(apiUpdates).length > 0) { const res = await fetch(`${API_BASE}/profile`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(apiUpdates) }); if (!res.ok) { const body = await res.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(body.message ?? body.error ?? "فشل تحديث الملف الشخصي"); } const body = await res.json().catch(() => ({})) as { pendingFields?: string[] }; pendingFields = body.pendingFields ?? []; }
    }
    const localUpdates = { ...updates }; for (const field of MODERATED) if (pendingFields.includes(field as string)) delete localUpdates[field];
    const updated: User = { ...user, ...localUpdates }; await persist(updated); const users = await readUsers(); const idx = users.findIndex((u) => u.id === user.id); if (idx !== -1) { users[idx] = { ...users[idx], ...localUpdates }; await writeUsers(users); }
    return { pendingFields };
  }, [user, persist, getAuthToken]);

  const requestPasswordReset = useCallback(async (emailRaw: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 900)); const email = normalizeEmail(emailRaw); const users = await readUsers(); if (!users.some((u) => normalizeEmail(u.email) === email)) throw new Error("لا يوجد حساب مرتبط بهذا البريد الإلكتروني");
    const otp = String(Math.floor(100000 + Math.random() * 900000)); await AsyncStorage.setItem(OTP_KEY, JSON.stringify({ email, otp, expiresAt: Date.now() + 10 * 60 * 1000 })); return otp;
  }, []);

  const resetPassword = useCallback(async (emailRaw: string, otp: string, newPassword: string) => {
    await new Promise((r) => setTimeout(r, 700)); const email = normalizeEmail(emailRaw); const raw = await AsyncStorage.getItem(OTP_KEY); if (!raw) throw new Error("لم يتم طلب استعادة كلمة المرور");
    const record = JSON.parse(raw) as { email: string; otp: string; expiresAt: number }; if (record.email !== email) throw new Error("البريد الإلكتروني غير متطابق"); if (record.otp !== otp.trim()) throw new Error("رمز التحقق غير صحيح"); if (Date.now() > record.expiresAt) throw new Error("انتهت صلاحية الرمز. يرجى طلب رمز جديد"); if (newPassword.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    const users = await readUsers(); const idx = users.findIndex((u) => normalizeEmail(u.email) === email); if (idx === -1) throw new Error("المستخدم غير موجود"); users[idx].password = newPassword.trim(); await writeUsers(users); await AsyncStorage.removeItem(OTP_KEY);
  }, []);

  return <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, registerClient, registerLawyer, logout, deleteAccount, updateUser, requestPasswordReset, resetPassword, getAuthToken }}>{children}</AuthContext.Provider>;
}

export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used within AuthProvider"); return ctx; }
