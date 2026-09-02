import { Layout } from "@/components/layout";
import { useGetAdminOverview, getGetAdminOverviewQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency, translateStatus, translateConsultationType } from "@/lib/formatters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend } from "recharts";
import { Users, Briefcase, FileText, TrendingUp, AlertTriangle } from "lucide-react";

const COLORS = ['hsl(var(--chart-1))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

export default function Dashboard() {
  const { token } = useAuth();
  const { data, isLoading } = useGetAdminOverview({
    query: { enabled: !!token, queryKey: getGetAdminOverviewQueryKey() }
  });

  if (isLoading || !data) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 w-full rounded-xl" />)}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Skeleton className="h-[400px] w-full rounded-xl" />
            <Skeleton className="h-[400px] w-full rounded-xl" />
          </div>
          <Skeleton className="h-[500px] w-full rounded-xl" />
        </div>
      </Layout>
    );
  }

  const revenueData = [
    { name: "قطر", value: data.revenueQatar },
    { name: "الأردن", value: data.revenueJordan },
  ];
  const statusData = data.consultationsByStatus.map(s => ({ name: translateStatus(s.status), value: s.count }));

  const StatCard = ({ title, value, subtitle, icon: Icon, alert = false }: any) => (
    <Card className={`overflow-hidden relative ${alert ? 'border-destructive/50 shadow-sm shadow-destructive/10' : ''}`}>
      <div className={`absolute top-0 right-0 w-1 h-full ${alert ? 'bg-destructive' : 'bg-primary'}`} />
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${alert ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}><Icon className="h-4 w-4" /></div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8"><h2 className="text-3xl font-bold tracking-tight">نظرة عامة</h2></div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-1">
        <StatCard title="إجمالي العملاء" value={data.totalClients} icon={Users} />
        <StatCard title="إجمالي المحامين" value={data.totalLawyers} icon={Briefcase} />
        <StatCard title="إجمالي الاستشارات" value={data.totalConsultations} icon={FileText} />
        <StatCard title="مكاتب موقوفة" value={data.suspendedOffices} subtitle={`من إجمالي ${data.totalOffices} مكتب`} icon={AlertTriangle} alert={data.suspendedOffices > 0} />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-2">
        <StatCard title="إجمالي الإيرادات" value={formatCurrency(data.grossRevenue)} icon={TrendingUp} />
      </div>
      <div className="grid gap-6 md:grid-cols-2 mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-3">
        <Card><CardHeader><CardTitle>الإيرادات حسب الدولة</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={revenueData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={100} fill="#8884d8" dataKey="value">{revenueData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}</Pie><RechartsTooltip formatter={(value: number) => formatCurrency(value)} /><Legend /></PieChart></ResponsiveContainer></div></CardContent></Card>
        <Card><CardHeader><CardTitle>حالة الاستشارات</CardTitle></CardHeader><CardContent><div className="h-[300px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={statusData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}><CartesianGrid strokeDasharray="3 3" horizontal={false} /><XAxis type="number" /><YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12 }} /><RechartsTooltip /><Bar dataKey="value" name="العدد" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart></ResponsiveContainer></div></CardContent></Card>
      </div>
      <Card className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500 stagger-4">
        <CardHeader><CardTitle>أحدث الاستشارات</CardTitle></CardHeader>
        <CardContent><div className="rounded-md border"><Table><TableHeader><TableRow><TableHead>الرقم المرجعي</TableHead><TableHead>العميل</TableHead><TableHead>المحامي</TableHead><TableHead>الموضوع</TableHead><TableHead>النوع</TableHead><TableHead>التاريخ والوقت</TableHead><TableHead>المبلغ</TableHead><TableHead>الحالة</TableHead></TableRow></TableHeader><TableBody>
          {data.recentConsultations.length === 0 ? <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد استشارات</TableCell></TableRow> : data.recentConsultations.map((consultation) => <TableRow key={consultation.id}><TableCell className="font-mono text-xs">{consultation.serialNumber || "-"}</TableCell><TableCell>{consultation.clientName}</TableCell><TableCell>{consultation.lawyerName}</TableCell><TableCell className="max-w-[200px] truncate" title={consultation.subject}>{consultation.subject}</TableCell><TableCell>{translateConsultationType(consultation.type)}</TableCell><TableCell><div className="text-sm">{new Date(consultation.scheduledDate).toLocaleDateString('ar-QA')}</div><div className="text-xs text-muted-foreground">{consultation.scheduledTime}</div></TableCell><TableCell className="font-medium">{formatCurrency(consultation.price)}</TableCell><TableCell><Badge variant={consultation.status === 'completed' ? 'default' : consultation.status === 'pending' ? 'secondary' : 'outline'}>{translateStatus(consultation.status)}</Badge></TableCell></TableRow>)}
        </TableBody></Table></div></CardContent>
      </Card>
    </Layout>
  );
}
