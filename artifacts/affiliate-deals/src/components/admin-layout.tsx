import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { LayoutDashboard, Tag, Hexagon, Building2, FileText, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

export function AdminLayout({ children }: { children: ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/offers", icon: Tag, label: "Offers" },
    { href: "/admin/categories", icon: Hexagon, label: "Categories" },
    { href: "/admin/brands", icon: Building2, label: "Brands" },
    { href: "/admin/blog", icon: FileText, label: "Blog" },
    { href: "/admin/indexing", icon: Activity, label: "Indexing Queue" },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-muted/40">
      <aside className="w-64 border-r bg-background hidden md:flex flex-col">
        <div className="h-16 flex items-center px-6 border-b">
          <Link href="/" className="font-bold text-lg text-primary tracking-tight">
            Admin Console
          </Link>
        </div>
        <nav className="flex-1 py-6 px-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/admin" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 flex items-center px-6 border-b bg-background md:hidden">
           <span className="font-bold">Admin Console</span>
        </header>
        <div className="flex-1 p-6 md:p-8 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
