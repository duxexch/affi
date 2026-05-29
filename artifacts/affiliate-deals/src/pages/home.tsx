import { useListOffers, useListCategories, useListBrands } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { CategoryCard } from "@/components/category-card";
import { BrandCard } from "@/components/brand-card";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { Zap, Tag, Hexagon, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Home() {
  const { data: offersData, isLoading: isLoadingOffers } = useListOffers({ featured: true, limit: 8 });
  const { data: categories, isLoading: isLoadingCategories } = useListCategories();
  const { data: brands, isLoading: isLoadingBrands } = useListBrands();

  return (
    <Layout>
      <section className="py-12 md:py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          The Deal-Hunter&apos;s <span className="text-primary">Command Center</span>
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
          Discover the sharpest discounts across top brands and categories. Curated daily, updated hourly.
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="font-bold text-lg rounded-full px-8 hover-elevate">
            <Link href="/offers">Browse All Deals</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="font-bold text-lg rounded-full px-8 hover-elevate">
            <Link href="/categories">View Categories</Link>
          </Button>
        </div>
      </section>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            Trending Offers
          </h2>
          <Link href="/offers" className="text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoadingOffers ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : offersData?.items && offersData.items.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {offersData.items.map(offer => (
              <OfferCard key={offer.id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            No trending offers found.
          </div>
        )}
      </section>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Hexagon className="h-6 w-6 text-primary" />
            Top Categories
          </h2>
          <Link href="/categories" className="text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoadingCategories ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : categories && categories.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {categories.slice(0, 6).map(category => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            No categories found.
          </div>
        )}
      </section>

      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Tag className="h-6 w-6 text-primary" />
            Popular Brands
          </h2>
          <Link href="/brands" className="text-primary font-medium hover:underline flex items-center gap-1">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        
        {isLoadingBrands ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
            ))}
          </div>
        ) : brands && brands.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {brands.slice(0, 5).map(brand => (
              <BrandCard key={brand.id} brand={brand} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
            No brands found.
          </div>
        )}
      </section>
    </Layout>
  );
}
