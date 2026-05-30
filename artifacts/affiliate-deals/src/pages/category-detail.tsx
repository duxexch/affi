import { useGetCategory, useListOffers, getGetCategoryQueryKey, getListOffersQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { SocialLinks } from "@/components/social-links";
import { useParams, Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function CategoryDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  
  const { data: category, isLoading: isLoadingCategory } = useGetCategory(slug, {
    query: { enabled: !!slug, queryKey: getGetCategoryQueryKey(slug) }
  });

  const { data: offersData, isLoading: isLoadingOffers } = useListOffers(
    { categorySlug: slug, limit: 40 },
    { query: { enabled: !!slug, queryKey: getListOffersQueryKey({ categorySlug: slug, limit: 40 }) } }
  );

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/categories" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to categories
        </Link>
      </div>

      {isLoadingCategory ? (
        <div className="animate-pulse mb-8">
          <div className="h-10 w-1/3 bg-muted rounded mb-2"></div>
          <div className="h-6 w-1/2 bg-muted rounded"></div>
        </div>
      ) : category ? (
        <div className="mb-8">
          <h1 className="text-3xl font-bold flex items-center gap-4">
            {category.imageUrl && (
              <img src={category.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover bg-muted" />
            )}
            {category.name}
          </h1>
          {category.description && (
            <p className="text-muted-foreground mt-2 max-w-3xl">{category.description}</p>
          )}

            <SocialLinks
              whatsapp={(category as any).whatsapp}
              telegram={(category as any).telegram}
              facebook={(category as any).facebook}
              instagram={(category as any).instagram}
              email={(category as any).email}
              phone={(category as any).phone}
              website={(category as any).website}
            />
        </div>
      ) : (
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Category Not Found</h1>
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
          No offers found in this category.
        </div>
      )}
    </Layout>
  );
}
