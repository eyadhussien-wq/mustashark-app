import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "client" | "lawyer";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  country: "qatar" | "jordan";
  avatar?: string;
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

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  registerClient: (data: RegisterClientData) => Promise<void>;
  registerLawyer: (data: RegisterLawyerData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<string>;
  resetPassword: (email: string, otp: string, newPassword: string) => Promise<void>;
}

interface RegisterClientData {
  name: string;
  email: string;
  password: string;
  phone: string;
  country: "qatar" | "jordan";
}

interface RegisterLawyerData {
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

const AuthContext = createContext<AuthContextValue | null>(null);

const SAMPLE_USERS: Array<User & { password: string }> = [
  {
    id: "client-1",
    name: "أحمد الكواري",
    email: "ahmed@example.com",
    password: "123456",
    phone: "+97455123456",
    role: "client",
    country: "qatar",
  },
  {
    id: "lawyer-1",
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
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("mustasharek_user").then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {}
      }
      setIsLoading(false);
    });
  }, []);

  const persistUser = useCallback(async (u: User) => {
    await AsyncStorage.setItem("mustasharek_user", JSON.stringify(u));
    setUser(u);
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      await new Promise((r) => setTimeout(r, 800));
      const allUsers = await getAllUsers();
      const match = allUsers.find(
        (u) => u.email === email && u.password === password
      );
      if (!match) throw new Error("البريد الإلكتروني أو كلمة المرور غير صحيحة");
      const { password: _, ...userWithoutPass } = match;
      await persistUser(userWithoutPass);
    },
    [persistUser]
  );

  const registerClient = useCallback(
    async (data: RegisterClientData) => {
      await new Promise((r) => setTimeout(r, 1000));
      const allUsers = await getAllUsers();
      if (allUsers.find((u) => u.email === data.email)) {
        throw new Error("البريد الإلكتروني مسجل مسبقاً");
      }
      const newUser: User = {
        id: "client-" + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
        role: "client",
        country: data.country,
      };
      await saveUser({ ...newUser, password: data.password });
      await persistUser(newUser);
    },
    [persistUser]
  );

  const registerLawyer = useCallback(
    async (data: RegisterLawyerData) => {
      await new Promise((r) => setTimeout(r, 1200));
      const allUsers = await getAllUsers();
      if (allUsers.find((u) => u.email === data.email)) {
        throw new Error("البريد الإلكتروني مسجل مسبقاً");
      }
      const newUser: User = {
        id: "lawyer-" + Date.now(),
        name: data.name,
        email: data.email,
        phone: data.phone,
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
      };
      await saveUser({ ...newUser, password: data.password });
      await persistUser(newUser);
    },
    [persistUser]
  );

  const logout = useCallback(async () => {
    await AsyncStorage.removeItem("mustasharek_user");
    setUser(null);
  }, []);

  const updateUser = useCallback(
    async (updates: Partial<User>) => {
      if (!user) return;
      const updated = { ...user, ...updates };
      await persistUser(updated);
      const allUsers = await getAllUsers();
      const idx = allUsers.findIndex((u) => u.id === user.id);
      if (idx !== -1) {
        allUsers[idx] = { ...allUsers[idx], ...updates };
        await AsyncStorage.setItem(
          "mustasharek_all_users",
          JSON.stringify(allUsers)
        );
      }
    },
    [user, persistUser]
  );

  // Returns the OTP code (displayed to user in-app since no real email service)
  const requestPasswordReset = useCallback(async (email: string): Promise<string> => {
    await new Promise((r) => setTimeout(r, 1000));
    const allUsers = await getAllUsers();
    const match = allUsers.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!match) throw new Error("لا يوجد حساب مرتبط بهذا البريد الإلكتروني");

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    const record = { email: email.toLowerCase(), otp, expiresAt: Date.now() + 10 * 60 * 1000 };
    await AsyncStorage.setItem("mustasharek_reset_otp", JSON.stringify(record));
    return otp;
  }, []);

  const resetPassword = useCallback(async (email: string, otp: string, newPassword: string) => {
    await new Promise((r) => setTimeout(r, 800));

    const stored = await AsyncStorage.getItem("mustasharek_reset_otp");
    if (!stored) throw new Error("لم يتم طلب استعادة كلمة المرور");

    const record = JSON.parse(stored) as { email: string; otp: string; expiresAt: number };

    if (record.email !== email.toLowerCase()) throw new Error("البريد الإلكتروني غير متطابق");
    if (record.otp !== otp.trim()) throw new Error("رمز التحقق غير صحيح");
    if (Date.now() > record.expiresAt) throw new Error("انتهت صلاحية رمز التحقق. يرجى طلب رمز جديد");
    if (newPassword.length < 6) throw new Error("كلمة المرور يجب أن تكون 6 أحرف على الأقل");

    const allUsers = await getAllUsers();
    const idx = allUsers.findIndex((u) => u.email.toLowerCase() === email.toLowerCase());
    if (idx === -1) throw new Error("المستخدم غير موجود");

    allUsers[idx].password = newPassword;
    await AsyncStorage.setItem("mustasharek_all_users", JSON.stringify(allUsers));
    await AsyncStorage.removeItem("mustasharek_reset_otp");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
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

async function getAllUsers(): Promise<Array<User & { password: string }>> {
  const stored = await AsyncStorage.getItem("mustasharek_all_users");
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {}
  }
  await AsyncStorage.setItem(
    "mustasharek_all_users",
    JSON.stringify(SAMPLE_USERS)
  );
  return SAMPLE_USERS;
}

async function saveUser(user: User & { password: string }) {
  const all = await getAllUsers();
  all.push(user);
  await AsyncStorage.setItem("mustasharek_all_users", JSON.stringify(all));
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
