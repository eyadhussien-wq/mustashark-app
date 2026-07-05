import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  useListAdminClients,
  useUpdateClientStatus,
  getListAdminClientsQueryKey,
  type AdminClient,
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
import { MoreHorizontal, Ban, ShieldCheck } from "lucide-react";

type ClientStatus = "active" | "blocked";

export default function Clients() {
  const { token } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [blockTarget, setBlockTarget] = useState<AdminClient | null>(null);

  const { data: clients, isLoading } = useListAdminClients({
    query: { enabled: !!token, queryKey: getListAdminClientsQueryKey() },
  });

  const statusMutation = useUpdateClientStatus({
    mutation: {
      onSuccess: (_data, variables) => {
        toast({
          title: "تم تحديث الحالة",
          description:
            variables.data.status === "blocked"
              ? "تم حظر العميل بنجاح."
              : "تم رفع الحظر عن العميل.",
        });
        queryClient.invalidateQueries({
          queryKey: getListAdminClientsQueryKey(),
        });
        setBlockTarget(null);
      },
      onError: () => {
        toast({
          variant: "destructive",
          title: "خطأ",
          description: "تعذّر تحديث حالة العميل. حاول مرة أخرى.",
        });
      },
    },
  });

  const applyStatus = (clientId: string, status: ClientStatus) => {
    statusMutation.mutate({ id: clientId, data: { status } });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-3xl font-bold tracking-tight">إدارة العملاء</h2>
      </div>

      <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        <CardHeader>
          <CardTitle>قائمة العملاء ({clients?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>الاسم</TableHead>
                  <TableHead>البريد الإلكتروني</TableHead>
                  <TableHead>رقم الهاتف</TableHead>
                  <TableHead>الدولة</TableHead>
                  <TableHead>الحالة</TableHead>
                  <TableHead className="text-center">عدد الاستشارات</TableHead>
                  <TableHead>تاريخ التسجيل</TableHead>
                  <TableHead className="text-left">إجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 8 }).map((__, j) => (
                        <TableCell key={j}>
                          <Skeleton className="h-4 w-[100px]" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : !clients || clients.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center py-10 text-muted-foreground"
                    >
                      لا يوجد عملاء مسجلون
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="transition-colors hover:bg-muted/50"
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell dir="ltr" className="text-right">
                        {client.phone || "-"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-background">
                          {translateCountry(client.country)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={accountStatusVariant(client.status)}>
                          {translateAccountStatus(client.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {client.consultationsCount}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(client.createdAt).toLocaleDateString("ar-QA")}
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-start">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                disabled={statusMutation.isPending}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">إجراءات</span>
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {client.status === "blocked" ? (
                                <DropdownMenuItem
                                  onClick={() => applyStatus(client.id, "active")}
                                  className="gap-2"
                                >
                                  <ShieldCheck className="h-4 w-4" />
                                  رفع الحظر
                                </DropdownMenuItem>
                              ) : (
                                <DropdownMenuItem
                                  onClick={() => setBlockTarget(client)}
                                  className="gap-2 text-destructive focus:text-destructive"
                                >
                                  <Ban className="h-4 w-4" />
                                  حظر الحساب
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
        open={!!blockTarget}
        onOpenChange={(open) => !open && setBlockTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حظر حساب العميل</AlertDialogTitle>
            <AlertDialogDescription>
              {blockTarget
                ? `سيتم حظر «${blockTarget.name}» ومنعه من حجز استشارات جديدة. يمكنك رفع الحظر لاحقاً.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() =>
                blockTarget && applyStatus(blockTarget.id, "blocked")
              }
            >
              حظر الحساب
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
