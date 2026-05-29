import { useEffect } from "react";

interface SeoProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: "website" | "article" | "product";
  noindex?: boolean;
  jsonLd?: object;
}

const SITE_NAME = "AffiliateDeals";
const DEFAULT_DESC = "Discover the sharpest discounts across top brands and categories. Curated daily.";
const BASE_URL = typeof window !== "undefined" ? window.location.origin : "https://affiliatedeals.replit.app";

export function Seo({ title, description, image, url, type = "website", noindex = false, jsonLd }: SeoProps) {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : SITE_NAME;
  const desc = description ?? DEFAULT_DESC;
  const canonicalUrl = url ? `${BASE_URL}${url}` : BASE_URL;

  useEffect(() => {
    document.title = fullTitle;
    setMeta("description", desc);
    setMeta("robots", noindex ? "noindex,nofollow" : "index,follow");

    // Open Graph
    setOg("og:title", fullTitle);
    setOg("og:description", desc);
    setOg("og:type", type);
    setOg("og:url", canonicalUrl);
    if (image) setOg("og:image", image);
    setOg("og:site_name", SITE_NAME);

    // Twitter
    setMeta("twitter:card", image ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", desc);
    if (image) setMeta("twitter:image", image);

    // Canonical
    setCanonical(canonicalUrl);

    // JSON-LD
    if (jsonLd) setJsonLd(jsonLd);

    return () => {
      if (jsonLd) removeJsonLd();
    };
  }, [fullTitle, desc, canonicalUrl, image, type, noindex, jsonLd]);

  return null;
}

function setMeta(name: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.name = name;
    document.head.appendChild(el);
  }
  el.content = content;
}

function setOg(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function setCanonical(href: string) {
  let el = document.querySelector<HTMLLinkElement>(`link[rel="canonical"]`);
  if (!el) {
    el = document.createElement("link");
    el.rel = "canonical";
    document.head.appendChild(el);
  }
  el.href = href;
}

function setJsonLd(data: object) {
  removeJsonLd();
  const script = document.createElement("script");
  script.type = "application/ld+json";
  script.id = "page-jsonld";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

function removeJsonLd() {
  document.getElementById("page-jsonld")?.remove();
}

// JSON-LD generators
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/logo.png`,
    sameAs: [],
  };
}

export function productJsonLd(offer: {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  currentPrice?: string | null;
  originalPrice?: string | null;
  currency?: string;
  brandName?: string | null;
  slug: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: offer.title,
    description: offer.description ?? undefined,
    image: offer.imageUrl ?? undefined,
    brand: offer.brandName ? { "@type": "Brand", name: offer.brandName } : undefined,
    offers: {
      "@type": "Offer",
      url: `${BASE_URL}/offers/${offer.slug}`,
      priceCurrency: offer.currency ?? "USD",
      price: offer.currentPrice ?? offer.originalPrice ?? "0",
      availability: "https://schema.org/InStock",
    },
  };
}

export function articleJsonLd(post: {
  title: string;
  excerpt?: string | null;
  imageUrl?: string | null;
  slug: string;
  createdAt: string;
  updatedAt: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.excerpt ?? undefined,
    image: post.imageUrl ?? undefined,
    url: `${BASE_URL}/blog/${post.slug}`,
    datePublished: post.createdAt,
    dateModified: post.updatedAt,
    author: { "@type": "Organization", name: SITE_NAME },
    publisher: { "@type": "Organization", name: SITE_NAME },
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: `${BASE_URL}${item.url}`,
    })),
  };
}
