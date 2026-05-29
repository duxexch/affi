import { Link } from "wouter";
import { Offer } from "@workspace/api-client-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function OfferCard({ offer }: { offer: Offer }) {
  return (
    <Link href={`/offers/${offer.slug}`} className="group block h-full">
      <Card className="h-full flex flex-col overflow-hidden transition-all hover-elevate toggle-elevate active-elevate group-hover:border-primary/50">
        <CardHeader className="p-0">
          <div className="aspect-[4/3] bg-muted relative overflow-hidden">
            {offer.imageUrl ? (
              <img 
                src={offer.imageUrl} 
                alt={offer.title} 
                className="object-cover w-full h-full transition-transform group-hover:scale-105" 
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm bg-secondary">
                No Image
              </div>
            )}
            {offer.discountPercent ? (
              <div className="absolute top-2 right-2">
                <Badge variant="destructive" className="font-bold text-sm shadow-md">
                  {offer.discountPercent}% OFF
                </Badge>
              </div>
            ) : null}
            {offer.isFeatured && (
              <div className="absolute top-2 left-2">
                <Badge className="bg-amber-500 hover:bg-amber-600 font-bold shadow-md text-amber-950">
                  FEATURED
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 p-5 flex flex-col gap-2">
          <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
            {offer.brandName && <span>{offer.brandName}</span>}
            {offer.brandName && offer.categoryName && <span>&bull;</span>}
            {offer.categoryName && <span>{offer.categoryName}</span>}
          </div>
          <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
            {offer.title}
          </h3>
          {offer.shortDescription && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
              {offer.shortDescription}
            </p>
          )}
        </CardContent>
        <CardFooter className="p-5 pt-0 flex items-center justify-between mt-auto">
          <div className="flex flex-col">
            {offer.originalPrice && offer.currentPrice ? (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {offer.currency || '$'}{offer.originalPrice}
                </span>
                <span className="font-bold text-xl text-foreground">
                  {offer.currency || '$'}{offer.currentPrice}
                </span>
              </>
            ) : offer.currentPrice ? (
              <span className="font-bold text-xl text-foreground">
                {offer.currency || '$'}{offer.currentPrice}
              </span>
            ) : (
              <span className="font-bold text-foreground">View Deal</span>
            )}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
