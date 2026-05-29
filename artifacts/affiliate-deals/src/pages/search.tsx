import { useSearch, getSearchQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Seo } from "@/components/seo";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search } from "lucide-react";

function SearchSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 rounded-lg border">
          <Skeleton className="w-16 h-16 rounded shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split("?")[1]);
  const q = searchParams.get("q") || "";

  const { data, isLoading } = useSearch(
    { q, page: 1 },
    { query: { enabled: !!q, queryKey: getSearchQueryKey({ q, page: 1 }) } }
  );

  return (
    <Layout>
      <Seo
        title={q ? `Results for "${q}"` : "Search"}
        description={q ? `Find the best deals matching "${q}" — offers, brands, categories, and blog articles.` : undefined}
        url={`/search${q ? `?q=${encodeURIComponent(q)}` : ""}`}
        noindex={!q}
      />
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Search className="h-7 w-7" /> Search Results
        </h1>
        <p className="text-muted-foreground mt-2">
          {q ? `Showing results for "${q}"` : "Enter a search query to find deals."}
        </p>
      </div>

      {!q ? null : isLoading ? (
        <SearchSkeleton />
      ) : data?.items && data.items.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground mb-4">{data.total} result{data.total !== 1 ? "s" : ""} found</p>
          {data.items.map(item => (
            <Link
              key={`${item.type}-${item.id}`}
              href={
                item.type === "offer" ? `/offers/${item.slug}` :
                item.type === "category" ? `/categories/${item.slug}` :
                item.type === "brand" ? `/brands/${item.slug}` :
                `/blog/${item.slug}`
              }
            >
              <Card className="transition-colors hover:border-primary/50 hover:shadow-sm cursor-pointer">
                <CardContent className="p-4 flex items-center gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-16 h-16 rounded object-cover bg-muted shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center text-muted-foreground font-bold text-xl uppercase shrink-0">
                      {item.title.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-semibold">
                        {item.type}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg truncate">{item.title}</h3>
                    {item.description && (
                      <p className="text-sm text-muted-foreground truncate">{item.description}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground bg-muted/30 rounded-lg">
          No results found for &ldquo;{q}&rdquo;. Try a different search term.
        </div>
      )}
    </Layout>
  );
}
