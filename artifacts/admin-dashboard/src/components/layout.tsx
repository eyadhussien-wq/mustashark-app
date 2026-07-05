import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useGetAdminProfile, getGetAdminProfileQueryKey } from "@workspace/api-client-react";
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  FileText, 
  Building2, 
  Wallet,
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
];

export function Layout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const { logout, token } = useAuth();
  
  const { data: profile } = useGetAdminProfile({
    query: { enabled: !!token, queryKey: getGetAdminProfileQueryKey() }
  });

  if (!token) return null;

  const NavLinks = () => (
    <>
      <div className="px-4 py-6">
        <h1 className="text-2xl font-bold text-sidebar-primary tracking-tight">مستشارك</h1>
        <p className="text-xs text-sidebar-foreground/60 mt-1">لوحة تحكم الإدارة</p>
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground'}`}>
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
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
