import { useCallback, useContext, createContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { SocialProfile } from "@/hooks/useSocialAuth";

export type UserRole = "client" | "lawyer" | "admin";
export interface User { id: string; name: string; email: string; phone: string; role: UserRole; country: "qatar" | "jordan"; avatar?: string; socialProvider?: string; specialization?: string | null; licenseNumber?: string; licenseVerified?: boolean; bio?: string | null; experience?: number; rating?: number; reviewsCount?: number; hourlyRate?: number | null; available?: boolean; deletionPendingRequest?: boolean; deletionRejectionNote?: string; }
interface AuthContextValue { user: User | null; isLoading: boolean; login: (email: string, password: string, expectedRole?: "client" | "lawyer") => Promise<void>; loginWithSocial: (profile: SocialProfile, role: UserRole) => Promise<void>; registerClient: (data: RegisterClientData) => Promise<void>; registerLawyer: (data: RegisterLawyerData) => Promise<void>; logout: () => Promise<void>; updateUser: (updates: Partial<User>) => Promise<{ pendingFields: string[] }>; requestPasswordReset: (email: string) => Promise<string>; resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>; deleteAccount: () => Promise<void>; getAuthToken: () => Promise<string | null>; ensureAuthToken: () => Promise<string | null>; }
export interface RegisterClientData { name: string; email: string; password: string; phone: string; country: "qatar" | "jordan"; }
export interface RegisterLawyerData { name: string; email: string; password: string; phone: string; country: "qatar" | "jordan"; specialization: string; licenseNumber: string; bio: string; experience: number; hourlyRate: number; termsAccepted?: boolean; termsAcceptedAt?: string; }

const SESSION_KEY = "mustasharek_session_v2";
const JWT_KEY = "mustasharek_jwt_v1";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";
const normalizeEmail = (e: string) => e.trim().toLowerCase();
const roleMismatch = (role: "client" | "lawyer") => role === "client" ? "هذا الحساب مخصص للمحامين. يرجى استخدام بوابة المحامي." : "هذا الحساب مخصص للعملاء. يرجى استخدام بوابة العميل.";
function decodeJwtUserId(token: string): string | null { try { const payload = token.split(".")[1]; const decoded = JSON.parse(atob(payload)) as { userId?: string }; return decoded.userId ?? null; } catch { return null; } }
async function requireApi(): Promise<string> { if (!API_BASE) throw new Error("خدمة المصادقة غير مهيأة. لا يمكن المتابعة بدون الخادم."); return API_BASE; }
async function jsonError(res: Response, fallback: string): Promise<never> { const body = await res.json().catch(() => ({})) as { message?: string; error?: string }; throw new Error(body.message ?? body.error ?? fallback); }

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null); const [isLoading, setIsLoading] = useState(true);
  useEffect(() => { AsyncStorage.getItem(JWT_KEY).then(async (token) => { if (!token) { await AsyncStorage.removeItem(SESSION_KEY); return; } const raw = await AsyncStorage.getItem(SESSION_KEY); if (raw) { try { setUser(JSON.parse(raw) as User); } catch { await AsyncStorage.removeItem(SESSION_KEY); } } }).finally(() => setIsLoading(false)); }, []);
  const persist = useCallback(async (u: User, jwt?: string) => { if (jwt) await AsyncStorage.setItem(JWT_KEY, jwt); await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u)); setUser(u); }, []);
  const syncDeletionStatus = useCallback(async (jwt: string, base: User) => { if (!API_BASE || base.role !== "lawyer") return; try { const res = await fetch(`${API_BASE}/profile/deletion-status`, { headers: { Authorization: `Bearer ${jwt}` } }); if (!res.ok) return; const status = await res.json() as { deletionPendingRequest?: boolean; deletionRejectionNote?: string | null }; await persist({ ...base, deletionPendingRequest: status.deletionPendingRequest ?? false, deletionRejectionNote: status.deletionRejectionNote ?? undefined }); } catch {} }, [persist]);

  const login = useCallback(async (emailRaw: string, passwordRaw: string, expectedRole?: "client" | "lawyer") => {
    if (!emailRaw.trim() || !passwordRaw) throw new Error("يرجى تعبئة البريد الإلكتروني وكلمة المرور");
    const api = await requireApi(); const email = normalizeEmail(emailRaw); await AsyncStorage.multiRemove([JWT_KEY, SESSION_KEY]).catch(() => {});
    let res: Response; try { res = await fetch(`${api}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: passwordRaw.trim(), ...(expectedRole ? { role: expectedRole } : {}) }) }); } catch { throw new Error("تعذر الاتصال بخدمة تسجيل الدخول. لا يمكن المتابعة بدون الخادم."); }
    if (!res.ok) { const body = await res.json().catch(() => ({})) as { error?: string; message?: string }; if (body.error === "role_mismatch") throw new Error(body.message ?? roleMismatch(expectedRole ?? "client")); if (body.error === "social_account_only") throw new Error("هذا الحساب مرتبط بتسجيل دخول اجتماعي. يرجى استخدام Google أو Apple للدخول."); if (body.error === "account_permanently_deleted") throw new Error(body.message ?? "تم حذف هذا الحساب نهائياً ولا يمكن استعادته."); if (body.error === "account_terminated") throw new Error(body.message ?? "تم إيقاف هذا الحساب. يرجى التواصل مع الدعم."); if (body.error === "lawyer_verification_pending") throw new Error(body.message ?? "حساب المحامي قيد التحقق من الإدارة."); if (res.status === 401) throw new Error("بيانات تسجيل الدخول غير صحيحة"); throw new Error(body.message ?? body.error ?? "تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى."); }
    const data = await res.json() as { ok: boolean; jwt?: string; userId?: string; user?: Record<string, unknown> }; if (!data.ok || !data.jwt) throw new Error("لم يُصدر الخادم جلسة مصادقة صالحة."); const p = data.user ?? {}; const role = p.role as UserRole; if (expectedRole && role !== expectedRole) { await AsyncStorage.multiRemove([JWT_KEY, SESSION_KEY]); throw new Error(roleMismatch(expectedRole)); }
    const base: User = { id: (p.id as string | undefined) ?? data.userId ?? decodeJwtUserId(data.jwt) ?? "", name: (p.name as string | undefined) ?? email.split("@")[0], email: (p.email as string | undefined) ?? email, role, phone: (p.phone as string | null | undefined) ?? "", country: (p.country as User["country"] | null | undefined) ?? "qatar", specialization: (p.specialization as string | null | undefined) ?? null, bio: (p.bio as string | null | undefined) ?? null, hourlyRate: (p.hourlyRate as number | null | undefined) ?? null, socialProvider: p.authProvider as string | undefined, deletionRejectionNote: (p.deletionRejectionNote as string | null | undefined) ?? undefined };
    await persist(base, data.jwt); await syncDeletionStatus(data.jwt, base);
  }, [persist, syncDeletionStatus]);

  const getAuthToken = useCallback(async () => AsyncStorage.getItem(JWT_KEY).catch(() => null), []);
  const ensureAuthToken = useCallback(async () => getAuthToken(), [getAuthToken]);

  const loginWithSocial = useCallback(async (profile: SocialProfile, role: UserRole) => {
    if (!profile.jwt) throw new Error("لم تُكمل المصادقة مع الخادم. لا يمكن تسجيل الدخول بدون JWT صادر من الخادم.");
    const api = await requireApi(); let res: Response; try { res = await fetch(`${api}/auth/social`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ provider: profile.provider, token: profile.jwt, role }) }); } catch { throw new Error("تعذر الاتصال بخدمة المصادقة."); }
    if (!res.ok) await jsonError(res, "فشل تسجيل الدخول الاجتماعي."); const data = await res.json() as { ok: boolean; jwt?: string; user?: Record<string, unknown> }; if (!data.ok || !data.jwt) throw new Error("لم يُصدر الخادم جلسة مصادقة صالحة."); const p = data.user ?? {}; const serverRole = p.role as UserRole; if (serverRole !== role && serverRole !== "admin") throw new Error(roleMismatch(role as "client" | "lawyer"));
    const base: User = { id: (p.id as string) ?? "", name: (p.name as string) ?? profile.name, email: (p.email as string) ?? normalizeEmail(profile.email), phone: (p.phone as string | null) ?? "", role: serverRole, country: (p.country as User["country"] | null) ?? "qatar", socialProvider: (p.authProvider as string) ?? profile.provider, specialization: (p.specialization as string | null) ?? null, bio: (p.bio as string | null) ?? null, hourlyRate: (p.hourlyRate as number | null) ?? null, deletionRejectionNote: (p.deletionRejectionNote as string | null) ?? undefined };
    await persist(base, data.jwt); await syncDeletionStatus(data.jwt, base);
  }, [persist, syncDeletionStatus]);

  const registerClient = useCallback(async (data: RegisterClientData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) throw new Error("يرجى تعبئة جميع الحقول المطلوبة"); if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); const api = await requireApi(); let res: Response;
    try { res = await fetch(`${api}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, name: data.name.trim(), email: data.email.trim(), password: data.password.trim(), phone: data.phone.trim(), role: "client" }) }); } catch { throw new Error("تعذر الاتصال بخدمة التسجيل. لم يتم إنشاء الحساب."); }
    if (!res.ok) await jsonError(res, "فشل إنشاء الحساب."); const body = await res.json() as { ok?: boolean; jwt?: string; userId?: string; user?: Record<string, unknown> }; if (!body.ok || !body.jwt) throw new Error("لم يُصدر الخادم جلسة مصادقة صالحة."); const p = body.user ?? {}; const base: User = { id: (p.id as string) ?? body.userId ?? decodeJwtUserId(body.jwt) ?? "", name: (p.name as string) ?? data.name.trim(), email: (p.email as string) ?? normalizeEmail(data.email), phone: (p.phone as string) ?? data.phone.trim(), role: "client", country: (p.country as User["country"]) ?? data.country }; await persist(base, body.jwt);
  }, [persist]);

  const registerLawyer = useCallback(async (data: RegisterLawyerData) => {
    if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim() || !data.specialization || !data.licenseNumber || !data.bio) throw new Error("يرجى تعبئة جميع الحقول المطلوبة"); if (data.password.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل"); const api = await requireApi(); let res: Response;
    try { res = await fetch(`${api}/auth/local-auth`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...data, name: data.name.trim(), email: data.email.trim(), password: data.password.trim(), phone: data.phone.trim(), role: "lawyer", termsAccepted: data.termsAccepted, termsAcceptedAt: data.termsAcceptedAt }) }); } catch { throw new Error("تعذر الاتصال بخدمة التسجيل. لم يتم إنشاء طلب المحامي."); }
    const body = await res.json().catch(() => ({})) as { ok?: boolean; accountStatus?: string; message?: string; error?: string }; if (res.status !== 202 || !body.ok || body.accountStatus !== "pending") throw new Error(body.message ?? body.error ?? "فشل إنشاء طلب تسجيل المحامي."); await AsyncStorage.multiRemove([JWT_KEY, SESSION_KEY]).catch(() => {}); throw new Error(body.message ?? "تم استلام طلبك وسيتم تفعيل الحساب بعد اعتماد الإدارة.");
  }, []);

  const logout = useCallback(async () => { await AsyncStorage.multiRemove([SESSION_KEY, JWT_KEY]); setUser(null); }, []);
  const updateUser = useCallback(async (updates: Partial<User>) => {
    if (!user) throw new Error("غير مسجل الدخول"); const token = await getAuthToken(); if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى."); const apiUpdates: Record<string, unknown> = {}; for (const key of ["name", "phone", "country", "specialization", "licenseNumber", "bio", "experience", "hourlyRate"]) if (key in updates) apiUpdates[key] = updates[key as keyof User]; let pendingFields: string[] = [];
    if (Object.keys(apiUpdates).length) { const api = await requireApi(); const res = await fetch(`${api}/profile`, { method: "PATCH", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(apiUpdates) }); if (!res.ok) await jsonError(res, "فشل تحديث الملف الشخصي"); const body = await res.json().catch(() => ({})) as { pendingFields?: string[] }; pendingFields = body.pendingFields ?? []; }
    await persist({ ...user, ...updates }); return { pendingFields };
  }, [getAuthToken, persist, user]);

  const requestPasswordReset = useCallback(async (_email: string): Promise<string> => { throw new Error("استعادة كلمة المرور غير متاحة حتى يتم ربطها بخدمة الخادم الآمنة. لم يتم تخزين رمز أو كلمة مرور محلياً."); }, []);
  const resetPassword = useCallback(async (_email: string, _otp: string, _newPassword: string): Promise<void> => { throw new Error("استعادة كلمة المرور غير متاحة حتى يتم ربطها بخدمة الخادم الآمنة. لم يتم تغيير كلمة المرور محلياً."); }, []);
  const deleteAccount = useCallback(async () => { if (!user) return; const token = await getAuthToken(); if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى."); const api = await requireApi(); const res = await fetch(`${api}/profile`, { method: "DELETE", headers: { Authorization: `Bearer ${token}` } }); if (!res.ok) await jsonError(res, "فشل حذف الحساب"); await logout(); }, [getAuthToken, logout, user]);

  return <AuthContext.Provider value={{ user, isLoading, login, loginWithSocial, registerClient, registerLawyer, logout, updateUser, requestPasswordReset, resetPassword, deleteAccount, getAuthToken, ensureAuthToken }}>{children}</AuthContext.Provider>;
}
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error("useAuth must be used within AuthProvider"); return ctx; }
