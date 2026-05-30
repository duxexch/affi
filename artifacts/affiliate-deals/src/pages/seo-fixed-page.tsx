import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Layout } from "@/components/layout";
import { Seo } from "@/components/seo";
import { useRoute } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { getPreferredGoogleLang, type GoogleLangCode } from "@/lib/google-translate";

type SeoFixedPageProps = {
  slug: string;
};

type SeoPageResponse = {
  id: number;
  slug: string;
  titleAr: string;
  titleEn: string;
  excerptAr: string | null;
  excerptEn: string | null;
  contentAr: string | null;
  contentEn: string | null;
  isPublished: boolean;
};

async function fetchSeoPage(slug: string): Promise<SeoPageResponse> {
  const res = await fetch(`/api/seo-pages/${encodeURIComponent(slug)}`);
  if (!res.ok) throw new Error("SEO page not found");
  return res.json();
}

function pickLangText<T>(ar: T | null | undefined, en: T | null | undefined, lang: GoogleLangCode) {
  return lang === "ar" ? ar ?? en : en ?? ar;
}

export function SeoFixedPage({ slug }: SeoFixedPageProps) {
  const lang = getPreferredGoogleLang();

  const { data, isLoading } = useQuery({
    queryKey: ["seo-page", slug],
    queryFn: () => fetchSeoPage(slug),
  });

  const title = useMemo(() => {
    if (!data) return undefined;
    return pickLangText(data.titleAr, data.titleEn, lang) as string;
  }, [data, lang]);

  const excerpt = useMemo(() => {
    if (!data) return undefined;
    const ex = pickLangText(data.excerptAr, data.excerptEn, lang);
    return ex ? String(ex) : undefined;
  }, [data, lang]);

  const content = useMemo(() => {
    if (!data) return "";
    const c = pickLangText(data.contentAr, data.contentEn, lang);
    return c ? String(c) : "";
  }, [data, lang]);

  if (isLoading) {
    return (
      <Layout>
        <div className="max-w-3xl mx-auto space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="aspect-[16/9] w-full rounded-xl" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
          </div>
        </div>
      </Layout>
    );
  }

  if (!data) {
    return (
      <Layout>
        <div className="text-center py-20">
          <h2 className="text-2xl font-bold mb-3">Page not found</h2>
          <p className="text-muted-foreground">The requested page is missing.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <Seo
        title={title}
        description={excerpt}
        url={`/${data.slug}`}
        type="website"
      />

      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            {title}
          </h1>
          {excerpt && (
            <p className="text-muted-foreground text-lg">{excerpt}</p>
          )}</header>

        {content ? (
          <div
            className="prose dark:prose-invert prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: content }}
          />
        ) : (
          <div className="text-muted-foreground">No content.</div>
        )}
      </div>
    </Layout>
  );
}
