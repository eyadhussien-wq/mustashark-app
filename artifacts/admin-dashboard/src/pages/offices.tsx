import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useListAdminOffices, 
  useRunAdminKillSwitch, 
  useCollectAdminDues,
  getGetAdminOverviewQueryKey,
  getListAdminOfficesQueryKey,
  getGetAdminDuesReportQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, translateCountry } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription
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
import { Power, Wallet, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Offices() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [collectionOffice, setCollectionOffice] = useState<{id: string, name: string, amount: number} | null>(null);
  const [notes, setNotes] = useState("");
  const [isKillSwitchOpen, setIsKillSwitchOpen] = useState(false);

  const { data: offices, isLoading } = useListAdminOffices({
    query: { enabled: !!token, queryKey: getListAdminOfficesQueryKey() }
  });

  const killSwitchMutation = useRunAdminKillSwitch({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "تم تنفيذ الإجراء",
          description: `تم تحديث ${result.processed} مكتب. تم إيقاف ${result.suspended.length} وإعادة تفعيل ${result.reinstated.length}.`,
        });
        queryClient.invalidateQueries({ queryKey: getListAdminOfficesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminDuesReportQueryKey() });
        setIsKillSwitchOpen(false);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل تنفيذ إجراء الإيقاف التلقائي",
        });
      }
    }
  });

  const collectDuesMutation = useCollectAdminDues({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "تم تحصيل المستحقات",
          description: `تم تحصيل ${formatCurrency(result.totalCollected)} بنجاح.`,
        });
        queryClient.invalidateQueries({ queryKey: getListAdminOfficesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminDuesReportQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
        setCollectionOffice(null);
        setNotes("");
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "فشل تحصيل المستحقات",
        });
      }
    }
  });

  const handleCollect = () => {
    if (!collectionOffice) return;
    collectDuesMutation.mutate({
      data: {
        officeId: collectionOffice.id,
        notes
      }
    });
  };

  const handleKillSwitch = () => {
    killSwitchMutation.mutate();
  };

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">إدارة المكاتب</h2>
          <p className="text-muted-foreground mt-1">متابعة المكاتب والمستحقات وحالات الإيقاف</p>
        </div>
        <Button 
          variant="destructive" 
          className="gap-2"
          onClick={() => setIsKillSwitchOpen(true)}
        >
          <Power className="h-4 w-4" />
          تنفيذ الإيقاف التلقائي
        </Button>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardContent className="p-0">
          <div className="rounded-md">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>المكتب</TableHead>
                  <TableHead>المالك</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead className="text-left">حد المديونية</TableHead>
                  <TableHead className="text-left">العمولات المستحقة</TableHead>
                  <TableHead className="text-center">الحالة</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] mr-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] mr-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px] mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[100px] mr-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !offices || offices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      لا يوجد مكاتب مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  offices.map((office) => {
                    const exceedsThreshold = office.pendingCommission >= office.debtThreshold;
                    return (
                      <TableRow key={office.id} className="transition-colors hover:bg-muted/50">
                        <TableCell className="font-medium">{office.name}</TableCell>
                        <TableCell>{office.ownerName || "-"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background">
                            {translateCountry(office.country)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-left font-mono">
                          {formatCurrency(office.debtThreshold)}
                        </TableCell>
                        <TableCell className={`text-left font-mono font-medium ${exceedsThreshold ? 'text-destructive' : ''}`}>
                          {formatCurrency(office.pendingCommission)}
                        </TableCell>
                        <TableCell className="text-center">
                          {office.isSuspended ? (
                            <Badge variant="destructive">موقوف</Badge>
                          ) : exceedsThreshold ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">تجاوز الحد</Badge>
                          ) : (
                            <Badge variant="outline" className="border-emerald-500 text-emerald-600 dark:text-emerald-400">نشط</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                            disabled={office.pendingCommission <= 0}
                            onClick={() => setCollectionOffice({
                              id: office.id, 
                              name: office.name, 
                              amount: office.pendingCommission
                            })}
                          >
                            <Wallet className="h-4 w-4" />
                            تحصيل
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Collection Dialog */}
      <Dialog open={!!collectionOffice} onOpenChange={(open) => !open && setCollectionOffice(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل مستحقات</DialogTitle>
            <DialogDescription>
              تسجيل تحصيل العمولات المستحقة من المكتب. سيتم تصفير المديونية وإعادة تفعيل المكتب إن كان موقوفاً.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">المكتب: {collectionOffice?.name}</span>
              <span className="text-xl font-bold text-primary">{collectionOffice && formatCurrency(collectionOffice.amount)}</span>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="notes">ملاحظات التحصيل (اختياري)</Label>
              <Textarea 
                id="notes" 
                placeholder="رقم الحوالة، طريقة الدفع..." 
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCollectionOffice(null)}>إلغاء</Button>
            <Button onClick={handleCollect} disabled={collectDuesMutation.isPending} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {collectDuesMutation.isPending ? "جاري التحصيل..." : "تأكيد التحصيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Kill Switch Dialog */}
      <Dialog open={isKillSwitchOpen} onOpenChange={setIsKillSwitchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              تأكيد الإيقاف التلقائي
            </DialogTitle>
            <DialogDescription>
              سيقوم هذا الإجراء بفحص جميع المكاتب والمحامين. أي مكتب تجاوز حد المديونية سيتم إيقافه تلقائياً ولن يتمكن من استقبال استشارات جديدة. المكاتب التي تم سداد مديونيتها سيتم إعادة تفعيلها.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsKillSwitchOpen(false)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleKillSwitch} disabled={killSwitchMutation.isPending}>
              {killSwitchMutation.isPending ? "جاري التنفيذ..." : "تأكيد وتنفيذ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}

// Ensure AlertTriangle is imported for the kill switch dialog
import { AlertTriangle } from "lucide-react";
