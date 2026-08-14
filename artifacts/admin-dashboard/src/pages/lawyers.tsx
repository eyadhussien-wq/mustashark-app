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
  FileText,
  Upload,
  Eye,
  Building2,
  ShieldCheck,
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

type VerificationFile = {
  name: string;
  size: number;
  type: string;
  source: "admin-upload" | "test-preview";
};

export default function Lawyers() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [confirmAction, setConfirmAction] = useState<PendingAction | null>(null);
  const [selectedLawyerId, setSelectedLawyerId] = useState<string | null>(null);
  const [verificationFiles, setVerificationFiles] = useState<Record<string, VerificationFile[]>>({});

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

  const addFiles = (lawyerId: string, files: FileList | null) => {
    if (!files?.length) return;
    const incoming: VerificationFile[] = Array.from(files).map((file) => ({
      name: file.name,
      size: file.size,
      type: file.type || "application/octet-stream",
      source: "admin-upload",
    }));
    setVerificationFiles((current) => ({
      ...current,
      [lawyerId]: [...(current[lawyerId] ?? []), ...incoming],
    }));
    toast({
      title: "تمت إضافة المستندات للمعاينة",
      description: "هذه المعاينة محلية داخل لوحة الاختبار ولن تمنح اعتمادًا مهنيًا بحد ذاتها.",
    });
  };

  const addTestPreview = (lawyerId: string) => {
    const demoFiles: VerificationFile[] = [
      { name: "TEST-LAWYER-PROFESSIONAL-DOCUMENT.pdf", size: 128_000, type: "application/pdf", source: "test-preview" },
      { name: "TEST-LAWYER-ID-DOCUMENT.pdf", size: 96_000, type: "application/pdf", source: "test-preview" },
    ];
    setVerificationFiles((current) => ({ ...current, [lawyerId]: demoFiles }));
    toast({ title: "تم تحميل مستندات الاختبار", description: "مستندات وهمية للمعاينة فقط." });
  };

  const pending = (lawyers ?? []).filter((l) => l.status === "pending");
  const others = (lawyers ?? []).filter((l) => l.status !== "pending");

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة المحامين والمكاتب</h2>
          <p className="text-muted-foreground mt-1">مركز استقبال ومراجعة طلبات فتح الحسابات المهنية</p>
        </div>
      </div>

      <Card className="mb-6 border-blue-300/60 bg-blue-50/40">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            <CardTitle>بوابة التحقق المهني</CardTitle>
          </div>
          <CardDescription>
            لا يتحول طلب المحامي إلى حساب مهني نشط قبل مراجعة الإدارة. المستندات هنا جزء من ملف التحقق وليست اعتمادًا تلقائيًا.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card className="mb-6 border-amber-300/60 bg-amber-50/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-600" />
            <CardTitle>طلبات قبول المحامين المعلقة ({pending.length})</CardTitle>
          </div>
          <CardDescription>
            الطلب يبقى Pending حتى يراجعه Super Admin/المخول بالمراجعة. هنا ستظهر بيانات التسجيل، البيانات المهنية، والمستندات.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : pending.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <FileText className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="font-medium">لا توجد طلبات قبول معلقة حالياً.</p>
              <p className="text-sm text-muted-foreground mt-1">عند تسجيل محامٍ جديد سيظهر طلبه هنا قبل إنشاء/تفعيل الحساب المهني.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pending.map((lawyer) => {
                const files = verificationFiles[lawyer.id] ?? [];
                const selected = selectedLawyerId === lawyer.id;
                return (
                  <div key={lawyer.id} className="rounded-md border bg-background overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead>الاسم</TableHead>
                          <TableHead>البريد</TableHead>
                          <TableHead>الهاتف</TableHead>
                          <TableHead>الدولة</TableHead>
                          <TableHead>نوع الطلب</TableHead>
                          <TableHead>الحالة</TableHead>
                          <TableHead className="text-left">الإجراء</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{lawyer.name}</TableCell>
                          <TableCell>{lawyer.email}</TableCell>
                          <TableCell dir="ltr" className="text-right">{lawyer.phone || "-"}</TableCell>
                          <TableCell><Badge variant="outline">{translateCountry(lawyer.country)}</Badge></TableCell>
                          <TableCell><Badge variant="secondary">Lawyer</Badge></TableCell>
                          <TableCell><Badge variant={accountStatusVariant(lawyer.status)}>Pending</Badge></TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 justify-start">
                              <Button size="sm" variant="outline" onClick={() => setSelectedLawyerId(selected ? null : lawyer.id)} className="gap-1">
                                <Eye className="h-4 w-4" />
                                {selected ? "إخفاء الملف" : "فتح ملف التحقق"}
                              </Button>
                              <Button size="sm" className="gap-1" disabled={statusMutation.isPending} onClick={() => applyStatus(lawyer.id, "active")}>
                                <Check className="h-4 w-4" /> موافقة
                              </Button>
                              <Button size="sm" variant="outline" className="gap-1 text-destructive hover:text-destructive" disabled={statusMutation.isPending} onClick={() => setConfirmAction({ lawyer, status: "rejected", title: "رفض طلب التسجيل", description: `سيتم رفض طلب تسجيل «${lawyer.name}». يمكنه إعادة التقديم لاحقاً.`, confirmLabel: "رفض الطلب", destructive: true })}>
                                <X className="h-4 w-4" /> رفض
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {selected && (
                      <div className="border-t bg-muted/20 p-5 space-y-5">
                        <div className="grid gap-4 md:grid-cols-3">
                          <InfoBox label="سبب الحالة" value={lawyer.statusReason || "lawyer_verification_required"} />
                          <InfoBox label="تاريخ التسجيل" value={new Date(lawyer.createdAt).toLocaleString("ar-QA")} />
                          <InfoBox label="صلاحية الحساب" value="لا توجد صلاحية Lawyer فعالة قبل الموافقة" />
                        </div>

                        <div className="rounded-lg border bg-background p-4">
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <h3 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4" /> مستندات التحقق المهني</h3>
                              <p className="text-sm text-muted-foreground">ارفع ملفات تجريبية الآن لمعاينة مكانها. لاحقًا ستصبح مرتبطة بطلب التحقق مع Reference وAudit.</p>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => addTestPreview(lawyer.id)} className="gap-1"><FileText className="h-4 w-4" /> مستندات اختبار</Button>
                              <label className="inline-flex">
                                <input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => addFiles(lawyer.id, e.target.files)} />
                                <span className="inline-flex h-9 items-center justify-center rounded-md border px-3 text-sm font-medium cursor-pointer hover:bg-muted gap-1"><Upload className="h-4 w-4" /> رفع ملفات</span>
                              </label>
                            </div>
                          </div>

                          {files.length === 0 ? (
                            <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">لم تُرفع مستندات بعد.</div>
                          ) : (
                            <div className="space-y-2">
                              {files.map((file, index) => (
                                <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-md border p-3">
                                  <div className="flex items-center gap-3 min-w-0">
                                    <FileText className="h-5 w-5 shrink-0 text-blue-600" />
                                    <div className="min-w-0">
                                      <p className="truncate font-medium">{file.name}</p>
                                      <p className="text-xs text-muted-foreground">{Math.max(1, Math.round(file.size / 1024))} KB · {file.source === "test-preview" ? "Test Preview" : "Admin Upload"}</p>
                                    </div>
                                  </div>
                                  <Badge variant="outline">بانتظار المراجعة</Badge>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="rounded-lg border bg-background p-4">
                          <h3 className="font-semibold mb-2">بيانات المهنة المطلوبة</h3>
                          <div className="grid gap-3 md:grid-cols-2 text-sm">
                            <InfoBox label="التخصص" value="بانتظار بيانات طلب المحامي" />
                            <InfoBox label="رقم/مرجع الترخيص المهني" value="بانتظار التحقق" />
                            <InfoBox label="جهة التسجيل" value="بانتظار التحقق" />
                            <InfoBox label="حالة التحقق" value="Pending Professional Verification" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mb-6 border-violet-300/60 bg-violet-50/30">
        <CardHeader>
          <div className="flex items-center gap-2"><Building2 className="h-5 w-5 text-violet-600" /><CardTitle>طلبات فتح حسابات مكاتب المحاماة</CardTitle></div>
          <CardDescription>قسم مستقل لاستقبال طلبات المكاتب ومراجعة بيانات المكتب ومالكه ووثائقه قبل التفعيل.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <InfoBox label="الحالة الحالية" value="جاهز لاستقبال الطلبات" />
            <InfoBox label="المراجعة" value="بيانات المكتب + المالك + المستندات" />
            <InfoBox label="التفعيل" value="لا تفعيل قبل قرار إداري موثق" />
          </div>
          <div className="mt-4 rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            لا توجد طلبات مكاتب معلقة في مصدر البيانات الحالي. سيتم ربط هذا القسم بطلبات المكتب الرسمية دون خلطها بطلب المحامي الفردي.
          </div>
        </CardContent>
      </Card>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader><CardTitle>قائمة المحامين ({others.length})</CardTitle></CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader><TableRow className="bg-muted/50"><TableHead>الاسم</TableHead><TableHead>البريد الإلكتروني</TableHead><TableHead>رقم الهاتف</TableHead><TableHead>المكتب</TableHead><TableHead>الدولة</TableHead><TableHead>الحالة</TableHead><TableHead className="text-center">عدد الاستشارات</TableHead><TableHead>تاريخ الانضمام</TableHead><TableHead className="text-left">إجراءات</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoading ? Array.from({ length: 5 }).map((_, i) => <TableRow key={i}>{Array.from({ length: 9 }).map((__, j) => <TableCell key={j}><Skeleton className="h-4 w-[100px]" /></TableCell>)}</TableRow>) : others.length === 0 ? <TableRow><TableCell colSpan={9} className="text-center py-10 text-muted-foreground">لا يوجد محامون مسجلون</TableCell></TableRow> : others.map((lawyer) => <TableRow key={lawyer.id} className="transition-colors hover:bg-muted/50"><TableCell className="font-medium">{lawyer.name}</TableCell><TableCell>{lawyer.email}</TableCell><TableCell dir="ltr" className="text-right">{lawyer.phone || "-"}</TableCell><TableCell>{lawyer.officeName || <span className="text-muted-foreground">-</span>}</TableCell><TableCell><Badge variant="outline">{translateCountry(lawyer.country)}</Badge></TableCell><TableCell><Badge variant={accountStatusVariant(lawyer.status)}>{translateAccountStatus(lawyer.status)}</Badge></TableCell><TableCell className="text-center font-medium">{lawyer.consultationsCount}</TableCell><TableCell className="text-muted-foreground text-sm">{new Date(lawyer.createdAt).toLocaleDateString("ar-QA")}</TableCell><TableCell><div className="flex justify-start"><LawyerActions lawyer={lawyer} disabled={statusMutation.isPending} onReactivate={() => applyStatus(lawyer.id, "active")} onSuspend={() => setConfirmAction({ lawyer, status: "suspended", title: "إيقاف مؤقت للحساب", description: `سيتم تجميد حساب «${lawyer.name}» مؤقتاً ولن يستطيع استقبال استشارات جديدة حتى إعادة التفعيل.`, confirmLabel: "إيقاف مؤقت", destructive: false })} onTerminate={() => setConfirmAction({ lawyer, status: "terminated", title: "إلغاء الاشتراك نهائياً", description: `سيتم إلغاء اشتراك «${lawyer.name}» نهائياً وإيقاف حسابه عن العمل. هذا إجراء دائم.`, confirmLabel: "إلغاء الاشتراك", destructive: true })} /></div></TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmAction} onOpenChange={(open) => !open && setConfirmAction(null)}>
        <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmAction?.title}</AlertDialogTitle><AlertDialogDescription>{confirmAction?.description}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>إلغاء</AlertDialogCancel><AlertDialogAction className={confirmAction?.destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""} onClick={() => confirmAction && applyStatus(confirmAction.lawyer.id, confirmAction.status)}>{confirmAction?.confirmLabel}</AlertDialogAction></AlertDialogFooter></AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border bg-background p-3"><p className="text-xs text-muted-foreground mb-1">{label}</p><p className="font-medium break-words">{value}</p></div>;
}

function LawyerActions({ lawyer, disabled, onReactivate, onSuspend, onTerminate }: { lawyer: AdminLawyer; disabled: boolean; onReactivate: () => void; onSuspend: () => void; onTerminate: () => void; }) {
  const isTerminated = lawyer.status === "terminated" || lawyer.status === "rejected";
  return <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={disabled}><MoreHorizontal className="h-4 w-4" /><span className="sr-only">إجراءات</span></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-48">{lawyer.status === "suspended" ? <DropdownMenuItem onClick={onReactivate} className="gap-2"><PlayCircle className="h-4 w-4" />إعادة تفعيل</DropdownMenuItem> : <DropdownMenuItem onClick={onSuspend} disabled={isTerminated} className="gap-2"><PauseCircle className="h-4 w-4" />إيقاف مؤقت</DropdownMenuItem>}<DropdownMenuSeparator /><DropdownMenuItem onClick={onTerminate} disabled={isTerminated} className="gap-2 text-destructive focus:text-destructive"><Ban className="h-4 w-4" />إلغاء الاشتراك</DropdownMenuItem></DropdownMenuContent></DropdownMenu>;
}

function successMessage(status: LawyerStatus) {
  switch (status) {
    case "active": return "تم تفعيل حساب المحامي.";
    case "suspended": return "تم إيقاف الحساب مؤقتاً.";
    case "terminated": return "تم إلغاء اشتراك المحامي نهائياً.";
    case "rejected": return "تم رفض طلب التسجيل.";
  }
}
