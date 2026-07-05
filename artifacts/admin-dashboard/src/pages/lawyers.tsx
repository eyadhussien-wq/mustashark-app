import { Layout } from "@/components/layout";
import { useListAdminLawyers, getListAdminLawyersQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { translateCountry } from "@/lib/formatters";
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

export default function Lawyers() {
  const { token } = useAuth();
  
  const { data: lawyers, isLoading } = useListAdminLawyers({
    query: { enabled: !!token, queryKey: getListAdminLawyersQueryKey() }
  });

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">إدارة المحامين</h2>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>قائمة المحامين ({lawyers?.length || 0})</CardTitle>
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
                  <TableHead className="text-center">عدد الاستشارات</TableHead>
                  <TableHead>تاريخ الانضمام</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[200px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[150px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[80px]" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[40px] mx-auto" /></TableCell>
                      <TableCell><Skeleton className="h-4 w-[100px]" /></TableCell>
                    </TableRow>
                  ))
                ) : !lawyers || lawyers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-muted-foreground">
                      لا يوجد محامين مسجلين
                    </TableCell>
                  </TableRow>
                ) : (
                  lawyers.map((lawyer) => (
                    <TableRow key={lawyer.id} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{lawyer.name}</TableCell>
                      <TableCell>{lawyer.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">{lawyer.phone || "-"}</TableCell>
                      <TableCell>{lawyer.officeName || <span className="text-muted-foreground">-</span>}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {translateCountry(lawyer.country)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {lawyer.consultationsCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(lawyer.createdAt).toLocaleDateString('ar-QA')}
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
