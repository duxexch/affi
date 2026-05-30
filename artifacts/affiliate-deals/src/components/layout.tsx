import { useState, type ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, Zap, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { LanguageSwitcher } from "@/components/language-switcher";
import { TranslationIFrame } from "@/components/translation-iframe";

export function Layout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = (new FormData(e.currentTarget).get("q") as string)?.trim();
    if (q) { setLocation(`/search?q=${encodeURIComponent(q)}`); setMobileOpen(false); }
  };

  const navLinks = [
    { href: "/offers", label: "Offers" },
    { href: "/categories", label: "Categories" },
    { href: "/brands", label: "Brands" },
    { href: "/blog", label: "Blog" },
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between mx-auto px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary">
              <Zap className="h-6 w-6" />
              <span>AffiliateDeals</span>
            </Link>
            <nav className="hidden md:flex items-center space-x-6 text-sm font-medium">
              {navLinks.map(l => (
                <Link key={l.href} href={l.href} className="transition-colors hover:text-primary">{l.label}</Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-sm items-center">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input type="search" name="q" placeholder="Search deals..." className="pl-8 w-[200px] lg:w-[300px]" />
            </form>
            <LanguageSwitcher scope="user" />
            <ThemeToggle />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-72">
                <div className="flex flex-col gap-6 pt-6">
                  <form onSubmit={handleSearch} className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input type="search" name="q" placeholder="Search deals..." className="pl-8 w-full" />
                  </form>
                  <nav className="flex flex-col gap-2">
                    {navLinks.map(l => (
                      <Link key={l.href} href={l.href} onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-md hover:bg-muted font-medium text-sm">
                        {l.label}
                      </Link>
                    ))}
                  </nav>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        <TranslationIFrame scope="user">{children}</TranslationIFrame>
      </main>
      <footer className="border-t py-8 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AffiliateDeals. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/admin" className="hover:text-primary">Admin</Link>
            <a href="/api/sitemap.xml" target="_blank" className="hover:text-primary">Sitemap</a>
            <a href="/api/robots.txt" target="_blank" className="hover:text-primary">Robots</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
