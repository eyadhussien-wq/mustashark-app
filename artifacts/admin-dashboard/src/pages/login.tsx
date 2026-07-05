import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { useAdminLogin } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const loginSchema = z.object({
  email: z.string().email({ message: "البريد الإلكتروني غير صالح" }),
  password: z.string().min(1, { message: "كلمة المرور مطلوبة" }),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const loginMutation = useAdminLogin();
  
  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(
      { data },
      {
        onSuccess: (result) => {
          login(result.token);
          queryClient.invalidateQueries();
          setLocation("/");
        },
        onError: (error: any) => {
          toast({
            variant: "destructive",
            title: "فشل تسجيل الدخول",
            description: error?.response?.data?.error || "البريد الإلكتروني أو كلمة المرور غير صحيحة",
          });
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-sidebar flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-sidebar-ring/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-sidebar-ring rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-sidebar-ring/20">
            <Shield className="w-8 h-8 text-sidebar-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold text-sidebar-foreground tracking-tight">مستشارك</h1>
          <p className="text-sidebar-foreground/60 mt-2 text-lg">بوابة إدارة المنصة</p>
        </div>

        <Card className="border-sidebar-border bg-card/95 backdrop-blur-sm shadow-2xl">
          <CardHeader>
            <CardTitle className="text-xl">تسجيل الدخول</CardTitle>
            <CardDescription>الرجاء إدخال بيانات الاعتماد للوصول إلى لوحة التحكم</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">البريد الإلكتروني</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@mustashark.com"
                  className="bg-background text-left"
                  dir="ltr"
                  {...form.register("email")}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">كلمة المرور</Label>
                <Input
                  id="password"
                  type="password"
                  className="bg-background text-left"
                  dir="ltr"
                  {...form.register("password")}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full mt-6 text-base h-11"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "جاري التحقق..." : "دخول"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
