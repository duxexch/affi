import { Link } from "wouter";
import { Category } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";

export function CategoryCard({ category }: { category: Category }) {
  return (
    <Link href={`/categories/${category.slug}`} className="group block">
      <Card className="overflow-hidden hover-elevate transition-all hover:border-primary/50 text-center py-6">
        <CardContent className="p-4 flex flex-col items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
             {category.imageUrl ? (
               <img src={category.imageUrl} alt={category.name} className="w-full h-full object-cover" />
             ) : (
               <span className="text-xl font-bold text-muted-foreground">{category.name.charAt(0)}</span>
             )}
          </div>
          <div>
            <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{category.name}</h3>
            {category.offerCount !== undefined && (
              <p className="text-xs text-muted-foreground mt-1">{category.offerCount} deals</p>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
