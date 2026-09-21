import { createFileRoute, Link, notFound, useRouter } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { wpBlogApi, type WpPost } from "@/lib/api";
import { decodeHtmlEntities } from "@/lib/utils";

function getCategoryName(post: WpPost): string {
  const terms = post._embedded?.["wp:term"];
  if (terms) {
    for (const group of terms) {
      const cat = group.find((t) => t.taxonomy === "category");
      if (cat) return cat.name;
    }
  }
  return "Blog";
}

function getFeaturedImage(post: WpPost): string {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url) return media.source_url;

  const ogImg = post.yoast_head_json?.og_image?.[0]?.url;
  if (ogImg) return ogImg;

  return `https://picsum.photos/seed/${post.slug}/1200/630`;
}

function getFeaturedImageProps(
  post: WpPost,
  fallbackSize: string = "large"
): { src: string; srcSet?: string } {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) {
    const ogImg = post.yoast_head_json?.og_image?.[0]?.url;
    return { src: ogImg || `https://picsum.photos/seed/${post.slug}/1200/630` };
  }

  const defaultSrc = media.source_url;
  const sizes = media.media_details?.sizes;
  if (!sizes) {
    return { src: defaultSrc };
  }

  const srcSetParts: string[] = [];
  Object.values(sizes).forEach((sizeObj) => {
    if (sizeObj.source_url && sizeObj.width) {
      srcSetParts.push(`${sizeObj.source_url} ${sizeObj.width}w`);
    }
  });

  const fallbackSrc = sizes[fallbackSize]?.source_url || defaultSrc;

  if (srcSetParts.length > 0) {
    return {
      src: fallbackSrc,
      srcSet: srcSetParts.join(", "),
    };
  }

  return { src: defaultSrc };
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

// Clean HTML for description snippet
function cleanHtmlSnippet(html: string, length = 155): string {
  if (!html) return "";
  const cleaned = decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, "")
      .replace(/\s*\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]/g, "")
      .replace(/\s*(?:&hellip;|&#8230;|#8230;|\.\.\.)$/g, "")
  ).trim();
  return cleaned.slice(0, length) + (cleaned.length > length ? "..." : "");
}

// The SEO title / meta description set in WordPress (Yoast's panel) win when present; the post
// title and cleaned excerpt are only the fallback for posts where none has been set.
function getSeoTitle(post: WpPost): string {
  return decodeHtmlEntities(post.yoast_head_json?.title?.trim() || post.title.rendered);
}

function getSeoDescription(post: WpPost): string {
  const yoast = post.yoast_head_json?.description?.trim();
  return yoast ? decodeHtmlEntities(yoast) : cleanHtmlSnippet(post.excerpt.rendered || post.content.rendered);
}

function cleanWpExcerpt(html: string): string {
  if (!html) return "";
  const hasEllipsis = /\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]|(?:\s*&hellip;|\s*&#8230;|\s*#8230;|\s*\.\.\.)/.test(html);
  const cleaned = html
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#8217;/g, "'")
    .replace(/&#8211;/g, "-")
    .replace(/&#038;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/\s*\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]/g, "")
    .replace(/\s*(?:&hellip;|&#8230;|#8230;|\.\.\.)/g, "")
    .trim();
  return hasEllipsis ? cleaned + "..." : cleaned;
}

export const Route = createFileRoute("/blog_/$slug")({
  loader: async ({ params }): Promise<{ post: WpPost; recent: WpPost[] }> => {
    try {
      const post = await wpBlogApi.getBySlug(params.slug);
      if (!post) throw notFound();
      const recent = await wpBlogApi.getRecent(post.id, 3);
      return { post, recent };
    } catch {
      throw notFound();
    }
  },
  head: ({ loaderData, params }) => ({
    meta: loaderData
      ? [
        { title: getSeoTitle(loaderData.post) },
        {
          name: "description",
          content: getSeoDescription(loaderData.post),
        },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "og:title", content: getSeoTitle(loaderData.post) },
        {
          property: "og:description",
          content: getSeoDescription(loaderData.post),
        },
        {
          property: "og:image",
          content: getFeaturedImage(loaderData.post),
        },
      ]
      : [{ title: "Blog — Finding Global" }, { name: "robots", content: "index, follow" }],
    links: [
      {
        rel: "canonical",
        href: `https://findingglobal.com/blog/${params.slug}/`,
      },
    ],
  }),
  component: BlogDetailPage,
  errorComponent: ({ error, reset }) => {
    const router = useRouter();
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-3xl px-6 py-24 text-center">
          <h1 className="text-2xl font-extrabold">Could not load this blog post</h1>
          <p className="mt-2 text-sm text-steel-dark">{error.message}</p>
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="mt-6 rounded-sm bg-obsidian px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
          >
            Retry
          </button>
        </div>
        <SiteFooter />
      </div>
    );
  },
  notFoundComponent: () => (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-3xl font-extrabold">Blog post not found</h1>
        <p className="mt-2 text-sm text-steel-dark">
          This article may have been moved or removed.
        </p>
        <Link
          to="/blog/"
          className="mt-6 inline-block rounded-sm bg-obsidian px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-primary-foreground"
        >
          Back to blog
        </Link>
      </div>
      <SiteFooter />
    </div>
  ),
});

function BlogDetailPage() {
  const { post, recent } = Route.useLoaderData();
  const author = post._embedded?.author?.[0];
  const featuredImage = getFeaturedImage(post);
  const category = getCategoryName(post);
  const formattedDate = formatDate(post.date);

  const schemaJson = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": decodeHtmlEntities(post.title.rendered),
    "description": getSeoDescription(post),
    "image": featuredImage,
    "datePublished": post.date,
    "dateModified": post.modified || post.date,
    "author": {
      "@type": "Person",
      "name": author?.name || "Finding Global Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Finding Global",
      "logo": {
        "@type": "ImageObject",
        "url": "/minimallogo"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": `https://findingglobal.com/blog/${post.slug}/`
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <script type="application/ld+json">
        {JSON.stringify(schemaJson)}
      </script>
      <SiteHeader />

      {/* Breadcrumb */}
      <div className="border-b border-border bg-card px-6 py-4">
        <div className="mx-auto max-w-4xl text-xs font-bold uppercase tracking-widest text-steel-dark">
          <Link to="/blog/" className="hover:text-obsidian">Blog</Link>
          {category.toLowerCase() !== "blog" && (
            <>
              <span className="px-2">/</span>
              <span className="text-hyperblue">{category}</span>
            </>
          )}
          <span className="px-2">/</span>
          <span className="text-obsidian truncate max-w-xs inline-block align-bottom" dangerouslySetInnerHTML={{ __html: post.title.rendered }} />
        </div>
      </div>

      {/* Article Image, Title & Content */}
      <article className="px-6 py-12 md:py-16">
        <div className="mx-auto max-w-5xl">
          {/* Main image first */}
          <div className="w-full overflow-hidden rounded-[2rem] bg-white border border-border/50 mb-10 shadow-[0_16px_32px_-10px_rgba(0,0,0,0.06)] flex items-center justify-center">
            <img
              src={getFeaturedImageProps(post, "large").src}
              srcSet={getFeaturedImageProps(post, "large").srcSet}
              sizes="(max-width: 1024px) 100vw, 1024px"
              alt=""
              decoding="async"
              className="w-full h-auto max-h-[500px] object-contain"
            />
          </div>

          {/* Title & Metadata after image */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4 text-[10px] font-bold uppercase tracking-widest text-steel-dark">
              <span className="text-hyperblue">{category}</span>
              <span className="text-steel">·</span>
              <span>{formattedDate}</span>
            </div>

            <h1
              className="text-3xl md:text-4xl lg:text-4.5xl font-semibold tracking-tight text-obsidian leading-[1.2]"
              dangerouslySetInnerHTML={{ __html: post.title.rendered }}
            />
          </div>

          {/* HTML Rendered Content */}
          <div
            className="blog-content max-w-none"
            dangerouslySetInnerHTML={{
              __html: post.content.rendered.replace(/findingmena\.com/gi, 'findingglobal.com')
            }}
          />

          {/* CTA Box */}
          <div className="mt-16 rounded-3xl bg-blue-50/50 border border-blue-100/50 p-10 text-center relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-2xl font-bold text-obsidian mb-4">Ready to find your partner?</h4>
              <p className="text-steel-dark mb-8 max-w-md mx-auto">
                Finding Global connects you with vetted agencies globally based on your specific needs.
              </p>
              <Link
                to="/submit-project/"
                className="inline-flex items-center justify-center rounded-xl bg-hyperblue px-8 py-4 text-xs font-bold uppercase tracking-widest text-white hover:bg-obsidian hover:text-white transition-all active:scale-95 shadow-xl shadow-hyperblue/20"
              >
                Start Matching
              </Link>
            </div>
            <div className="absolute top-0 right-0 p-10 text-hyperblue opacity-5 pointer-events-none">
              <svg className="size-32" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      </article>

      {/* Recent Posts Section */}
      {recent.length > 0 && (
        <section className="border-t border-border bg-card px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="flex items-center justify-between mb-10">
              <div>
                <span className="eyebrow text-hyperblue">Keep Reading</span>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight">Recent Articles</h3>
              </div>
              <Link
                to="/blog/"
                className="text-xs font-bold uppercase tracking-widest text-obsidian hover:text-hyperblue"
              >
                All posts →
              </Link>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              {recent.map((item) => {
                const recImgProps = getFeaturedImageProps(item, "medium_large");
                const recCategory = getCategoryName(item);
                const recDate = formatDate(item.date);
                return (
                  <Link
                    key={item.id}
                    to="/blog/$slug"
                    params={{ slug: item.slug }}
                    className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-md transition-all duration-300 text-left"
                  >
                    <div className="aspect-[5/2] overflow-hidden bg-surface border-b border-border/50 flex items-center justify-center relative">
                      <img
                        src={recImgProps.src}
                        srcSet={recImgProps.srcSet}
                        sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-steel-dark">
                        <span className="text-hyperblue">{recCategory}</span>
                        <span className="text-steel-light/60">•</span>
                        <span>{recDate}</span>
                      </div>

                      <h4
                        className="text-lg font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors line-clamp-2 leading-snug"
                        dangerouslySetInnerHTML={{ __html: item.title.rendered }}
                      />

                      <p className="mt-3 flex-1 text-sm font-medium text-steel-dark line-clamp-2 leading-relaxed">
                        {cleanWpExcerpt(item.excerpt.rendered)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
