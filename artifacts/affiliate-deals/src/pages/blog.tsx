import { useListBlogPosts } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { format } from "date-fns";

export default function BlogList() {
  const { data, isLoading } = useListBlogPosts({ limit: 20 });

  return (
    <Layout>
      <div className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-extrabold tracking-tight">Deal Hunter's Blog</h1>
        <p className="text-lg text-muted-foreground mt-4">
          Tips, tricks, and buying guides to help you maximize your savings.
        </p>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-96 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : data?.items && data.items.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.items.map(post => (
            <Link key={post.id} href={`/blog/${post.slug}`} className="group block h-full">
              <Card className="h-full flex flex-col overflow-hidden hover-elevate transition-all hover:border-primary/50">
                {post.imageUrl && (
                  <CardHeader className="p-0">
                    <div className="aspect-[16/9] overflow-hidden bg-muted">
                      <img 
                        src={post.imageUrl} 
                        alt={post.title} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                  </CardHeader>
                )}
                <CardContent className="p-6 flex-1 flex flex-col justify-center">
                  <div className="text-sm text-muted-foreground mb-3 font-medium">
                    {format(new Date(post.createdAt), "MMMM d, yyyy")}
                  </div>
                  <h2 className="text-xl font-bold leading-tight group-hover:text-primary transition-colors mb-3">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-muted-foreground line-clamp-3">
                      {post.excerpt}
                    </p>
                  )}
                </CardContent>
                <CardFooter className="p-6 pt-0 mt-auto">
                  <span className="text-sm font-semibold text-primary">Read article &rarr;</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground bg-muted/30 rounded-xl">
          No blog posts found. Check back later!
        </div>
      )}
    </Layout>
  );
}
