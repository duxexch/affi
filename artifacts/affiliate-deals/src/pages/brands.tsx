import { useListBrands } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { BrandCard } from "@/components/brand-card";

export default function Brands() {
  const { data: brands, isLoading } = useListBrands();

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Brands</h1>
        <p className="text-muted-foreground mt-2">Find the best deals from your favorite brands.</p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="h-32 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : brands && brands.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {brands.map(brand => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
          No brands found.
        </div>
      )}
    </Layout>
  );
}
