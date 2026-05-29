import { useGetOffer, useTrackOfferClick, getGetOfferQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, ArrowLeft, Tag } from "lucide-react";
import { Link } from "wouter";

export default function OfferDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  
  const { data: offer, isLoading } = useGetOffer(slug, {
    query: { enabled: !!slug, queryKey: getGetOfferQueryKey(slug) }
  });

  const trackClick = useTrackOfferClick();

  const handleGetDeal = () => {
    trackClick.mutate({ slug }, {
      onSuccess: (data) => {
        if (data && data.affiliateUrl) {
          window.open(data.affiliateUrl, "_blank");
        } else if (offer?.affiliateUrl) {
          window.open(offer.affiliateUrl, "_blank");
        }
      },
      onError: () => {
        if (offer?.affiliateUrl) {
          window.open(offer.affiliateUrl, "_blank");
        }
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="animate-pulse">
          <div className="h-8 w-32 bg-muted mb-6 rounded"></div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="aspect-[4/3] bg-muted rounded-xl"></div>
            <div className="space-y-4">
              <div className="h-10 w-3/4 bg-muted rounded"></div>
              <div className="h-6 w-1/4 bg-muted rounded"></div>
              <div className="h-24 w-full bg-muted rounded"></div>
              <div className="h-12 w-1/2 bg-muted rounded"></div>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!offer) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Offer Not Found</h2>
          <Button asChild>
            <Link href="/offers">Back to Offers</Link>
          </Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-6">
        <Link href="/offers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all offers
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start mb-16">
        <div className="relative rounded-2xl overflow-hidden border bg-card">
          {offer.imageUrl ? (
            <img 
              src={offer.imageUrl} 
              alt={offer.title} 
              className="w-full h-auto object-cover aspect-[4/3]"
            />
          ) : (
            <div className="w-full aspect-[4/3] flex flex-col items-center justify-center bg-muted text-muted-foreground">
              <Tag className="h-12 w-12 mb-2 opacity-50" />
              <span>No image available</span>
            </div>
          )}
          {offer.discountPercent && (
            <Badge variant="destructive" className="absolute top-4 right-4 text-lg px-3 py-1 shadow-lg">
              {offer.discountPercent}% OFF
            </Badge>
          )}
        </div>

        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap gap-2 items-center text-sm font-medium text-muted-foreground uppercase tracking-wider">
            {offer.brandLogoUrl ? (
               <img src={offer.brandLogoUrl} alt={offer.brandName || "Brand"} className="h-6 w-auto object-contain" />
            ) : offer.brandName ? (
               <span className="bg-secondary px-2 py-1 rounded text-foreground">{offer.brandName}</span>
            ) : null}
            {offer.categoryName && (
              <span className="flex items-center gap-2">
                <span>&bull;</span>
                <Link href={`/categories/${offer.categorySlug}`} className="hover:text-primary hover:underline">
                  {offer.categoryName}
                </Link>
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{offer.title}</h1>
          
          <div className="flex items-end gap-4">
            {offer.originalPrice && offer.currentPrice ? (
              <>
                <span className="text-4xl font-black text-foreground">
                  {offer.currency || '$'}{offer.currentPrice}
                </span>
                <span className="text-xl text-muted-foreground line-through pb-1">
                  {offer.currency || '$'}{offer.originalPrice}
                </span>
              </>
            ) : offer.currentPrice ? (
              <span className="text-4xl font-black text-foreground">
                {offer.currency || '$'}{offer.currentPrice}
              </span>
            ) : null}
          </div>

          <Button 
            size="lg" 
            className="w-full md:w-auto self-start text-lg font-bold px-8 h-14"
            onClick={handleGetDeal}
            disabled={trackClick.isPending}
            data-testid="button-get-deal"
          >
            {trackClick.isPending ? "Getting Deal..." : "Get Deal"}
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>

          {offer.description && (
            <div className="mt-4 prose dark:prose-invert max-w-none">
              <h3 className="text-xl font-bold mb-2">About this deal</h3>
              <div className="text-muted-foreground whitespace-pre-wrap">{offer.description}</div>
            </div>
          )}
        </div>
      </div>

      {offer.relatedOffers && offer.relatedOffers.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Similar Deals</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {offer.relatedOffers.map(related => (
              <OfferCard key={related.id} offer={related} />
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
