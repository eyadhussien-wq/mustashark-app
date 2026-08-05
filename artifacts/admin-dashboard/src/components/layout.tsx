import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetAdminProfile, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { useQuery } from "@tanstack/react-query";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Building2, 
  Wallet,
  Trash2,
  FilePenLine,
  Star,
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const NAV_ITEMS = [
  { href: "/", label: "الرئيسية", icon: LayoutDashboard },
  { href: "/lawyers", label: "المحامين", icon: Briefcase },
  { href: "/clients", label: "العملاء", icon: Users },
  { href: "/consultations", label: "الاستشارات", icon: FileText },
  { href: "/offices", label: "المكاتب", icon: Building2 },
  { href: "/dues", label: "المستحقات", icon: Wallet },
  { href: "/deletion-requests", label: "طلبات الحذف", icon: Trash2, badge: "deletion" as const },
  { href: "/profile-changes", label: "تعديلات الملف", icon: FilePenLine, badge: "profileChanges" as const },
  { href: "/reviews", label: "التعليقات", icon: Star, badge: "reviews" as const },
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, token } = useAuth();
  
  const { data: profile } = useGetAdminProfile({
    query: { enabled: !!token, queryKey: getGetAdminProfileQueryKey() }
  });

  // Live count badge for deletion requests
  const { data: deletionData } = useQuery({
    queryKey: ["admin-deletion-requests-count"],
    queryFn: async () => {
      const t = localStorage.getItem("admin_token");
      if (!t) return { count: 0 };
      const res = await fetch("/api/admin/deletion-requests", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    enabled: !!token,
    refetchInterval: 30_000,
  });
  const deletionCount = deletionData?.count ?? 0;

  // Live count badge for profile change requests
  const { data: profileChangesData } = useQuery({
    queryKey: ["admin-profile-changes-count"],
    queryFn: async () => {
      const t = localStorage.getItem("admin_token");
      if (!t) return { count: 0 };
      const res = await fetch("/api/admin/profile-change-requests", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    enabled: !!token,
    refetchInterval: 30_000,
  });
  const profileChangesCount = profileChangesData?.count ?? 0;

  // Live count badge for pending text reviews
  const { data: reviewsData } = useQuery({
    queryKey: ["admin-reviews-count"],
    queryFn: async () => {
      const t = localStorage.getItem("admin_token");
      if (!t) return { count: 0 };
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (!res.ok) return { count: 0 };
      return res.json() as Promise<{ count: number }>;
    },
    enabled: !!token,
    refetchInterval: 30_000,
  });
  const reviewsCount = reviewsData?.count ?? 0;

  if (!token) return null;

  const badgeCounts: Record<string, number> = {
    deletion: deletionCount,
    profileChanges: profileChangesCount,
    reviews: reviewsCount,
  };

  const NavLinks = () => (
    <>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-sidebar-primary tracking-tight">مستشارك</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">لوحة تحكم الإدارة</p>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          const badgeCount = item.badge ? (badgeCounts[item.badge] ?? 0) : 0;
          const showBadge = badgeCount > 0;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-amber-500 text-white text-[10px] font-bold px-1.5">
                  {badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-sidebar-border mt-auto">
        <div className="flex items-center gap-3 mb-4 px-2">
          <div className="w-8 h-8 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground font-bold">
            {profile?.name?.charAt(0) || "م"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-sidebar-foreground truncate">{profile?.name || "مدير النظام"}</p>
            <p className="text-xs text-sidebar-foreground/60 truncate">{profile?.email || ""}</p>
          </div>
        </div>
        <Button variant="ghost" className="w-full justify-start text-sidebar-foreground/80 hover:text-destructive hover:bg-destructive/10" onClick={logout}>
          <LogOut className="h-5 w-5 ml-3" />
          تسجيل الخروج
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row w-full">
      {/* Mobile Header */}
      <header className="md:hidden flex items-center justify-between p-4 bg-sidebar text-sidebar-foreground border-b border-sidebar-border">
        <h1 className="text-xl font-bold text-sidebar-primary">مستشارك</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-sidebar-foreground">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64 p-0 bg-sidebar border-l border-sidebar-border flex flex-col">
            <NavLinks />
          </SheetContent>
        </Sheet>
      </header>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col bg-sidebar border-l border-sidebar-border shrink-0">
        <NavLinks />
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
