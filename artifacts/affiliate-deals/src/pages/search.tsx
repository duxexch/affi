import { useSearch, getSearchQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useLocation } from "wouter";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function SearchResults() {
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1]);
  const q = searchParams.get('q') || '';

  const { data, isLoading } = useSearch(
    { q, page: 1 },
    { query: { enabled: !!q, queryKey: getSearchQueryKey({ q, page: 1 }) } }
  );

  return (
    <Layout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Search Results</h1>
        <p className="text-muted-foreground mt-2">
          {q ? `Showing results for "${q}"` : 'Enter a search query to find deals.'}
        </p>
      </div>

      {!q ? null : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="space-y-4">
          {data.items.map(item => (
            <Link key={`${item.type}-${item.id}`} href={
              item.type === 'offer' ? `/offers/${item.slug}` :
              item.type === 'category' ? `/categories/${item.slug}` :
              item.type === 'brand' ? `/brands/${item.slug}` :
              `/blog/${item.slug}`
            }>
              <Card className="hover-elevate transition-colors hover:border-primary/50">
                <CardContent className="p-4 flex items-center gap-4">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt="" className="w-16 h-16 rounded object-cover bg-muted" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-secondary flex items-center justify-center text-muted-foreground font-bold text-xl uppercase">
                      {item.title.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="uppercase text-[10px] tracking-wider font-semibold">
                        {item.type}
                      </Badge>
                    </div>
                    <h3 className="font-bold text-lg truncate group-hover:text-primary">{item.title}</h3>
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
          No results found for "{q}". Try a different search term.
        </div>
      )}
    </Layout>
  );
}
