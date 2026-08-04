import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, ShieldCheck, ShieldX, FileEdit } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProfileChangeRequest {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerEmail: string;
  lawyerExperience: number | null;
  lawyerSpecialization: string | null;
  field: "specialization" | "bio" | "hourlyRate";
  oldValue: string | null;
  newValue: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const FIELD_LABELS: Record<string, string> = {
  specialization: "التخصص القانوني",
  bio: "النبذة التعريفية",
  hourlyRate: "الأتعاب بالساعة",
};

function getAdminToken() {
  return localStorage.getItem("admin_token") ?? "";
}

async function adminFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      Authorization: `Bearer ${getAdminToken()}`,
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
  });
  const data = await res.json() as T & { error?: string };
  if (!res.ok) throw new Error((data as any).error ?? "حدث خطأ");
  return data;
}

function truncate(s: string | null, n = 80) {
  if (!s) return "—";
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ── Profile Changes Page ──────────────────────────────────────────────────────

export default function ProfileChanges() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-profile-change-requests"],
    queryFn: () =>
      adminFetch<{ requests: ProfileChangeRequest[]; count: number }>(
        "/api/admin/profile-change-requests",
      ),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<ProfileChangeRequest | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<ProfileChangeRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  async function handleApprove() {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await adminFetch(
        `/api/admin/profile-change-requests/${approveTarget.id}/approve`,
        { method: "POST" },
      );
      toast({
        title: "تمت الموافقة",
        description: `تم تطبيق ${FIELD_LABELS[approveTarget.field]} على الملف العام للمحامي ${approveTarget.lawyerName}.`,
      });
      setApproveTarget(null);
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-change-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-changes-count"] });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setApproveLoading(false);
    }
  }

  async function handleReject() {
    if (!rejectTarget) return;
    if (!rejectNote.trim()) {
      toast({ title: "مطلوب", description: "يرجى كتابة سبب الرفض", variant: "destructive" });
      return;
    }
    setRejectLoading(true);
    try {
      await adminFetch(
        `/api/admin/profile-change-requests/${rejectTarget.id}/reject`,
        { method: "POST", body: JSON.stringify({ rejectionNote: rejectNote.trim() }) },
      );
      toast({ title: "تم الرفض", description: "تم رفض طلب التغيير وإشعار المحامي." });
      setRejectTarget(null);
      setRejectNote("");
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-change-requests"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-profile-changes-count"] });
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setRejectLoading(false);
    }
  }

  const requests = data?.requests ?? [];

  return (
    <Layout>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">طلبات تعديل ملف المحامين</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مراجعة طلبات تغيير التخصص والأتعاب والنبذة قبل تطبيقها على الملف العام
          </p>
        </div>
        {!isLoading && (
          <Badge
            variant={requests.length > 0 ? "default" : "secondary"}
            className={`text-sm px-3 py-1 ${requests.length > 0 ? "bg-amber-500 hover:bg-amber-600" : ""}`}
          >
            {requests.length} طلب معلق
          </Badge>
        )}
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الطلبات المعلقة</CardTitle>
          <CardDescription>
            تحقق من بيانات المحامي (الخبرة، التخصص الحالي) قبل الموافقة على تغيير الأتعاب أو التخصص.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <CheckCircle2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">لا توجد طلبات تعديل معلقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المحامي</TableHead>
                  <TableHead className="text-right">الحقل</TableHead>
                  <TableHead className="text-right">القيمة الحالية</TableHead>
                  <TableHead className="text-right">القيمة المطلوبة</TableHead>
                  <TableHead className="text-right">سياق المحامي</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => (
                  <TableRow key={req.id}>
                    {/* Lawyer info */}
                    <TableCell>
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{req.lawyerName}</span>
                        <span className="text-xs text-muted-foreground">{req.lawyerEmail}</span>
                      </div>
                    </TableCell>

                    {/* Field */}
                    <TableCell>
                      <Badge variant="outline" className="text-xs gap-1">
                        <FileEdit className="h-3 w-3" />
                        {FIELD_LABELS[req.field] ?? req.field}
                      </Badge>
                    </TableCell>

                    {/* Old value */}
                    <TableCell className="text-sm text-muted-foreground max-w-[140px]">
                      <span className="line-clamp-2">{truncate(req.oldValue)}</span>
                    </TableCell>

                    {/* New value */}
                    <TableCell className="text-sm font-medium max-w-[160px]">
                      <span className="line-clamp-2 text-foreground">{truncate(req.newValue)}</span>
                    </TableCell>

                    {/* Lawyer context (experience + current specialization) */}
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex flex-col gap-0.5">
                        {req.lawyerExperience != null && (
                          <span>{req.lawyerExperience} سنة خبرة</span>
                        )}
                        {req.lawyerSpecialization && req.field !== "specialization" && (
                          <span className="text-xs">{req.lawyerSpecialization}</span>
                        )}
                      </div>
                    </TableCell>

                    {/* Actions */}
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                          onClick={() => setApproveTarget(req)}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" />
                          قبول
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-xs gap-1.5 border-rose-300 text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setRejectTarget(req);
                            setRejectNote("");
                          }}
                        >
                          <ShieldX className="h-3.5 w-3.5" />
                          رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* ── Approve confirm dialog ── */}
      <AlertDialog
        open={!!approveTarget}
        onOpenChange={(o) => !o && setApproveTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-600" />
              تأكيد الموافقة على التغيير
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              سيتم تطبيق{" "}
              <span className="font-bold text-foreground">
                {FIELD_LABELS[approveTarget?.field ?? ""] ?? approveTarget?.field}
              </span>{" "}
              للمحامي{" "}
              <span className="font-bold text-foreground">{approveTarget?.lawyerName}</span>{" "}
              على الملف العام فوراً وسيراه العملاء.
              {approveTarget?.newValue && (
                <span className="block mt-2 text-foreground font-medium bg-muted p-2 rounded text-sm">
                  {approveTarget.newValue}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={approveLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveLoading}
              className="bg-emerald-600 hover:bg-emerald-700 gap-1.5"
            >
              <ShieldCheck className="h-4 w-4" />
              {approveLoading ? "جارٍ التطبيق..." : "نعم، طبّق التغيير"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Reject dialog with note ── */}
      <Dialog
        open={!!rejectTarget}
        onOpenChange={(o) => {
          if (!o) {
            setRejectTarget(null);
            setRejectNote("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>رفض طلب التغيير</DialogTitle>
            <DialogDescription className="text-right">
              اكتب سبب رفض طلب تغيير{" "}
              <span className="font-bold text-foreground">
                {FIELD_LABELS[rejectTarget?.field ?? ""] ?? rejectTarget?.field}
              </span>{" "}
              للمحامي{" "}
              <span className="font-bold text-foreground">{rejectTarget?.lawyerName}</span>.
              سيظهر هذا السبب للمحامي في شاشة تعديل ملفه.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              dir="rtl"
              placeholder="مثال: الأتعاب المطلوبة تتجاوز الحد الأقصى لهذا التخصص."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={4}
              className="resize-none text-right"
              disabled={rejectLoading}
            />
          </div>
          <DialogFooter className="gap-2 flex-row-reverse">
            <Button
              variant="outline"
              onClick={() => {
                setRejectTarget(null);
                setRejectNote("");
              }}
              disabled={rejectLoading}
            >
              إلغاء
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectLoading || !rejectNote.trim()}
              className="gap-1.5"
            >
              <ShieldX className="h-4 w-4" />
              {rejectLoading ? "جارٍ الرفض..." : "رفض الطلب"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
