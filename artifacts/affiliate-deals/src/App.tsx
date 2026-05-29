import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/auth";
import { withAdminAuth } from "@/components/protected-route";
import NotFound from "@/pages/not-found";

import Home from "@/pages/home";
import Offers from "@/pages/offers";
import OfferDetail from "@/pages/offer-detail";
import Categories from "@/pages/categories";
import CategoryDetail from "@/pages/category-detail";
import Brands from "@/pages/brands";
import BrandDetail from "@/pages/brand-detail";
import BlogList from "@/pages/blog";
import BlogPostDetail from "@/pages/blog-detail";
import SearchResults from "@/pages/search";

import AdminLogin from "@/pages/admin/login";
import AdminDashboard from "@/pages/admin/dashboard";
import AdminOffers from "@/pages/admin/offers";
import AdminCategories from "@/pages/admin/categories";
import AdminBrands from "@/pages/admin/brands";
import AdminBlog from "@/pages/admin/blog";
import AdminIndexing from "@/pages/admin/indexing";
import AdminUsers from "@/pages/admin/users";

// Wrap admin pages with auth guard
const ProtectedDashboard = withAdminAuth(AdminDashboard);
const ProtectedOffers = withAdminAuth(AdminOffers);
const ProtectedCategories = withAdminAuth(AdminCategories);
const ProtectedBrands = withAdminAuth(AdminBrands);
const ProtectedBlog = withAdminAuth(AdminBlog);
const ProtectedIndexing = withAdminAuth(AdminIndexing);
const ProtectedUsers = withAdminAuth(AdminUsers);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/offers" component={Offers} />
      <Route path="/offers/:slug" component={OfferDetail} />
      <Route path="/categories" component={Categories} />
      <Route path="/categories/:slug" component={CategoryDetail} />
      <Route path="/brands" component={Brands} />
      <Route path="/brands/:slug" component={BrandDetail} />
      <Route path="/blog" component={BlogList} />
      <Route path="/blog/:slug" component={BlogPostDetail} />
      <Route path="/search" component={SearchResults} />

      <Route path="/admin/login" component={AdminLogin} />
      <Route path="/admin" component={ProtectedDashboard} />
      <Route path="/admin/offers" component={ProtectedOffers} />
      <Route path="/admin/categories" component={ProtectedCategories} />
      <Route path="/admin/brands" component={ProtectedBrands} />
      <Route path="/admin/blog" component={ProtectedBlog} />
      <Route path="/admin/indexing" component={ProtectedIndexing} />
      <Route path="/admin/users" component={ProtectedUsers} />

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
