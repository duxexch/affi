import { useGetBlogPost, getGetBlogPostQueryKey } from "@workspace/api-client-react";
import { Layout } from "@/components/layout";
import { useParams, Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

export default function BlogPostDetail() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug || "";
  
  const { data: post, isLoading } = useGetBlogPost(slug, {
    query: { enabled: !!slug, queryKey: getGetBlogPostQueryKey(slug) }
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto animate-pulse">
          <div className="h-6 w-32 bg-muted mb-8 rounded"></div>
          <div className="h-12 w-3/4 bg-muted mb-4 rounded"></div>
          <div className="h-6 w-1/4 bg-muted mb-8 rounded"></div>
          <div className="aspect-[21/9] bg-muted mb-10 rounded-xl"></div>
          <div className="space-y-4">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-4">Post Not Found</h2>
          <Link href="/blog" className="text-primary hover:underline font-medium">
            Back to Blog
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <Link href="/blog" className="inline-flex items-center text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to blog
        </Link>
        
        <header className="mb-10">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
            {post.title}
          </h1>
          <div className="text-muted-foreground font-medium">
            Published on {format(new Date(post.createdAt), "MMMM d, yyyy")}
          </div>
        </header>

        {post.imageUrl && (
          <div className="mb-12 rounded-2xl overflow-hidden shadow-lg border">
            <img src={post.imageUrl} alt={post.title} className="w-full h-auto object-cover" />
          </div>
        )}

        {post.content && typeof window !== 'undefined' && (
          <div 
            className="prose dark:prose-invert prose-lg max-w-none prose-headings:font-bold prose-a:text-primary"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />
        )}
      </div>
    </Layout>
  );
}
