import { useGetOffer, useTrackOfferClick, getGetOfferQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { Seo, productJsonLd, breadcrumbJsonLd } from "@/components/seo";
import { OfferDetailSkeleton } from "@/components/skeletons";
import { useParams } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalLink, ArrowLeft, Tag, Copy, Check, Ticket } from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

interface Coupon {
  id: number;
  code: string;
  description?: string | null;
  type: string;
  value?: string | null;
  expiresAt?: string | null;
}

function CouponCard({ coupon }: { coupon: Coupon }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/40">
      <div className="flex-1 min-w-0">
        <div className="font-mono font-bold text-sm tracking-widest text-primary">{coupon.code}</div>
        {coupon.description && <div className="text-xs text-muted-foreground mt-0.5 truncate">{coupon.description}</div>}
        {coupon.value && (
          <div className="text-xs text-green-600 dark:text-green-400 font-medium mt-0.5">
            {coupon.type === "percentage" ? `${coupon.value}% off` : coupon.type === "fixed" ? `$${coupon.value} off` : "Free shipping"}
          </div>
        )}
      </div>
      <Button variant="outline" size="sm" className="shrink-0 gap-1.5" onClick={handleCopy}>
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
        {copied ? "Copied!" : "Copy"}
      </Button>
    </div>
  );
}

export default function OfferDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: offer, isLoading } = useGetOffer(slug, {
    query: { enabled: !!slug, queryKey: getGetOfferQueryKey(slug) }
  });

  const { data: coupons = [] } = useQuery<Coupon[]>({
    queryKey: ["offer-coupons", offer?.id],
    queryFn: async () => {
      const res = await fetch(`/api/offers/${offer!.id}/coupons`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!offer?.id,
  });

  const trackClick = useTrackOfferClick();

  const handleGetDeal = () => {
    trackClick.mutate({ slug }, {
      onSuccess: (data) => {
        if (data?.affiliateUrl) window.open(data.affiliateUrl, "_blank");
        else if (offer?.affiliateUrl) window.open(offer.affiliateUrl, "_blank");
      },
      onError: () => {
        if (offer?.affiliateUrl) window.open(offer.affiliateUrl, "_blank");
      }
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="mb-6">
          <Link href="/offers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to all offers
          </Link>
        </div>
        <OfferDetailSkeleton />
      </Layout>
    );
  }

  if (!offer) {
    return (
      <Layout>
        <Seo title="Offer Not Found" noindex />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Offer Not Found</h2>
          <Button asChild><Link href="/offers">Back to Offers</Link></Button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={offer.title}
        description={offer.shortDescription ?? undefined}
        image={offer.imageUrl ?? undefined}
        url={`/offers/${offer.slug}`}
        type="product"
        jsonLd={productJsonLd({
          title: offer.title,
          description: offer.shortDescription,
          imageUrl: offer.imageUrl,
          currentPrice: offer.currentPrice != null ? String(offer.currentPrice) : null,
          originalPrice: offer.originalPrice != null ? String(offer.originalPrice) : null,
          currency: offer.currency ?? "USD",
          brandName: offer.brandName,
          slug: offer.slug,
        })}
      />

      <div className="mb-6">
        <Link href="/offers" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to all offers
        </Link>
      </div>

      <div className="grid md:grid-cols-2 gap-10 items-start mb-16">
        <div className="relative rounded-2xl overflow-hidden border bg-card">
          {offer.imageUrl ? (
            <img src={offer.imageUrl} alt={offer.title} className="w-full h-auto object-cover aspect-[4/3]" />
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
                <span className="text-4xl font-black text-foreground">{offer.currency || "$"}{offer.currentPrice}</span>
                <span className="text-xl text-muted-foreground line-through pb-1">{offer.currency || "$"}{offer.originalPrice}</span>
              </>
            ) : offer.currentPrice ? (
              <span className="text-4xl font-black text-foreground">{offer.currency || "$"}{offer.currentPrice}</span>
            ) : null}
          </div>

          <Button
            size="lg"
            className="w-full md:w-auto self-start text-lg font-bold px-8 h-14"
            onClick={handleGetDeal}
            disabled={trackClick.isPending}
          >
            {trackClick.isPending ? "Getting Deal..." : "Get Deal"}
            <ExternalLink className="ml-2 h-5 w-5" />
          </Button>

          {coupons.length > 0 && (
            <Card className="mt-2">
              <CardHeader className="pb-3 pt-4 px-4">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Ticket className="h-4 w-4 text-primary" />
                  Coupon Codes ({coupons.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 space-y-2">
                {coupons.map(c => <CouponCard key={c.id} coupon={c} />)}
              </CardContent>
            </Card>
          )}

          {offer.description && (
            <div className="mt-2 prose dark:prose-invert max-w-none">
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
