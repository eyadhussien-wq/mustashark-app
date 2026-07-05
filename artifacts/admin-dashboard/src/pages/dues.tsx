import { useState } from "react";
import { Layout } from "@/components/layout";
import { 
  useGetAdminDuesReport, 
  useCollectAdminDues,
  getGetAdminOverviewQueryKey,
  getListAdminOfficesQueryKey,
  getGetAdminDuesReportQueryKey
} from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/formatters";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
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
import { Wallet, AlertTriangle, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Dues() {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [collectionTarget, setCollectionTarget] = useState<{
    id: string, 
    type: 'office' | 'lawyer',
    name: string, 
    amount: number
  } | null>(null);
  const [notes, setNotes] = useState("");

  const { data: duesReport, isLoading } = useGetAdminDuesReport({
    query: { enabled: !!token, queryKey: getGetAdminDuesReportQueryKey() }
  });

  const collectDuesMutation = useCollectAdminDues({
    mutation: {
      onSuccess: (result) => {
        toast({
          title: "تم تحصيل المستحقات",
          description: `تم تحصيل ${formatCurrency(result.totalCollected)} بنجاح.`,
        });
        queryClient.invalidateQueries({ queryKey: getGetAdminDuesReportQueryKey() });
        queryClient.invalidateQueries({ queryKey: getListAdminOfficesQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetAdminOverviewQueryKey() });
        setCollectionTarget(null);
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
    if (!collectionTarget) return;
    
    const input = collectionTarget.type === 'office' 
      ? { officeId: collectionTarget.id, notes }
      : { lawyerId: collectionTarget.id, notes };
      
    collectDuesMutation.mutate({ data: input });
  };

  const totalPending = duesReport?.reduce((sum, row) => sum + row.totalPendingCommission, 0) || 0;
  const exceeders = duesReport?.filter(r => r.exceedsThreshold).length || 0;

  return (
    <Layout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">تقرير المستحقات</h2>
          <p className="text-muted-foreground mt-1">تقرير تفصيلي بعمولات المنصة المستحقة للتحصيل</p>
        </div>
        <div className="flex gap-4">
          <Card className="bg-primary text-primary-foreground">
            <CardContent className="p-4 flex items-center gap-4">
              <Wallet className="h-8 w-8 opacity-80" />
              <div>
                <p className="text-sm font-medium opacity-80">إجمالي المطلوب تحصيله</p>
                <p className="text-2xl font-bold">{formatCurrency(totalPending)}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10 border-destructive/20">
            <CardContent className="p-4 flex items-center gap-4">
              <AlertTriangle className="h-8 w-8 text-destructive opacity-80" />
              <div>
                <p className="text-sm font-medium text-destructive opacity-80">جهات تجاوزت الحد</p>
                <p className="text-2xl font-bold text-destructive">{exceeders}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>تفصيل المستحقات</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>الجهة</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead className="text-center">عدد الاستشارات</TableHead>
                  <TableHead className="text-left">إجمالي التعاملات</TableHead>
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
                      <TableCell><Skeleton className="h-6 w-[60px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[40px] mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] mr-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] mr-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px] mr-auto" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px] mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[100px] mr-auto" /></TableCell>
                    </TableRow>
                  ))
                ) : !duesReport || duesReport.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                      لا يوجد مستحقات معلقة
                    </TableCell>
                  </TableRow>
                ) : (
                  duesReport.map((row, index) => {
                    const isOffice = !!row.officeId;
                    const entityName = isOffice ? row.officeName : row.lawyerName;
                    const entityId = (isOffice ? row.officeId : row.lawyerId) as string;
                    
                    return (
                      <TableRow key={index} className={`transition-colors hover:bg-muted/50 ${row.exceedsThreshold ? 'bg-destructive/5' : ''}`}>
                        <TableCell className="font-medium">{entityName}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-background">
                            {isOffice ? 'مكتب' : 'محامي مستقل'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">{row.pendingCount}</TableCell>
                        <TableCell className="text-left font-mono">{formatCurrency(row.totalGross)}</TableCell>
                        <TableCell className="text-left font-mono text-muted-foreground">{formatCurrency(row.debtThreshold)}</TableCell>
                        <TableCell className={`text-left font-mono font-bold ${row.exceedsThreshold ? 'text-destructive' : 'text-primary'}`}>
                          {formatCurrency(row.totalPendingCommission)}
                        </TableCell>
                        <TableCell className="text-center">
                          {row.isSuspended ? (
                            <Badge variant="destructive">موقوف</Badge>
                          ) : row.exceedsThreshold ? (
                            <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">تجاوز الحد</Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">طبيعي</span>
                          )}
                        </TableCell>
                        <TableCell className="text-left">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="gap-2"
                            disabled={row.totalPendingCommission <= 0}
                            onClick={() => setCollectionTarget({
                              id: entityId,
                              type: isOffice ? 'office' : 'lawyer',
                              name: entityName, 
                              amount: row.totalPendingCommission
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
      <Dialog open={!!collectionTarget} onOpenChange={(open) => !open && setCollectionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تحصيل مستحقات</DialogTitle>
            <DialogDescription>
              تسجيل تحصيل العمولات المستحقة من {collectionTarget?.type === 'office' ? 'المكتب' : 'المحامي'}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
              <span className="font-medium">الجهة: {collectionTarget?.name}</span>
              <span className="text-xl font-bold text-primary">{collectionTarget && formatCurrency(collectionTarget.amount)}</span>
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
            <Button variant="outline" onClick={() => setCollectionTarget(null)}>إلغاء</Button>
            <Button onClick={handleCollect} disabled={collectDuesMutation.isPending} className="gap-2">
              <CheckCircle className="h-4 w-4" />
              {collectDuesMutation.isPending ? "جاري التحصيل..." : "تأكيد التحصيل"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
