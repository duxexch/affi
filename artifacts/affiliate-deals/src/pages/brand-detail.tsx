import { useGetBrand, useListOffers, getGetBrandQueryKey, getListOffersQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { useParams, Link } from "wouter";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BrandDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  
  const { data: brand, isLoading: isLoadingBrand } = useGetBrand(slug, {
    query: { enabled: !!slug, queryKey: getGetBrandQueryKey(slug) }
  });

  const { data: offersData, isLoading: isLoadingOffers } = useListOffers(
    { brandSlug: slug, limit: 40 },
    { query: { enabled: !!slug, queryKey: getListOffersQueryKey({ brandSlug: slug, limit: 40 }) } }
  );

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/brands" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to brands
        </Link>
      </div>

      {isLoadingBrand ? (
        <div className="animate-pulse mb-8">
          <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
          <div className="h-6 w-1/2 bg-muted rounded"></div>
        </div>
      ) : brand ? (
        <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-4">
              {brand.logoUrl && (
                <img src={brand.logoUrl} alt="" className="w-auto h-12 object-contain bg-white rounded p-1 border" />
              )}
              {brand.name}
            </h1>
            {brand.description && (
              <p className="text-muted-foreground mt-2 max-w-3xl">{brand.description}</p>
            )}
          </div>
          {brand.websiteUrl && (
            <Button variant="outline" asChild>
              <a href={brand.websiteUrl} target="_blank" rel="noopener noreferrer">
                Visit Website <ExternalLink className="ml-2 h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Brand Not Found</h1>
        </div>
      )}
      
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
          No offers found for this brand.
        </div>
      )}
    </Layout>
  );
}
