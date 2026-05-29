import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { Seo, articleJsonLd, breadcrumbJsonLd } from "@/components/seo";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

function BlogDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Skeleton className="h-5 w-28" />
      <Skeleton className="h-12 w-3/4" />
      <Skeleton className="h-5 w-1/4" />
      <Skeleton className="aspect-[21/9] w-full rounded-xl" />
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 5 === 4 ? "w-4/5" : "w-full"}`} />
        ))}
      </div>
    </div>
  );
}

export default function BlogPostDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";

  const { data: post, isLoading } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) }
  });

  if (isLoading) {
    return <Layout><BlogDetailSkeleton /></Layout>;
  }

  if (!post) {
    return (
      <Layout>
        <Seo title="Post Not Found" noindex />
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <Link href="/blog" className="text-primary hover:underline font-medium">Back to Blog</Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={post.title}
        description={post.excerpt ?? undefined}
        image={post.imageUrl ?? undefined}
        url={`/blog/${post.slug}`}
        type="article"
        jsonLd={articleJsonLd({
          title: post.title,
          excerpt: post.excerpt,
          imageUrl: post.imageUrl,
          slug: post.slug,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        })}
      />

      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to blog
        </Link>

        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">{post.title}</h1>
          <div className="text-muted-foreground font-medium">
            Published on {format(new Date(post.createdAt), "MMMM d, yyyy")}
          </div>
        </header>

        {post.imageUrl && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border">
            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
          </div>
        )}

        {post.content && (
          <div
            className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </div>
    </Layout>
  );
}
