import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListAdminLawyers,
  useUpdateLawyerStatus,
  getListAdminLawyersQueryKey,
  getGetAdminOverviewQueryKey,
  type AdminLawyer,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import {
  translateCountry,
  translateAccountStatus,
  accountStatusVariant,
} from "@/lib/formatters";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
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
  MoreHorizontal,
  Check,
  X,
  PauseCircle,
  PlayCircle,
  Ban,
  Clock,
} from "lucide-react";

type LawyerStatus = "active" | "suspended" | "terminated" | "rejected";

type PendingAction = {
  lawyer: AdminLawyer;
  status: LawyerStatus;
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
};

export default function Lawyers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null);

  const { data: lawyers, isLoading } = useListAdminLawyers({
    query: { enabled: !!token, queryKey: getListAdminLawyersQueryKey() },
  });

  const statusMutation = useUpdateLawyerStatus({
    mutation: {
      onSuccess: (_data, variables) => {
        toast({
          title: "تم تحديث الحالة",
          description: successMessage(variables.data.status as LawyerStatus),
        });
        queryClient.invalidateQueries({ queryKey: getListAdminLawyersQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
        setConfirmAction(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "تعذّر تحديث حالة المحامي. حاول مرة أخرى.",
        });
      },
    },
  });

  const applyStatus = (lawyerId: string, status: LawyerStatus) => {
    statusMutation.mutate({ id: lawyerId, data: { status } });
  };

  const pending = (lawyers ?? []).filter((l) => l.status === "pending");
  const others = (lawyers ?? []).filter((l) => l.status !== "pending");

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">إدارة المحامين</h2>
      </div>

      {/* Pending registration requests */}
      <Card className="mb-6 border-amber-300/60 bg-amber-50/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <CardTitle>طلبات التسجيل المعلقة ({pending.length})</CardTitle>
          </div>
          <CardDescription>
            راجع طلبات المحامين الجدد ثم وافق عليها أو ارفضها.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              لا توجد طلبات تسجيل معلقة حالياً.
            </p>
          ) : (
            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>الاسم</TableHead>
                    <TableHead>البريد الإلكتروني</TableHead>
                    <TableHead>رقم الهاتف</TableHead>
                    <TableHead>الدولة</TableHead>
                    <TableHead className="text-left">الإجراء</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pending.map((lawyer) => (
                    <TableRow key={lawyer.id}>
                      <TableCell className="font-medium">{lawyer.name}</TableCell>
                      <TableCell>{lawyer.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {lawyer.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {translateCountry(lawyer.country)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 justify-start">
                          <Button
                            size="sm"
                            className="gap-1"
                            disabled={statusMutation.isPending}
                            onClick={() => applyStatus(lawyer.id, "active")}
                          >
                            <Check className="h-4 w-4" />
                            موافقة
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-destructive hover:text-destructive"
                            disabled={statusMutation.isPending}
                            onClick={() =>
                              setConfirmAction({
                                lawyer,
                                status: "rejected",
                                title: "رفض طلب التسجيل",
                                description: `سيتم رفض طلب تسجيل «${lawyer.name}». يمكنه إعادة التقديم لاحقاً.`,
                                confirmLabel: "رفض الطلب",
                                destructive: true,
                              })
                            }
                          >
                            <X className="h-4 w-4" />
                            رفض
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* All lawyers */}
      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>قائمة المحامين ({others.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>المكتب</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">عدد الاستشارات</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 9 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : others.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={9}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا يوجد محامون مسجلون
                    </TableCell>
                  </TableRow>
                ) : (
                  others.map((lawyer) => (
                    <TableRow
                      key={lawyer.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{lawyer.name}</TableCell>
                      <TableCell>{lawyer.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {lawyer.phone || "-"}
                      </TableCell>
                      <TableCell>
                        {lawyer.officeName || (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {translateCountry(lawyer.country)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={accountStatusVariant(lawyer.status)}>
                          {translateAccountStatus(lawyer.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {lawyer.consultationsCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(lawyer.createdAt).toLocaleDateString("ar-QA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-start">
                          <LawyerActions
                            lawyer={lawyer}
                            disabled={statusMutation.isPending}
                            onReactivate={() => applyStatus(lawyer.id, "active")}
                            onSuspend={() =>
                              setConfirmAction({
                                lawyer,
                                status: "suspended",
                                title: "إيقاف مؤقت للحساب",
                                description: `سيتم تجميد حساب «${lawyer.name}» مؤقتاً ولن يستطيع استقبال استشارات جديدة حتى إعادة التفعيل.`,
                                confirmLabel: "إيقاف مؤقت",
                                destructive: false,
                              })
                            }
                            onTerminate={() =>
                              setConfirmAction({
                                lawyer,
                                status: "terminated",
                                title: "إلغاء الاشتراك نهائياً",
                                description: `سيتم إلغاء اشتراك «${lawyer.name}» نهائياً وإيقاف حسابه عن العمل. هذا إجراء دائم.`,
                                confirmLabel: "إلغاء الاشتراك",
                                destructive: true,
                              })
                            }
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog
        open={!!confirmAction}
        onOpenChange={(open) => !open && setConfirmAction(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.destructive
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={() =>
                confirmAction &&
                applyStatus(confirmAction.lawyer.id, confirmAction.status)
              }
            >
              {confirmAction?.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

function LawyerActions({
  lawyer,
  disabled,
  onReactivate,
  onSuspend,
  onTerminate,
}: {
  lawyer: AdminLawyer;
  disabled: boolean;
  onReactivate: () => void;
  onSuspend: () => void;
  onTerminate: () => void;
}) {
  const isTerminated =
    lawyer.status === "terminated" || lawyer.status === "rejected";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={disabled}>
          <MoreHorizontal className="h-4 w-4" />
          <span className="sr-only">إجراءات</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {lawyer.status === "suspended" ? (
          <DropdownMenuItem onClick={onReactivate} className="gap-2">
            <PlayCircle className="h-4 w-4" />
            إعادة تفعيل
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem
            onClick={onSuspend}
            disabled={isTerminated}
            className="gap-2"
          >
            <PauseCircle className="h-4 w-4" />
            إيقاف مؤقت
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onTerminate}
          disabled={isTerminated}
          className="gap-2 text-destructive focus:text-destructive"
        >
          <Ban className="h-4 w-4" />
          إلغاء الاشتراك
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function successMessage(status: LawyerStatus) {
  switch (status) {
    case "active":
      return "تم تفعيل حساب المحامي.";
    case "suspended":
      return "تم إيقاف الحساب مؤقتاً.";
    case "terminated":
      return "تم إلغاء اشتراك المحامي نهائياً.";
    case "rejected":
      return "تم رفض طلب التسجيل.";
  }
}
