import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Tag, Hexagon, Building2, FileText, Activity, LogOut, Menu, Users, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageSwitcher } from "@/components/language-switcher";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";
import { useLocation as useWouter } from "wouter";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [, navigate] = useWouter();
  const { logout, user } = useAuth();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard", exact: true },
    { href: "/admin/offers", icon: Tag, label: "Offers" },
    { href: "/admin/categories", icon: Hexagon, label: "Categories" },
    { href: "/admin/brands", icon: Building2, label: "Brands" },
    { href: "/admin/blog", icon: FileText, label: "Blog" },
    { href: "/admin/indexing", icon: Activity, label: "Indexing Queue" },
    { href: "/admin/users", icon: Users, label: "Users" },
  ];

  const handleLogout = async () => {
    await logout();
    toast({ title: "Signed out", description: "You have been logged out." });
    navigate("/admin/login");
  };

  const isActive = (item: { href: string; exact?: boolean }) =>
    item.exact ? location === item.href : location === item.href || location.startsWith(item.href + "/");

  const SidebarContent = () => (
    <>
      <div className="h-16 flex items-center px-6 border-b gap-2">
        <Zap className="h-5 w-5 text-primary" />
        <Link href="/" className="font-bold text-lg text-primary tracking-tight">Admin Console</Link>
      </div>
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
              isActive(item)
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}>
            <item.icon className="h-4 w-4 shrink-0" />
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <div className="px-3 py-2 text-xs text-muted-foreground truncate mb-2">{user?.email}</div>
        <Button variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground" onClick={handleLogout}>
          <LogOut className="h-4 w-4" /> Sign Out
        </Button>
      </div>
    </>
  );

  return (
    <div className="min-h-[100dvh] flex bg-muted/40">
      {/* Desktop sidebar */}
      <aside className="w-64 border-r bg-background hidden md:flex flex-col">
        <SidebarContent />
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <header className="h-16 flex items-center justify-between px-4 border-b bg-background md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon"><Menu className="h-5 w-5" /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
              <div className="flex flex-col h-full"><SidebarContent /></div>
            </SheetContent>
          </Sheet>
          <span className="font-bold text-primary">Admin Console</span>
          <LanguageSwitcher scope="admin" />
          <ThemeToggle />
        </header>

        {/* Desktop header bar */}
        <header className="hidden md:flex h-14 items-center justify-end px-8 border-b bg-background gap-3">
          <LanguageSwitcher scope="admin" />
          <ThemeToggle />
        </header>

        <div className="flex-1 p-6 md:p-8 overflow-auto">{children}</div>
      </main>
    </div>
  );
}
