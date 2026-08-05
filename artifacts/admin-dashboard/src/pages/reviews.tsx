import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Badge } from "@/components/ui/badge";
import { Star, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const API_BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

function getToken() {
  return localStorage.getItem("admin_token") ?? "";
}

interface PendingReview {
  id: string;
  stars: number;
  comment: string;
  commentStatus: string;
  createdAt: string;
  clientName: string;
  clientEmail: string;
  lawyerName: string;
  lawyerEmail: string;
}

function StarDisplay({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`h-3.5 w-3.5 ${s <= count ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30"}`}
        />
      ))}
      <span className="mr-1 text-xs font-semibold text-amber-600">{count}/5</span>
    </div>
  );
}

export default function Reviews() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [approveTarget, setApproveTarget] = useState<PendingReview | null>(null);
  const [rejectTarget, setRejectTarget] = useState<PendingReview | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/api/admin/reviews`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to fetch reviews");
      return res.json() as Promise<{ ok: boolean; reviews: PendingReview[]; count: number }>;
    },
  });

  const approveMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/admin/reviews/${id}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to approve");
    },
    onSuccess: () => {
      toast({ title: "تمت الموافقة على التعليق" });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-count"] });
      setApproveTarget(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_BASE}/api/admin/reviews/${id}/reject`, {
        method: "POST",
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error("Failed to reject");
    },
    onSuccess: () => {
      toast({ title: "تم رفض التعليق بصمت" });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      queryClient.invalidateQueries({ queryKey: ["admin-reviews-count"] });
      setRejectTarget(null);
    },
    onError: () => toast({ title: "حدث خطأ", variant: "destructive" }),
  });

  const reviews = data?.reviews ?? [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">مراجعة التعليقات</h1>
            <p className="text-sm text-muted-foreground mt-1">
              تعليقات العملاء بانتظار المراجعة قبل نشرها على صفحة المحامي
            </p>
          </div>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {data?.count ?? 0} بانتظار المراجعة
          </Badge>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40">
                <TableHead className="text-right font-semibold">العميل</TableHead>
                <TableHead className="text-right font-semibold">المحامي</TableHead>
                <TableHead className="text-right font-semibold">التقييم</TableHead>
                <TableHead className="text-right font-semibold">التعليق</TableHead>
                <TableHead className="text-right font-semibold">التاريخ</TableHead>
                <TableHead className="text-right font-semibold">الإجراء</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : reviews.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-16">
                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                      <MessageSquare className="h-10 w-10 opacity-30" />
                      <p className="font-medium">لا توجد تعليقات بانتظار المراجعة</p>
                      <p className="text-xs">ستظهر هنا تعليقات العملاء الجديدة تلقائياً</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                reviews.map((review) => (
                  <TableRow key={review.id} className="hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{review.clientName}</p>
                        <p className="text-xs text-muted-foreground">{review.clientEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{review.lawyerName}</p>
                        <p className="text-xs text-muted-foreground">{review.lawyerEmail}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StarDisplay count={review.stars} />
                    </TableCell>
                    <TableCell className="max-w-xs">
                      <p className="text-sm text-right leading-relaxed line-clamp-3">
                        {review.comment}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(review.createdAt).toLocaleDateString("ar-EG", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-200 text-green-700 hover:bg-green-50 hover:border-green-300 gap-1.5"
                          onClick={() => setApproveTarget(review)}
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          موافقة
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 gap-1.5"
                          onClick={() => setRejectTarget(review)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          رفض
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Approve dialog */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>الموافقة على نشر التعليق</AlertDialogTitle>
            <AlertDialogDescription>
              سيظهر هذا التعليق على صفحة المحامي العامة فور الموافقة.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {approveTarget && (
            <div className="my-2 rounded-lg border border-border bg-muted/30 p-3 text-sm text-right leading-relaxed">
              <StarDisplay count={approveTarget.stars} />
              <p className="mt-2">{approveTarget.comment}</p>
              <p className="mt-1 text-xs text-muted-foreground">— {approveTarget.clientName}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-green-600 hover:bg-green-700"
              onClick={() => approveTarget && approveMutation.mutate(approveTarget.id)}
              disabled={approveMutation.isPending}
            >
              {approveMutation.isPending ? "جاري النشر..." : "موافقة على النشر"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject dialog */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>رفض التعليق</AlertDialogTitle>
            <AlertDialogDescription>
              سيُرفض التعليق بصمت — التقييم بالنجوم يبقى محسوباً، لكن النص لن يظهر أبداً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rejectTarget && (
            <div className="my-2 rounded-lg border border-red-100 bg-red-50 p-3 text-sm text-right leading-relaxed">
              <StarDisplay count={rejectTarget.stars} />
              <p className="mt-2">{rejectTarget.comment}</p>
              <p className="mt-1 text-xs text-muted-foreground">— {rejectTarget.clientName}</p>
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90"
              onClick={() => rejectTarget && rejectMutation.mutate(rejectTarget.id)}
              disabled={rejectMutation.isPending}
            >
              {rejectMutation.isPending ? "جاري الرفض..." : "رفض التعليق"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
