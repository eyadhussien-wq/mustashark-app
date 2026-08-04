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
import { Trash2, ShieldCheck, ShieldX, Search, AlertTriangle, CheckCircle2 } from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface DeletionRequest {
  id: string;
  lawyerId: string;
  lawyerName: string;
  lawyerEmail: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  rejectionNote: string | null;
}

interface ObligationResult {
  ok: boolean;
  requestId: string;
  lawyerId: string;
  activeBookingsCount: number;
  unpaidDuesTotal: number;
  canApprove: boolean;
}

// ── API helpers ───────────────────────────────────────────────────────────────

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

// ── Deletion Requests Page ────────────────────────────────────────────────────

export default function DeletionRequests() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Main list
  const { data, isLoading } = useQuery({
    queryKey: ["admin-deletion-requests"],
    queryFn: () =>
      adminFetch<{ requests: DeletionRequest[]; count: number }>(
        "/api/admin/deletion-requests",
      ),
    enabled: !!token,
    refetchInterval: 30_000,
  });

  // Per-row check results
  const [checkResults, setCheckResults] = useState<
    Record<string, ObligationResult>
  >({});
  const [checkLoading, setCheckLoading] = useState<Record<string, boolean>>({});

  // Approve dialog
  const [approveTarget, setApproveTarget] = useState<DeletionRequest | null>(null);
  const [approveLoading, setApproveLoading] = useState(false);

  // Reject dialog
  const [rejectTarget, setRejectTarget] = useState<DeletionRequest | null>(null);
  const [rejectNote, setRejectNote] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);

  async function handleCheck(req: DeletionRequest) {
    setCheckLoading((p) => ({ ...p, [req.id]: true }));
    try {
      const result = await adminFetch<ObligationResult>(
        `/api/admin/deletion-requests/${req.id}/check`,
      );
      setCheckResults((p) => ({ ...p, [req.id]: result }));
    } catch (e: any) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally {
      setCheckLoading((p) => ({ ...p, [req.id]: false }));
    }
  }

  async function handleApprove() {
    if (!approveTarget) return;
    setApproveLoading(true);
    try {
      await adminFetch(`/api/admin/deletion-requests/${approveTarget.id}/approve`, {
        method: "POST",
      });
      toast({ title: "تم الحذف", description: `تم حذف حساب ${approveTarget.lawyerName} بنجاح.` });
      setApproveTarget(null);
      setCheckResults((p) => {
        const next = { ...p };
        delete next[approveTarget.id];
        return next;
      });
      await queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
    } catch (e: any) {
      toast({ title: "تعذّر الحذف", description: e.message, variant: "destructive" });
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
      await adminFetch(`/api/admin/deletion-requests/${rejectTarget.id}/reject`, {
        method: "POST",
        body: JSON.stringify({ rejectionNote: rejectNote.trim() }),
      });
      toast({ title: "تم الرفض", description: "تم رفض الطلب وإشعار المحامي." });
      setRejectTarget(null);
      setRejectNote("");
      await queryClient.invalidateQueries({ queryKey: ["admin-deletion-requests"] });
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
          <h1 className="text-2xl font-bold tracking-tight">طلبات حذف المحامين</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            مراجعة طلبات المحامين لحذف حساباتهم والتحقق من الالتزامات قبل التنفيذ
          </p>
        </div>
        {!isLoading && (
          <Badge variant={requests.length > 0 ? "destructive" : "secondary"} className="text-sm px-3 py-1">
            {requests.length} طلب معلق
          </Badge>
        )}
      </div>

      {/* Table card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">الطلبات المعلقة</CardTitle>
          <CardDescription>
            افحص الالتزامات قبل الموافقة على الحذف. الحذف نهائي ولا يمكن التراجع عنه.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
              <CheckCircle2 className="h-12 w-12 opacity-30" />
              <p className="text-sm">لا توجد طلبات حذف معلقة</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المحامي</TableHead>
                  <TableHead className="text-right">تاريخ الطلب</TableHead>
                  <TableHead className="text-right">فحص الالتزامات</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((req) => {
                  const check = checkResults[req.id];
                  return (
                    <TableRow key={req.id}>
                      {/* Lawyer info */}
                      <TableCell>
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium">{req.lawyerName}</span>
                          <span className="text-xs text-muted-foreground">{req.lawyerEmail}</span>
                        </div>
                      </TableCell>

                      {/* Date */}
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(req.requestedAt).toLocaleDateString("ar-SA", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>

                      {/* Obligation check result */}
                      <TableCell>
                        {check ? (
                          <div className="flex flex-col gap-1 text-xs">
                            <span className={check.activeBookingsCount > 0 ? "text-destructive font-medium" : "text-emerald-600"}>
                              {check.activeBookingsCount > 0
                                ? `⚠ ${check.activeBookingsCount} استشارة نشطة`
                                : "✓ لا استشارات نشطة"}
                            </span>
                            <span className={check.unpaidDuesTotal > 0 ? "text-destructive font-medium" : "text-emerald-600"}>
                              {check.unpaidDuesTotal > 0
                                ? `⚠ ${check.unpaidDuesTotal.toFixed(2)} مستحقات غير محصلة`
                                : "✓ لا مستحقات معلقة"}
                            </span>
                          </div>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCheck(req)}
                            disabled={checkLoading[req.id]}
                            className="text-xs gap-1.5"
                          >
                            <Search className="h-3.5 w-3.5" />
                            {checkLoading[req.id] ? "جارٍ الفحص..." : "فحص الالتزامات"}
                          </Button>
                        )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-xs gap-1.5 border-emerald-300 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                            onClick={() => setApproveTarget(req)}
                            disabled={check !== undefined && !check.canApprove}
                            title={
                              check && !check.canApprove
                                ? "لا يمكن الحذف: توجد التزامات مفتوحة"
                                : "قبول وحذف الحساب"
                            }
                          >
                            <ShieldCheck className="h-3.5 w-3.5" />
                            قبول وحذف
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
                            رفض الطلب
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
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
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الحذف النهائي
            </AlertDialogTitle>
            <AlertDialogDescription className="text-right leading-relaxed">
              سيتم حذف حساب <span className="font-bold text-foreground">{approveTarget?.lawyerName}</span> نهائياً
              مع جميع بياناته المرتبطة (المكتب، المستندات). هذا الإجراء لا يمكن التراجع عنه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={approveLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleApprove}
              disabled={approveLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 gap-1.5"
            >
              <Trash2 className="h-4 w-4" />
              {approveLoading ? "جارٍ الحذف..." : "نعم، احذف الحساب"}
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
            <DialogTitle>رفض طلب الحذف</DialogTitle>
            <DialogDescription className="text-right">
              اكتب سبب رفض طلب{" "}
              <span className="font-bold text-foreground">
                {rejectTarget?.lawyerName}
              </span>
              . سيُرسَل هذا السبب للمحامي ليراه في التطبيق.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Textarea
              dir="rtl"
              placeholder="مثال: لديك استشارات نشطة لم تُنهَ بعد. يرجى إتمامها أولاً."
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
