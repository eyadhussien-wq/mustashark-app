import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { SocialProfile } from "@/hooks/useSocialAuth";

export type UserRole = "client" | "lawyer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  country: "qatar" | "jordan";
  avatar?: string;
  socialProvider?: string;
  // Lawyer-specific
  specialization?: string;
  licenseNumber?: string;
  licenseVerified?: boolean;
  bio?: string;
  experience?: number;
  rating?: number;
  reviewsCount?: number;
  hourlyRate?: number;
  available?: boolean;
}

type StoredUser = User & { password: string };

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithSocial: (profile: SocialProfile, role: UserRole) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerLawyer: (data: RegisterLawyerData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

export interface RegisterClientData {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: "qatar" | "jordan";
}

export interface RegisterLawyerData {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: "qatar" | "jordan";
  specialization: string;
  licenseNumber: string;
  bio: string;
  experience: number;
  hourlyRate: number;
}

const STORAGE_KEY = "mustasharek_users_v2";
const SESSION_KEY = "mustasharek_session_v2";
const OTP_KEY = "mustasharek_reset_otp";

const normalizeEmail = (e: string) => e.trim().toLowerCase();

const SAMPLE_USERS: StoredUser[] = [
  {
    id: "client-demo",
    name: "أحمد الكواري",
    email: "ahmed@example.com",
    password: "123456",
    phone: "+97455123456",
    role: "client",
    country: "qatar",
  },
  {
    id: "lawyer-demo",
    name: "د. فاطمة الزهراني",
    email: "fatima@example.com",
    password: "123456",
    phone: "+97455234567",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون تجاري",
    licenseNumber: "QAT-12345",
    licenseVerified: true,
    bio: "محامية متخصصة في القانون التجاري وعقود الأعمال مع خبرة 12 عاماً في المحاكم القطرية.",
    experience: 12,
    rating: 4.9,
    reviewsCount: 87,
    hourlyRate: 300,
    available: true,
  },
  // ── Test accounts ──────────────────────────────────────────────────────────
  {
    id: "client-test",
    name: "عميل تجريبي",
    email: "client@mustashark.com",
    password: "test1234",
    phone: "+97450000001",
    role: "client",
    country: "qatar",
  },
  {
    id: "lawyer-test",
    name: "د. محامٍ تجريبي",
    email: "lawyer@mustashark.com",
    password: "test1234",
    phone: "+97450000002",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون تجاري",
    licenseNumber: "QAT-99999",
    licenseVerified: true,
    bio: "حساب تجريبي لاختبار لوحة تحكم المحامي وجميع ميزات التطبيق.",
    experience: 5,
    rating: 4.5,
    reviewsCount: 20,
    hourlyRate: 200,
    available: true,
  },
];

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Storage helpers ───────────────────────────────────────────────────────────

async function readUsers(): Promise<StoredUser[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) {
      const stored = JSON.parse(raw) as StoredUser[];
      if (Array.isArray(stored) && stored.length > 0) {
        // Upsert: always ensure SAMPLE_USERS entries are present with up-to-date data
        const storedMap = new Map(stored.map((u) => [u.id, u]));
        for (const sample of SAMPLE_USERS) {
          storedMap.set(sample.id, sample);
        }
        const merged = Array.from(storedMap.values());
        await writeUsers(merged);
        return merged;
      }
    }
  } catch {}
  // First run — seed sample users
  await writeUsers(SAMPLE_USERS);
  return [...SAMPLE_USERS];
}

async function writeUsers(users: StoredUser[]) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SESSION_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setUser(JSON.parse(raw) as User);
          } catch {}
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (u: User) => {
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  // ── Login ──────────────────────────────────────────────────────────────────

  const login = useCallback(
    async (emailRaw: string, passwordRaw: string) => {
      if (!emailRaw.trim() || !passwordRaw) {
        throw new Error("يرجى تعبئة البريد الإلكتروني وكلمة المرور");
      }
      await new Promise((r) => setTimeout(r, 700));

      const email = normalizeEmail(emailRaw);
      const password = passwordRaw.trim();
      const users = await readUsers();

      const match = users.find(
        (u) => normalizeEmail(u.email) === email && u.password === password
      );

      if (!match) {
        // Helpful: tell user if the email exists but password is wrong
        const emailExists = users.some((u) => normalizeEmail(u.email) === email);
        if (emailExists) {
          throw new Error("كلمة المرور غير صحيحة");
        }
        throw new Error("البريد الإلكتروني غير مسجّل. يرجى إنشاء حساب جديد");
      }

      const { password: _, ...safe } = match;
      await persist(safe);
    },
    [persist]
  );

  // ── Social login ───────────────────────────────────────────────────────────

  const loginWithSocial = useCallback(
    async (profile: SocialProfile, role: UserRole) => {
      const users = await readUsers();
      const email = normalizeEmail(profile.email);

      const existing = users.find((u) => normalizeEmail(u.email) === email);
      if (existing) {
        // Already registered — just log in
        const { password: _, ...safe } = existing;
        await persist(safe);
        return;
      }

      // Auto-register with social profile
      const newUser: StoredUser = {
        id: `${profile.provider}-${Date.now()}`,
        name: profile.name,
        email: profile.email,
        phone: "",
        role,
        country: "qatar",
        socialProvider: profile.provider,
        password: "__social__",
        ...(role === "lawyer"
          ? {
              specialization: "",
              licenseVerified: false,
              rating: 0,
              reviewsCount: 0,
              hourlyRate: 150,
              available: true,
            }
          : {}),
      };

      await writeUsers([...users, newUser]);
      const { password: _, ...safe } = newUser;
      await persist(safe);
    },
    [persist]
  );

  // ── Register Client ────────────────────────────────────────────────────────

  const registerClient = useCallback(
    async (data: RegisterClientData) => {
      if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) {
        throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
      }
      if (data.password.length < 6) {
        throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }

      await new Promise((r) => setTimeout(r, 900));
      const email = normalizeEmail(data.email);
      const users = await readUsers();

      if (users.some((u) => normalizeEmail(u.email) === email)) {
        throw new Error(
          "هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟"
        );
      }

      const newUser: StoredUser = {
        id: `client-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        role: "client",
        country: data.country,
        password: data.password.trim(),
      };

      await writeUsers([...users, newUser]);
      const { password: _, ...safe } = newUser;
      await persist(safe);
    },
    [persist]
  );

  // ── Register Lawyer ────────────────────────────────────────────────────────

  const registerLawyer = useCallback(
    async (data: RegisterLawyerData) => {
      if (!data.name.trim() || !data.email.trim() || !data.password || !data.phone.trim()) {
        throw new Error("يرجى تعبئة جميع الحقول المطلوبة");
      }
      if (data.password.length < 6) {
        throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
      }

      await new Promise((r) => setTimeout(r, 1000));
      const email = normalizeEmail(data.email);
      const users = await readUsers();

      if (users.some((u) => normalizeEmail(u.email) === email)) {
        throw new Error(
          "هذا البريد الإلكتروني مسجّل مسبقاً. هل تريد تسجيل الدخول؟"
        );
      }

      const newUser: StoredUser = {
        id: `lawyer-${Date.now()}`,
        name: data.name.trim(),
        email: data.email.trim(),
        phone: data.phone.trim(),
        role: "lawyer",
        country: data.country,
        specialization: data.specialization,
        licenseNumber: data.licenseNumber,
        licenseVerified: true,
        bio: data.bio,
        experience: data.experience,
        rating: 0,
        reviewsCount: 0,
        hourlyRate: data.hourlyRate,
        available: true,
        password: data.password.trim(),
      };

      await writeUsers([...users, newUser]);
      const { password: _, ...safe } = newUser;
      await persist(safe);
    },
    [persist]
  );

  // ── Logout ─────────────────────────────────────────────────────────────────

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem(SESSION_KEY);
    setUser(null);
  }, []);

  // ── Update user ────────────────────────────────────────────────────────────

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated: User = { ...user, ...updates };
      await persist(updated);
      const users = await readUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...updates };
        await writeUsers(users);
      }
    },
    [user, persist]
  );

  // ── Password reset ─────────────────────────────────────────────────────────

  const requestPasswordReset = useCallback(async (emailRaw: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 900));
    const email = normalizeEmail(emailRaw);
    const users = await readUsers();

    if (!users.some((u) => normalizeEmail(u.email) === email)) {
      throw new Error("لا يوجد حساب مرتبط بهذا البريد الإلكتروني");
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    await AsyncStorage.setItem(
      OTP_KEY,
      JSON.stringify({ email, otp, expiresAt: Date.now() + 10 * 60 * 1000 })
    );
    return otp;
  }, []);

  const resetPassword = useCallback(
    async (emailRaw: string, otp: string, newPassword: string) => {
      await new Promise((r) => setTimeout(r, 700));
      const email = normalizeEmail(emailRaw);

      const raw = await AsyncStorage.getItem(OTP_KEY);
      if (!raw) throw new Error("لم يتم طلب استعادة كلمة المرور");

      const record = JSON.parse(raw) as {
        email: string;
        otp: string;
        expiresAt: number;
      };
      if (record.email !== email) throw new Error("البريد الإلكتروني غير متطابق");
      if (record.otp !== otp.trim()) throw new Error("رمز التحقق غير صحيح");
      if (Date.now() > record.expiresAt)
        throw new Error("انتهت صلاحية الرمز. يرجى طلب رمز جديد");
      if (newPassword.length < 6)
        throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

      const users = await readUsers();
      const idx = users.findIndex((u) => normalizeEmail(u.email) === email);
      if (idx === -1) throw new Error("المستخدم غير موجود");

      users[idx].password = newPassword.trim();
      await writeUsers(users);
      await AsyncStorage.removeItem(OTP_KEY);
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        loginWithSocial,
        registerClient,
        registerLawyer,
        logout,
        updateUser,
        requestPasswordReset,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
