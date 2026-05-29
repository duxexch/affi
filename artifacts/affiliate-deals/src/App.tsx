import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
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

import AdminDashboard from "@/pages/admin/dashboard";
import AdminOffers from "@/pages/admin/offers";
import AdminCategories from "@/pages/admin/categories";
import AdminBrands from "@/pages/admin/brands";
import AdminBlog from "@/pages/admin/blog";
import AdminIndexing from "@/pages/admin/indexing";

const queryClient = new QueryClient();

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
      
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/offers" component={AdminOffers} />
      <Route path="/admin/categories" component={AdminCategories} />
      <Route path="/admin/brands" component={AdminBrands} />
      <Route path="/admin/blog" component={AdminBlog} />
      <Route path="/admin/indexing" component={AdminIndexing} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
