import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { Search, Menu, Zap, Tag, Hexagon, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function Layout({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const q = formData.get("q") as string;
    if (q) {
      setLocation(`/search?q=${encodeURIComponent(q)}`);
    }
  };

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
              <Link href="/offers" className="transition-colors hover:text-primary">Offers</Link>
              <Link href="/categories" className="transition-colors hover:text-primary">Categories</Link>
              <Link href="/brands" className="transition-colors hover:text-primary">Brands</Link>
              <Link href="/blog" className="transition-colors hover:text-primary">Blog</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <form onSubmit={handleSearch} className="hidden md:flex relative w-full max-w-sm items-center">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="q"
                placeholder="Search deals..."
                className="w-full bg-background shadow-none appearance-none pl-8 md:w-[200px] lg:w-[300px]"
              />
            </form>
            <Button variant="ghost" size="icon" className="md:hidden">
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      <main className="flex-1 container mx-auto px-4 py-8">
        {children}
      </main>
      <footer className="border-t py-8 bg-muted/40">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} AffiliateDeals. All rights reserved.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/admin" className="hover:text-primary">Admin Access</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
