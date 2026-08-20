import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Check, Clock, FileText, ShieldCheck, X } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

type PendingVerification = {
  id: string;
  lawyerId: string;
  lawyerName: string | null;
  lawyerEmail: string | null;
  licenseNumber: string;
  barAssociation: string;
  status: "pending";
  rejectionReason: string | null;
  createdAt: string;
};

type PendingResponse = { ok: true; items: PendingVerification[] };
type ReviewResponse = {
  ok: true;
  verification: {
    id: string;
    lawyerId: string;
    status: "approved" | "rejected";
    reviewedAt: string | null;
    rejectionReason: string | null;
  };
};

type ApiFailure = { ok: false; error?: string };

async function readJson<T>(response: Response): Promise<T> {
  const data = (await response.json()) as T | ApiFailure;
  if (!response.ok) {
    const error = "error" in data && typeof data.error === "string" ? data.error : "request_failed";
    throw new Error(error);
  }
  return data as T;
}

export default function LawyerVerifications() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, string>>({});

  const pendingQuery = useQuery({
    queryKey: ["admin-lawyer-verifications-pending"],
    enabled: Boolean(token),
    queryFn: async () => {
      const response = await fetch("/api/admin/lawyer-verifications/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return readJson<PendingResponse>(response);
    },
    refetchInterval: 30_000,
  });

  const reviewMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: string; status: "approved" | "rejected"; rejectionReason?: string }) => {
      const response = await fetch(`/api/admin/lawyer-verifications/${encodeURIComponent(id)}/review`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, rejectionReason: rejectionReason ?? null }),
      });
      return readJson<ReviewResponse>(response);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lawyer-verifications-pending"] });
      toast({
        title: data.verification.status === "approved" ? "تم اعتماد المحامي" : "تم رفض طلب المحامي",
        description: "تم تسجيل القرار الإداري وتحديث حالة التحقق المهني.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "تعذر تنفيذ القرار",
        description: error instanceof Error ? error.message : String(error),
      });
    },
  });

  const approve = (id: string) => {
    if (reviewMutation.isPending) return;
    reviewMutation.mutate({ id, status: "approved" });
  };

  const reject = (id: string) => {
    if (reviewMutation.isPending) return;
    const reason = rejectionReasons[id]?.trim() ?? "";
    if (!reason) {
      toast({
        variant: "destructive",
        title: "سبب الرفض مطلوب",
        description: "أدخل سبباً واضحاً قبل رفض طلب التحقق المهني.",
      });
      return;
    }
    reviewMutation.mutate({ id, status: "rejected", rejectionReason: reason });
  };

  return (
    <Layout>
      <div className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">التحقق المهني للمحامين</h2>
        <p className="mt-1 text-muted-foreground">مراجعة واعتماد أو رفض طلبات التحقق المهني عبر الـ API الإداري الرسمي.</p>
      </div>

      <Alert className="mb-6">
        <ShieldCheck className="h-4 w-4" />
        <AlertTitle>حارس الاعتماد المهني</AlertTitle>
        <AlertDescription>
          هذه الصفحة تتعامل مع lawyer_verifications فقط. لا يتم تغيير accountStatus مباشرة، وكل قرار يمر عبر requireAdmin ويسجل في سجل التدقيق الإداري.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <CardTitle>طلبات معلقة ({pendingQuery.data?.items.length ?? 0})</CardTitle>
          </div>
          <CardDescription>المصدر الوحيد للقائمة هو GET /api/admin/lawyer-verifications/pending.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingQuery.isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-20 w-full" />)}
            </div>
          ) : pendingQuery.isError ? (
            <Alert variant="destructive">
              <AlertTitle>تعذر تحميل الطلبات</AlertTitle>
              <AlertDescription>
                {pendingQuery.error instanceof Error ? pendingQuery.error.message : "request_failed"}
              </AlertDescription>
            </Alert>
          ) : pendingQuery.data.items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center text-muted-foreground">
              <FileText className="mx-auto mb-3 h-8 w-8" />
              لا توجد طلبات تحقق مهني معلقة حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {pendingQuery.data.items.map((item) => {
                const isBusy = reviewMutation.isPending && reviewMutation.variables?.id === item.id;
                return (
                  <div key={item.id} className="overflow-hidden rounded-lg border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>المحامي</TableHead>
                          <TableHead>البريد</TableHead>
                          <TableHead>رقم الترخيص</TableHead>
                          <TableHead>الجهة</TableHead>
                          <TableHead>الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{item.lawyerName || "-"}</TableCell>
                          <TableCell>{item.lawyerEmail || "-"}</TableCell>
                          <TableCell dir="ltr" className="text-right">{item.licenseNumber}</TableCell>
                          <TableCell>{item.barAssociation}</TableCell>
                          <TableCell><Badge variant="secondary">Pending</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    <div className="border-t bg-muted/20 p-4">
                      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                        <div>
                          <label htmlFor={`rejection-${item.id}`} className="mb-2 block text-sm font-medium">سبب الرفض عند الحاجة</label>
                          <Textarea
                            id={`rejection-${item.id}`}
                            value={rejectionReasons[item.id] ?? ""}
                            onChange={(event) => setRejectionReasons((current) => ({ ...current, [item.id]: event.target.value }))}
                            placeholder="سبب الرفض مطلوب فقط عند اختيار رفض"
                            disabled={reviewMutation.isPending}
                            maxLength={1000}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={() => approve(item.id)} disabled={reviewMutation.isPending} className="gap-1">
                            <Check className="h-4 w-4" />
                            {isBusy && reviewMutation.variables?.status === "approved" ? "جارٍ الاعتماد..." : "اعتماد"}
                          </Button>
                          <Button variant="destructive" onClick={() => reject(item.id)} disabled={reviewMutation.isPending} className="gap-1">
                            <X className="h-4 w-4" />
                            {isBusy && reviewMutation.variables?.status === "rejected" ? "جارٍ الرفض..." : "رفض"}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
