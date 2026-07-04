import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { User } from "./AuthContext";

export interface Availability {
  workingDays: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  startHour: string;     // "09:00"
  endHour: string;       // "17:00"
  slotDuration: 30 | 60; // minutes
}

export interface CommunicationChannels {
  chat: boolean;
  phone: boolean;
  video: boolean;
}

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
  availability?: Availability;
  channels?: CommunicationChannels;
}

export type ConsultationStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "completed"
  | "cancelled_by_lawyer"
  | "cancelled_by_client"
  | "no_show_lawyer"
  | "no_show_client"
  | "disputed"
  | "refunded_absent";

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
  paymentStatus?: "paid" | "unpaid" | "refunded" | "forfeited";
  refundAmount?: number;
  refundReason?: string;
  cancelledAt?: string;
  cancelledBy?: "client" | "lawyer";
  disputedAt?: string;
  disputeReason?: string;
  attachments?: Array<{ name: string; uri: string }>;
  rating?: ConsultationRating;
  meetLink?: string;            // Google Meet URL for video/phone consultations
  lawyerJoinedAt?: string;      // ISO timestamp when lawyer entered the meeting
  clientJoinedAt?: string;      // ISO timestamp when client entered the meeting
  durationMinutes?: number;     // Actual meeting duration (calculated on end)
}

export interface SlotInfo {
  time: string;
  available: boolean;
}

export interface LawyerWallet {
  lawyerId: string;
  monthKey: string; // "2026-06"
  monthlyGross: number;
  platformFee: number;
  pendingBalance: number;
  completedCount: number;
  lastPayoutAt?: string;
  nextPayoutDate: string;
}

export interface PayoutRecord {
  id: string;
  lawyerId: string;
  monthKey: string;
  gross: number;
  platformFee: number;
  net: number;
  status: "pending" | "processing" | "paid";
  createdAt: string;
  paidAt?: string;
}

export interface ClientWallet {
  clientId: string;
  totalRefunded: number;
  availableCredits: number;
  pendingCredits: number; // refunds for month-end cleared consultations
  forfeitedTotal: number; // money lost to no-shows
  lastUpdated: string;
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
  updateLawyerAvailability: (lawyerId: string, availability: Availability) => Promise<void>;
  updateLawyerChannels: (lawyerId: string, channels: CommunicationChannels) => Promise<void>;
  getAvailableSlots: (lawyerId: string, date: string) => SlotInfo[];
  getUpcomingConsultations: (userId: string, role: "client" | "lawyer") => Consultation[];
  deleteUserData: (userId: string, role: "client" | "lawyer") => Promise<void>;
  getLawyerWallet: (lawyerId: string) => Promise<LawyerWallet>;
  recordPayout: (lawyerId: string) => Promise<PayoutRecord | null>;
  getPayoutHistory: (lawyerId: string) => Promise<PayoutRecord[]>;
  // Refund & Cancellation
  cancelConsultation: (
    id: string,
    cancelledBy: "client" | "lawyer",
    reason?: string
  ) => Promise<{ refundAmount: number; refundedToClient: boolean }>;
  markNoShow: (id: string, role: "client" | "lawyer") => Promise<void>;
  raiseDispute: (id: string, reason: string) => Promise<void>;
  getClientWallet: (clientId: string) => Promise<ClientWallet>;
  // Google Meet integration
  recordAttendance: (id: string, role: "client" | "lawyer") => Promise<void>;
  checkLawyerAbsence: (id: string) => Promise<{ refunded: boolean; refundAmount: number }>;
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

  // Default availability for lawyers who haven't set one
  const DEFAULT_AVAILABILITY: Availability = {
    workingDays: [1, 2, 3, 4, 5], // Mon-Fri
    startHour: "09:00",
    endHour: "17:00",
    slotDuration: 60,
  };

  const updateLawyerAvailability = useCallback(
    async (lawyerId: string, availability: Availability) => {
      const updated = lawyers.map((l) =>
        l.id === lawyerId ? { ...l, availability } : l
      );
      setLawyers(updated);
      await AsyncStorage.setItem("mustasharek_lawyers", JSON.stringify(updated));
    },
    [lawyers]
  );

  const updateLawyerChannels = useCallback(
    async (lawyerId: string, channels: CommunicationChannels) => {
      const updated = lawyers.map((l) =>
        l.id === lawyerId ? { ...l, channels } : l
      );
      setLawyers(updated);
      await AsyncStorage.setItem("mustasharek_lawyers", JSON.stringify(updated));
    },
    [lawyers]
  );

  const getAvailableSlots = useCallback(
    (lawyerId: string, date: string): SlotInfo[] => {
      const lawyer = lawyers.find((l) => l.id === lawyerId);
      const avail = lawyer?.availability ?? DEFAULT_AVAILABILITY;

      // Check if date is a working day
      const dayOfWeek = new Date(date).getDay(); // 0=Sun
      if (!avail.workingDays.includes(dayOfWeek)) return [];

      // Generate slots
      const slots: SlotInfo[] = [];
      const start = parseInt(avail.startHour.split(":")[0], 10);
      const end = parseInt(avail.endHour.split(":")[0], 10);
      for (let h = start; h < end; h += avail.slotDuration / 60) {
        const timeStr = `${String(h).padStart(2, "0")}:00`;
        // Check if booked
        const booked = consultations.some(
          (c) =>
            c.lawyerId === lawyerId &&
            c.date === date &&
            c.time === timeStr &&
            c.status !== "rejected"
        );
        slots.push({ time: timeStr, available: !booked });
      }
      return slots;
    },
    [lawyers, consultations]
  );

  const getUpcomingConsultations = useCallback(
    (userId: string, role: "client" | "lawyer"): Consultation[] => {
      const now = new Date();
      const today = now.toISOString().split("T")[0];
      const currentHour = now.getHours();

      return consultations
        .filter((c) => {
          if (role === "client" && c.clientId !== userId) return false;
          if (role === "lawyer" && c.lawyerId !== userId) return false;
          if (c.status === "rejected" || c.status === "completed") return false;
          // Include pending and accepted where date >= today
          const consultDate = c.date;
          if (consultDate > today) return true;
          if (consultDate === today) {
            const hour = parseInt(c.time.split(":")[0], 10);
            return hour >= currentHour;
          }
          return false;
        })
        .sort((a, b) => {
          const dateCompare = a.date.localeCompare(b.date);
          if (dateCompare !== 0) return dateCompare;
          return a.time.localeCompare(b.time);
        });
    },
    [consultations]
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

      // Generate Google Meet link for video/phone consultations
      const meetLink =
        data.type === "video" || data.type === "phone"
          ? `https://meet.google.com/mst-${Date.now().toString(36).slice(-3)}${serialNumber.slice(-4)}`
          : undefined;

      const newConsult: Consultation = {
        ...data,
        id: "consult-" + Date.now(),
        serialNumber,
        createdAt: new Date().toISOString(),
        status: "pending",
        meetLink,
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

  // ── Delete user data ───────────────────────────────────────────────────────

  const deleteUserData = useCallback(
    async (userId: string, role: "client" | "lawyer") => {
      if (role === "lawyer") {
        const updatedLawyers = lawyers.filter((l) => l.id !== userId);
        setLawyers(updatedLawyers);
        await AsyncStorage.setItem("mustasharek_lawyers", JSON.stringify(updatedLawyers));
      }
      const updatedConsultations = consultations.filter(
        (c) => c.clientId !== userId && c.lawyerId !== userId
      );
      setConsultations(updatedConsultations);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updatedConsultations)
      );
    },
    [lawyers, consultations]
  );

  // ── Refund & Cancellation ───────────────────────────────────────────────────────

  /**
   * Cancels a consultation and determines refund eligibility:
   * - Lawyer cancels anytime → 100% refund to client (full refund)
   * - Client cancels 24h+ before appointment → 100% refund
   * - Client cancels <24h before → no refund (forfeited)
   */
  const cancelConsultation = useCallback(
    async (
      id: string,
      cancelledBy: "client" | "lawyer",
      reason?: string
    ): Promise<{ refundAmount: number; refundedToClient: boolean }> => {
      const consult = consultations.find((c) => c.id === id);
      if (!consult) return { refundAmount: 0, refundedToClient: false };
      if (consult.status === "cancelled_by_lawyer" || consult.status === "cancelled_by_client") {
        return { refundAmount: 0, refundedToClient: false };
      }

      const apptDate = new Date(`${consult.date}T${consult.time}`);
      const now = new Date();
      const hoursUntilAppt = (apptDate.getTime() - now.getTime()) / (1000 * 60 * 60);
      const isPaid = consult.paymentStatus === "paid";
      const price = consult.price;

      // Determine refund eligibility
      let refundAmount = 0;
      let refundedToClient = false;
      let newStatus: ConsultationStatus =
        cancelledBy === "lawyer" ? "cancelled_by_lawyer" : "cancelled_by_client";
      let newPaymentStatus: Consultation["paymentStatus"] = consult.paymentStatus;

      if (cancelledBy === "lawyer") {
        // Lawyer cancellation = always 100% refund to client
        refundAmount = isPaid ? price : 0;
        refundedToClient = isPaid;
        if (isPaid) newPaymentStatus = "refunded";
      } else if (cancelledBy === "client") {
        if (hoursUntilAppt >= 24) {
          // Client cancelled 24h+ before = full refund
          refundAmount = isPaid ? price : 0;
          refundedToClient = isPaid;
          if (isPaid) newPaymentStatus = "refunded";
        } else {
          // Client cancelled <24h before = forfeited (no refund, lawyer keeps it)
          refundAmount = 0;
          refundedToClient = false;
          if (isPaid) newPaymentStatus = "forfeited";
        }
      }

      const updated = consultations.map((c) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              paymentStatus: newPaymentStatus,
              cancelledAt: now.toISOString(),
              cancelledBy,
              refundAmount,
              refundReason: reason,
            }
          : c
      );
      setConsultations(updated);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updated)
      );

      // Credit client wallet if refunded
      if (refundedToClient && refundAmount > 0) {
        await creditClientWallet(consult.clientId, refundAmount);
      }

      return { refundAmount, refundedToClient };
    },
    [consultations]
  );

  /**
   * Mark a no-show. The reporter's role determines who didn't show:
   * - role="client" → lawyer didn't show → full refund to client
   * - role="lawyer" → client didn't show → no refund (forfeited to lawyer)
   */
  const markNoShow = useCallback(
    async (id: string, role: "client" | "lawyer") => {
      const consult = consultations.find((c) => c.id === id);
      if (!consult) return;

      const newStatus: ConsultationStatus =
        role === "client" ? "no_show_lawyer" : "no_show_client";
      let newPaymentStatus: Consultation["paymentStatus"] = consult.paymentStatus;
      let refundAmount = 0;

      if (role === "client") {
        // Lawyer no-show → full refund to client
        if (consult.paymentStatus === "paid") {
          newPaymentStatus = "refunded";
          refundAmount = consult.price;
          await creditClientWallet(consult.clientId, consult.price);
        }
      } else {
        // Client no-show → forfeited to lawyer
        if (consult.paymentStatus === "paid") {
          newPaymentStatus = "forfeited";
          refundAmount = 0;
        }
      }

      const updated = consultations.map((c) =>
        c.id === id
          ? {
              ...c,
              status: newStatus,
              paymentStatus: newPaymentStatus,
              refundAmount,
              refundReason:
                role === "client"
                  ? "تأخر المحامي عن الموعد"
                  : "تأخر العميل عن الموعد",
            }
          : c
      );
      setConsultations(updated);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updated)
      );
    },
    [consultations]
  );

  const raiseDispute = useCallback(
    async (id: string, reason: string) => {
      const updated = consultations.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "disputed" as ConsultationStatus,
              disputedAt: new Date().toISOString(),
              disputeReason: reason,
            }
          : c
      );
      setConsultations(updated);
      await AsyncStorage.setItem(
        "mustasharek_consultations",
        JSON.stringify(updated)
      );
    },
    [consultations]
  );

  // ── Client Wallet Helpers ────────────────────────────────────────────────────────────

  const CLIENT_WALLET_KEY = "mustasharek_client_wallets";

  async function loadClientWallets(): Promise<Record<string, ClientWallet>> {
    try {
      const raw = await AsyncStorage.getItem(CLIENT_WALLET_KEY);
      if (raw) return JSON.parse(raw);
    } catch {}
    return {};
  }

  async function saveClientWallets(wallets: Record<string, ClientWallet>) {
    await AsyncStorage.setItem(CLIENT_WALLET_KEY, JSON.stringify(wallets));
  }

  async function creditClientWallet(clientId: string, amount: number) {
    const wallets = await loadClientWallets();
    const existing = wallets[clientId] ?? {
      clientId,
      totalRefunded: 0,
      availableCredits: 0,
      pendingCredits: 0,
      forfeitedTotal: 0,
      lastUpdated: new Date().toISOString(),
    };
    existing.totalRefunded += amount;
    existing.availableCredits += amount;
    existing.pendingCredits += amount;
    existing.lastUpdated = new Date().toISOString();
    wallets[clientId] = existing;
    await saveClientWallets(wallets);
  }

  const getClientWallet = useCallback(async (clientId: string): Promise<ClientWallet> => {
    const wallets = await loadClientWallets();
    return (
      wallets[clientId] ?? {
        clientId,
        totalRefunded: 0,
        availableCredits: 0,
        pendingCredits: 0,
        forfeitedTotal: 0,
        lastUpdated: new Date().toISOString(),
      }
    );
  }, []);

  const recordAttendance = useCallback(
    async (id: string, role: "client" | "lawyer") => {
      const now = new Date().toISOString();
      const updated = consultations.map((c) => {
        if (c.id !== id) return c;
        return role === "client"
          ? { ...c, clientJoinedAt: now }
          : { ...c, lawyerJoinedAt: now };
      });
      setConsultations(updated);
      await AsyncStorage.setItem("mustasharek_consultations", JSON.stringify(updated));
    },
    [consultations]
  );

  /**
   * 15-minute absence rule: if the client has joined but the lawyer hasn't
   * within 15 minutes of the scheduled start, trigger a 100% auto-refund
   * and close the session (status → refunded_absent, meetLink cleared).
   */
  const ABSENCE_WINDOW_MS = 15 * 60 * 1000;

  const checkLawyerAbsence = useCallback(
    async (id: string): Promise<{ refunded: boolean; refundAmount: number }> => {
      const consult = consultations.find((c) => c.id === id);
      if (!consult) return { refunded: false, refundAmount: 0 };

      if (
        consult.status !== "accepted" ||
        !consult.clientJoinedAt ||
        consult.lawyerJoinedAt
      ) {
        return { refunded: false, refundAmount: 0 };
      }

      const scheduledStart = new Date(`${consult.date}T${consult.time}`);
      const elapsed = Date.now() - scheduledStart.getTime();

      if (elapsed < ABSENCE_WINDOW_MS) {
        return { refunded: false, refundAmount: 0 };
      }

      // ── Trigger auto-refund ──
      const refundAmount = consult.paymentStatus === "paid" ? consult.price : 0;

      const updated = consultations.map((c) =>
        c.id === id
          ? {
              ...c,
              status: "refunded_absent" as ConsultationStatus,
              paymentStatus: "refunded" as Consultation["paymentStatus"],
              refundAmount,
              refundReason: "المحامي لم يحضر الجلسة خلال 15 دقيقة — تم الاسترداد التلقائي الكامل",
              meetLink: undefined,
            }
          : c
      );
      setConsultations(updated);
      await AsyncStorage.setItem("mustasharek_consultations", JSON.stringify(updated));

      if (refundAmount > 0) {
        await creditClientWallet(consult.clientId, refundAmount);
      }

      return { refunded: true, refundAmount };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [consultations]
  );

  // ── Wallet / Commission ────────────────────────────────────────────────────────────

  const getLawyerWallet = useCallback(
    async (lawyerId: string): Promise<LawyerWallet> => {
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const firstDay = `${monthKey}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        .toISOString()
        .split("T")[0];

      // Gross = sum of completed + paid consultations this month, excluding refunded/cancelled/disputed
      const excludedStatuses: ConsultationStatus[] = [
        "cancelled_by_lawyer",
        "cancelled_by_client",
        "disputed",
        "no_show_lawyer", // lawyer no-show = refund to client, not lawyer earnings
      ];
      const excludedPayments: Consultation["paymentStatus"][] = ["refunded"];

      const monthlyPaid = consultations.filter(
        (c) =>
          c.lawyerId === lawyerId &&
          c.status === "completed" &&
          c.paymentStatus === "paid" &&
          !excludedStatuses.includes(c.status) &&
          !excludedPayments.includes(c.paymentStatus ?? "paid") &&
          c.createdAt >= firstDay &&
          c.createdAt <= lastDay
      );

      // Forfeited consultations (client no-show) count as lawyer earnings minus commission
      const monthlyForfeited = consultations.filter(
        (c) =>
          c.lawyerId === lawyerId &&
          c.status === "no_show_client" &&
          c.paymentStatus === "forfeited" &&
          c.createdAt >= firstDay &&
          c.createdAt <= lastDay
      );

      const monthlyGross =
        monthlyPaid.reduce((sum, c) => sum + c.price, 0) +
        monthlyForfeited.reduce((sum, c) => sum + c.price, 0);
      const completedCount = monthlyPaid.length + monthlyForfeited.length;

      const platformFee = Math.round(monthlyGross * 0.15 * 100) / 100;
      const pendingBalance = Math.round(monthlyGross * 0.85 * 100) / 100;

      // Check if payout already recorded this month
      const payouts = await getPayoutHistory(lawyerId);
      const thisMonthPayout = payouts.find((p) => p.monthKey === monthKey);
      const lastPayoutAt = thisMonthPayout?.createdAt;

      // Next payout = last day of month
      const nextPayoutDate = lastDay;

      return {
        lawyerId,
        monthKey,
        monthlyGross,
        platformFee,
        pendingBalance: thisMonthPayout ? 0 : pendingBalance,
        completedCount,
        lastPayoutAt,
        nextPayoutDate,
      };
    },
    [consultations]
  );

  const getPayoutHistory = useCallback(async (lawyerId: string): Promise<PayoutRecord[]> => {
    const raw = await AsyncStorage.getItem("mustasharek_payouts");
    if (!raw) return [];
    const all: PayoutRecord[] = JSON.parse(raw);
    return all.filter((p) => p.lawyerId === lawyerId).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
  }, []);

  const recordPayout = useCallback(
    async (lawyerId: string): Promise<PayoutRecord | null> => {
      const wallet = await getLawyerWallet(lawyerId);
      if (wallet.pendingBalance <= 0) return null;

      const record: PayoutRecord = {
        id: `payout-${Date.now()}`,
        lawyerId,
        monthKey: wallet.monthKey,
        gross: wallet.monthlyGross,
        platformFee: wallet.platformFee,
        net: wallet.pendingBalance,
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const raw = await AsyncStorage.getItem("mustasharek_payouts");
      const all: PayoutRecord[] = raw ? JSON.parse(raw) : [];
      all.push(record);
      await AsyncStorage.setItem("mustasharek_payouts", JSON.stringify(all));
      return record;
    },
    [getLawyerWallet]
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
        updateLawyerAvailability,
        updateLawyerChannels,
        getAvailableSlots,
        getUpcomingConsultations,
        deleteUserData,
        getLawyerWallet,
        recordPayout,
        getPayoutHistory,
        cancelConsultation,
        markNoShow,
        raiseDispute,
        getClientWallet,
        recordAttendance,
        checkLawyerAbsence,
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
