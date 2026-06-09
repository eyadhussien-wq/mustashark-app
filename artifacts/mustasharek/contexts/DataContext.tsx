import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "./AuthContext";

export interface Lawyer extends User {
  role: "lawyer";
  specialization: string;
  licenseNumber: string;
  licenseVerified: boolean;
  bio: string;
  experience: number;
  rating: number;
  reviewsCount: number;
  hourlyRate: number;
  available: boolean;
}

export type ConsultationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed";

export interface ConsultationRating {
  stars: number;
  comment?: string;
  createdAt: string;
}

export interface Consultation {
  id: string;
  serialNumber: string;
  clientId: string;
  clientName: string;
  lawyerId: string;
  lawyerName: string;
  lawyerSpecialization: string;
  lawyerCountry?: "qatar" | "jordan";
  subject: string;
  description: string;
  date: string;
  time: string;
  status: ConsultationStatus;
  createdAt: string;
  type: "video" | "chat" | "phone";
  price: number;
  paymentStatus?: "paid" | "unpaid";
  attachments?: Array<{ name: string; uri: string }>;
  rating?: ConsultationRating;
}

interface DataContextValue {
  lawyers: Lawyer[];
  consultations: Consultation[];
  getLawyerById: (id: string) => Lawyer | undefined;
  bookConsultation: (
    data: Omit<Consultation, "id" | "createdAt" | "status" | "serialNumber">
  ) => Promise<void>;
  updateConsultationStatus: (
    id: string,
    status: ConsultationStatus
  ) => Promise<void>;
  rateLawyer: (
    consultationId: string,
    stars: number,
    comment: string
  ) => Promise<void>;
  refreshData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | null>(null);

const SAMPLE_LAWYERS: Lawyer[] = [
  {
    id: "lawyer-1",
    name: "د. فاطمة الزهراني",
    email: "fatima@example.com",
    phone: "+97455234567",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون تجاري",
    licenseNumber: "QAT-12345",
    licenseVerified: true,
    bio: "محامية متخصصة في القانون التجاري وعقود الأعمال مع خبرة 12 عاماً في المحاكم القطرية والدولية.",
    experience: 12,
    rating: 4.9,
    reviewsCount: 87,
    hourlyRate: 300,
    available: true,
  },
  {
    id: "lawyer-2",
    name: "أ. محمد العمري",
    email: "mohammed@example.com",
    phone: "+97455345678",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون جنائي",
    licenseNumber: "QAT-23456",
    licenseVerified: true,
    bio: "محامٍ جنائي بارز مع سجل حافل في قضايا الجنح والجنايات أمام المحاكم القطرية.",
    experience: 18,
    rating: 4.7,
    reviewsCount: 134,
    hourlyRate: 400,
    available: true,
  },
  {
    id: "lawyer-3",
    name: "د. نورة المنصوري",
    email: "noura@example.com",
    phone: "+97455456789",
    role: "lawyer",
    country: "qatar",
    specialization: "أحوال شخصية وأسرة",
    licenseNumber: "QAT-34567",
    licenseVerified: true,
    bio: "متخصصة في قضايا الزواج والطلاق والحضانة والميراث بخبرة تمتد لأكثر من 8 سنوات.",
    experience: 8,
    rating: 4.8,
    reviewsCount: 62,
    hourlyRate: 250,
    available: false,
  },
  {
    id: "lawyer-4",
    name: "أ. خالد الهاجري",
    email: "khalid@example.com",
    phone: "+97455567890",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون عقاري",
    licenseNumber: "QAT-45678",
    licenseVerified: true,
    bio: "خبير في عقود الإيجار والملكية العقارية والنزاعات المتعلقة بالعقارات في قطر.",
    experience: 15,
    rating: 4.6,
    reviewsCount: 93,
    hourlyRate: 350,
    available: true,
  },
  {
    id: "lawyer-5",
    name: "د. رنا الصالح",
    email: "rana@example.com",
    phone: "+962795123456",
    role: "lawyer",
    country: "jordan",
    specialization: "قانون عمالي",
    licenseNumber: "JOR-11234",
    licenseVerified: true,
    bio: "محامية متخصصة في حقوق العمال وعقود العمل والنزاعات العمالية أمام محاكم العمل الأردنية.",
    experience: 10,
    rating: 4.8,
    reviewsCount: 78,
    hourlyRate: 150,
    available: true,
  },
  {
    id: "lawyer-6",
    name: "أ. سامر عبد الله",
    email: "samer@example.com",
    phone: "+962795234567",
    role: "lawyer",
    country: "jordan",
    specialization: "قانون مدني",
    licenseNumber: "JOR-22345",
    licenseVerified: true,
    bio: "محامٍ مدني ذو خبرة واسعة في قضايا العقود والتعويضات والمسؤولية المدنية.",
    experience: 14,
    rating: 4.5,
    reviewsCount: 110,
    hourlyRate: 120,
    available: true,
  },
  {
    id: "lawyer-7",
    name: "د. ليلى الحسن",
    email: "layla@example.com",
    phone: "+962795345678",
    role: "lawyer",
    country: "jordan",
    specialization: "قانون جنائي",
    licenseNumber: "JOR-33456",
    licenseVerified: true,
    bio: "محامية جنائية متمرسة مع خبرة في الدفاع عن حقوق الإنسان والقضايا الجنائية الكبرى.",
    experience: 20,
    rating: 4.9,
    reviewsCount: 156,
    hourlyRate: 180,
    available: true,
  },
  {
    id: "lawyer-8",
    name: "أ. عمر المجالي",
    email: "omar@example.com",
    phone: "+962795456789",
    role: "lawyer",
    country: "jordan",
    specialization: "قانون تجاري",
    licenseNumber: "JOR-44567",
    licenseVerified: true,
    bio: "خبير في الشركات والاستثمار والعقود التجارية الدولية مع إلمام تام بأنظمة الاستثمار الأردنية.",
    experience: 9,
    rating: 4.7,
    reviewsCount: 45,
    hourlyRate: 140,
    available: false,
  },
  // ── Test / Demo accounts ─────────────────────────────────────────────────────
  {
    id: "lawyer-test",
    name: "د. محامٍ تجريبي",
    email: "lawyer@mustashark.com",
    phone: "+97450000002",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون تجاري",
    licenseNumber: "QAT-99999",
    licenseVerified: true,
    bio: "حساب تجريبي لاختبار لوحة تحكم المحامي وجميع ميزات التطبيق — متاح للحجز في أي وقت.",
    experience: 5,
    rating: 4.5,
    reviewsCount: 20,
    hourlyRate: 200,
    available: true,
  },
  {
    id: "lawyer-demo",
    name: "د. فاطمة الزهراني",
    email: "fatima@example.com",
    phone: "+97455234567",
    role: "lawyer",
    country: "qatar",
    specialization: "قانون تجاري",
    licenseNumber: "QAT-12345",
    licenseVerified: true,
    bio: "محامية متخصصة في القانون التجاري وعقود الأعمال مع خبرة 12 عاماً في المحاكم القطرية والدولية.",
    experience: 12,
    rating: 4.9,
    reviewsCount: 87,
    hourlyRate: 300,
    available: true,
  },
];

const SAMPLE_CONSULTATIONS: Consultation[] = [
  {
    id: "consult-1",
    serialNumber: "MST-2026-0001",
    clientId: "client-1",
    clientName: "أحمد الكواري",
    lawyerId: "lawyer-1",
    lawyerName: "د. فاطمة الزهراني",
    lawyerSpecialization: "قانون تجاري",
    lawyerCountry: "qatar",
    subject: "مراجعة عقد شراكة تجارية",
    description:
      "أحتاج مراجعة عقد شراكة مع شريك أجنبي وإبداء الرأي القانوني.",
    date: "2026-06-10",
    time: "10:00",
    status: "accepted",
    createdAt: "2026-05-20T09:00:00Z",
    type: "video",
    price: 300,
  },
  {
    id: "consult-2",
    serialNumber: "MST-2026-0002",
    clientId: "client-1",
    clientName: "أحمد الكواري",
    lawyerId: "lawyer-4",
    lawyerName: "أ. خالد الهاجري",
    lawyerSpecialization: "قانون عقاري",
    lawyerCountry: "qatar",
    subject: "نزاع مع مالك العقار",
    description: "مالك العقار يرفض إعادة وديعة الإيجار دون مسوغ قانوني.",
    date: "2026-06-15",
    time: "14:00",
    status: "pending",
    createdAt: "2026-05-24T11:00:00Z",
    type: "phone",
    price: 350,
  },
];

// ── Lawyer dynamic ratings (persisted separately so SAMPLE_LAWYERS don't reset them) ──
const RATINGS_KEY = "mustasharek_lawyer_ratings";

async function loadLawyerRatingOverrides(): Promise<
  Record<string, { rating: number; reviewsCount: number }>
> {
  try {
    const raw = await AsyncStorage.getItem(RATINGS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {};
}

async function saveLawyerRatingOverrides(
  overrides: Record<string, { rating: number; reviewsCount: number }>
) {
  await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(overrides));
}

function applyRatingOverrides(
  lawyers: Lawyer[],
  overrides: Record<string, { rating: number; reviewsCount: number }>
): Lawyer[] {
  return lawyers.map((l) =>
    overrides[l.id]
      ? { ...l, rating: overrides[l.id].rating, reviewsCount: overrides[l.id].reviewsCount }
      : l
  );
}

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [lawyers, setLawyers] = useState<Lawyer[]>(SAMPLE_LAWYERS);
  const [consultations, setConsultations] =
    useState<Consultation[]>(SAMPLE_CONSULTATIONS);

  const refreshData = useCallback(async () => {
    const ratingOverrides = await loadLawyerRatingOverrides();

    const stored = await AsyncStorage.getItem("mustasharek_consultations");
    if (stored) {
      try {
        setConsultations(JSON.parse(stored));
      } catch {}
    } else {
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(SAMPLE_CONSULTATIONS)
      );
    }

    const storedLawyers = await AsyncStorage.getItem("mustasharek_lawyers");
    if (storedLawyers) {
      try {
        const parsed: Lawyer[] = JSON.parse(storedLawyers);
        const sampleIds = new Set(SAMPLE_LAWYERS.map((l) => l.id));
        const extras = parsed.filter((l) => !sampleIds.has(l.id));
        const merged = [...SAMPLE_LAWYERS, ...extras];
        setLawyers(applyRatingOverrides(merged, ratingOverrides));
      } catch {}
    } else {
      setLawyers(applyRatingOverrides(SAMPLE_LAWYERS, ratingOverrides));
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  const getLawyerById = useCallback(
    (id: string) => lawyers.find((l) => l.id === id),
    [lawyers]
  );

  const bookConsultation = useCallback(
    async (data: Omit<Consultation, "id" | "createdAt" | "status" | "serialNumber">) => {
      // Generate next serial number
      const SERIAL_KEY = "mustasharek_serial_counter";
      let counter = 1;
      try {
        const raw = await AsyncStorage.getItem(SERIAL_KEY);
        if (raw) counter = parseInt(raw, 10) + 1;
      } catch {}
      await AsyncStorage.setItem(SERIAL_KEY, String(counter));
      const year = new Date().getFullYear();
      const serialNumber = `MST-${year}-${String(counter + 2).padStart(4, "0")}`;

      const newConsult: Consultation = {
        ...data,
        id: "consult-" + Date.now(),
        serialNumber,
        createdAt: new Date().toISOString(),
        status: "pending",
      };
      const updated = [...consultations, newConsult];
      setConsultations(updated);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updated)
      );
    },
    [consultations]
  );

  const updateConsultationStatus = useCallback(
    async (id: string, status: ConsultationStatus) => {
      const updated = consultations.map((c) =>
        c.id === id ? { ...c, status } : c
      );
      setConsultations(updated);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updated)
      );
    },
    [consultations]
  );

  const rateLawyer = useCallback(
    async (consultationId: string, stars: number, comment: string) => {
      const newRating: ConsultationRating = {
        stars,
        comment: comment.trim() || undefined,
        createdAt: new Date().toISOString(),
      };

      // Update the consultation with the rating
      const updatedConsultations = consultations.map((c) =>
        c.id === consultationId ? { ...c, rating: newRating } : c
      );
      setConsultations(updatedConsultations);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updatedConsultations)
      );

      // Recalculate lawyer's average rating from all rated consultations
      const targetConsult = consultations.find((c) => c.id === consultationId);
      if (!targetConsult) return;
      const lawyerId = targetConsult.lawyerId;

      const allRated = updatedConsultations.filter(
        (c) => c.lawyerId === lawyerId && c.rating
      );
      const avgRating =
        allRated.reduce((sum, c) => sum + (c.rating?.stars ?? 0), 0) /
        allRated.length;

      // Load existing overrides and merge
      const existingOverrides = await loadLawyerRatingOverrides();
      const baseReviewCount =
        SAMPLE_LAWYERS.find((l) => l.id === lawyerId)?.reviewsCount ?? 0;
      const newOverrides = {
        ...existingOverrides,
        [lawyerId]: {
          rating: Math.round(avgRating * 10) / 10,
          reviewsCount: baseReviewCount + allRated.length,
        },
      };
      await saveLawyerRatingOverrides(newOverrides);

      // Update in-memory lawyer state
      setLawyers((prev) =>
        prev.map((l) =>
          l.id === lawyerId
            ? {
                ...l,
                rating: newOverrides[lawyerId].rating,
                reviewsCount: newOverrides[lawyerId].reviewsCount,
              }
            : l
        )
      );
    },
    [consultations]
  );

  return (
    <DataContext.Provider
      value={{
        lawyers,
        consultations,
        getLawyerById,
        bookConsultation,
        updateConsultationStatus,
        rateLawyer,
        refreshData,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
