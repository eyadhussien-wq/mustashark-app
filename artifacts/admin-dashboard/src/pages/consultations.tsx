import { Layout } from "@/components/layout";
import { useListAdminConsultations, getListAdminConsultationsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, translateStatus, translateConsultationType } from "@/lib/formatters";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
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

export default function Consultations() {
  const { token } = useAuth();
  
  const { data: consultations, isLoading } = useListAdminConsultations({
    query: { enabled: !!token, queryKey: getListAdminConsultationsQueryKey() }
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">سجل الاستشارات</h2>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>جميع الاستشارات ({consultations?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>الرقم المرجعي</TableHead>
                  <TableHead>العميل</TableHead>
                  <TableHead>المحامي</TableHead>
                  <TableHead>الموضوع</TableHead>
                  <TableHead>النوع</TableHead>
                  <TableHead>التاريخ والوقت</TableHead>
                  <TableHead>السعر (العمولة)</TableHead>
                  <TableHead>حالة الدفع</TableHead>
                  <TableHead>حالة الاستشارة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[120px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-8 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-6 w-[80px]" /></TableCell>
                    </TableRow>
                  ))
                ) : !consultations || consultations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-10 text-muted-foreground">
                      لا يوجد استشارات
                    </TableCell>
                  </TableRow>
                ) : (
                  consultations.map((consultation) => (
                    <TableRow key={consultation.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-mono text-xs text-muted-foreground">{consultation.serialNumber || "-"}</TableCell>
                      <TableCell className="font-medium">{consultation.clientName}</TableCell>
                      <TableCell>{consultation.lawyerName}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={consultation.subject}>
                        {consultation.subject}
                      </TableCell>
                      <TableCell>{translateConsultationType(consultation.type)}</TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{new Date(consultation.scheduledDate).toLocaleDateString('ar-QA')}</div>
                        <div className="text-xs text-muted-foreground">{consultation.scheduledTime}</div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(consultation.price)}</TableCell>
                      <TableCell>
                        <Badge variant={consultation.paymentStatus === 'paid' ? 'default' : 'outline'} 
                               className={consultation.paymentStatus === 'paid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}>
                          {translateStatus(consultation.paymentStatus)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          consultation.status === 'completed' ? 'default' : 
                          consultation.status === 'cancelled' ? 'destructive' : 
                          consultation.status === 'pending' ? 'secondary' : 'outline'
                        }>
                          {translateStatus(consultation.status)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </Layout>
  );
}
