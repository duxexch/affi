import { Link } from "wouter";
import { Brand } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";

export function BrandCard({ brand }: { brand: Brand }) {
  return (
    <Link href={`/brands/${brand.slug}`} className="group block h-full">
      <Card className="h-full overflow-hidden hover-elevate transition-all hover:border-primary/50 text-center py-6">
        <CardContent className="p-4 flex flex-col items-center gap-4">
          <div className="h-16 w-32 rounded-md bg-secondary flex items-center justify-center overflow-hidden p-2">
             {brand.logoUrl ? (
               <img src={brand.logoUrl} alt={brand.name} className="w-full h-full object-contain" />
             ) : (
               <span className="text-xl font-bold text-muted-foreground">{brand.name.charAt(0)}</span>
             )}
          </div>
          <div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{brand.name}</h3>
            {brand.offerCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">{brand.offerCount} deals</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
