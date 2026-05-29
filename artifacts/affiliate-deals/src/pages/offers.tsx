import { useListOffers } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { OfferCard } from "@/components/offer-card";
import { useLocation } from "wouter";

export default function Offers() {
  const { data, isLoading } = useListOffers({ limit: 40 });

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">All Offers</h1>
        <p className="text-muted-foreground mt-2">Browse the latest deals and discounts.</p>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {data.items.map(offer => (
            <OfferCard key={offer.id} offer={offer} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
          No offers found.
        </div>
      )}
    </Layout>
  );
}
