import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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

function cleanWpExcerpt(html: string): string {
  if (!html) return "";
  const hasEllipsis = /\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]|(?:\s*&hellip;|\s*&#8230;|\s*#8230;|\s*\.\.\.)/.test(html);
  const cleaned = decodeHtmlEntities(
    html
      .replace(/<[^>]+>/g, "")
      .replace(/\s*\[(?:&hellip;|&#8230;|#8230;|\.\.\.)\]/g, "")
      .replace(/\s*(?:&hellip;|&#8230;|#8230;|\.\.\.)/g, "")
  ).trim();
  return hasEllipsis ? cleaned + "..." : cleaned;
}

function getFeaturedImage(post: WpPost): string {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (media?.source_url) return media.source_url;

  const ogImg = post.yoast_head_json?.og_image?.[0]?.url;
  if (ogImg) return ogImg;

  return `https://picsum.photos/seed/${post.slug}/800/450`;
}

function getFeaturedImageProps(
  post: WpPost,
  fallbackSize: string = "large"
): { src: string; srcSet?: string } {
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  if (!media) {
    const ogImg = post.yoast_head_json?.og_image?.[0]?.url;
    return { src: ogImg || `https://picsum.photos/seed/${post.slug}/800/450` };
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

export const Route = createFileRoute("/blog")({
  loader: async (): Promise<WpPost[]> => {
    return wpBlogApi.list(30);
  },
  head: () => ({
    meta: [
      { title: "Resources — Finding Global" },
      {
        name: "description",
        content:
          "Procurement playbooks, industry benchmarks, and agency guides for marketing and tech leaders globally.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Finding Global Resources" },
      {
        property: "og:description",
        content: "Practical guides for working with agencies globally.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/blog/" },
    ],
  }),
  component: BlogIndex,
});

function BlogIndex() {
  const posts = Route.useLoaderData();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(posts.map((p) => getCategoryName(p))))];

  const filteredPosts =
    selectedCategory === "All"
      ? posts
      : posts.filter((p) => getCategoryName(p) === selectedCategory);

  const featuredPost = filteredPosts[0];
  const gridPosts = filteredPosts.slice(1);

  const getCategoryCount = (catName: string) => {
    if (catName === "All") return posts.length;
    return posts.filter((p) => getCategoryName(p) === catName).length;
  };

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      {/* Hero Section */}
      <section className="relative overflow-hidden px-6 py-10 md:py-12 border-b border-border/40">
        {/* Floating gradient blur lights */}
        <div className="absolute top-1/4 left-[5%] size-[280px] rounded-full bg-hyperblue/[0.04] blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[5%] size-[280px] rounded-full bg-purple-600/[0.02] blur-[100px] pointer-events-none" />
        <div className="architectural-grid pointer-events-none absolute inset-0 z-0 opacity-20" />

        <div className="relative z-10 mx-auto max-w-7xl text-center md:text-left">


          <h1 className="text-balance text-3xl font-extrabold leading-[1.15] tracking-tight md:text-5xl max-w-4xl">
            Playbooks, benchmarks, and guides for{" "}
            <span className="text-hyperblue">global marketing leaders.</span>
          </h1>

          <p className="mt-4 max-w-2xl text-base font-medium text-steel-dark leading-relaxed">
            Practical knowledge directly from verified agencies and experts globally. Real insights, zero fluff.
          </p>
        </div>
      </section>

      {/* Main Content Section */}
      <section className="px-6 py-8 md:py-10">
        <div className="mx-auto max-w-7xl">
          {/* Category Filters */}
          <div className="mb-10 flex flex-col gap-3">
            <span className="text-[10px] font-bold uppercase tracking-widest text-steel-dark">Filter by Topic</span>
            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = selectedCategory === cat;
                const count = getCategoryCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-full border transition-all duration-300 cursor-pointer ${isActive
                        ? "bg-hyperblue border-hyperblue text-white shadow-sm shadow-hyperblue/20 scale-[1.02]"
                        : "bg-card border-border/50 text-steel-dark hover:border-steel hover:text-obsidian"
                      }`}
                  >
                    {cat}
                    <span className={`inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[9px] ${isActive ? "bg-white/20 text-white" : "bg-surface-muted text-steel-dark"
                      }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {filteredPosts.length === 0 ? (
            <div className="text-center py-14 bg-card rounded-2xl border border-border/50">
              <h2 className="text-2xl font-bold text-obsidian">No articles found in this category.</h2>
            </div>
          ) : (
            <div className="space-y-12">

              {/* Featured Post Card (Hero layout) */}
              {featuredPost && (
                <Link
                  to="/blog/$slug"
                  params={{ slug: featuredPost.slug }}
                  className="group grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-md transition-all duration-300 text-left"
                >
                  <div className="lg:col-span-7 aspect-[5/2] overflow-hidden bg-surface border-b lg:border-b-0 lg:border-r border-border/50 flex items-center justify-center relative">
                    <img
                      src={getFeaturedImageProps(featuredPost, "large").src}
                      srcSet={getFeaturedImageProps(featuredPost, "large").srcSet}
                      sizes="(max-width: 1024px) 100vw, 750px"
                      alt=""
                      loading="eager"
                      decoding="async"
                      className="h-full w-full object-cover transition-transform duration-700"
                    />
                  </div>
                  <div className="lg:col-span-5 flex flex-col justify-center p-8 lg:p-10">
                    <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] font-bold uppercase tracking-widest text-steel-dark">
                      <span className="text-hyperblue">Featured</span>
                      <span className="text-steel-light/60">•</span>
                      <span className="text-obsidian/70">{getCategoryName(featuredPost)}</span>
                      <span className="text-steel-light/60">•</span>
                      <span>{formatDate(featuredPost.date)}</span>
                    </div>

                    <h2
                      className="text-2xl font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors line-clamp-3 leading-tight md:text-3xl"
                      dangerouslySetInnerHTML={{ __html: featuredPost.title.rendered }}
                    />

                    <p className="mt-4 text-sm font-medium text-steel-dark leading-relaxed line-clamp-3">
                      {cleanWpExcerpt(featuredPost.excerpt.rendered)}
                    </p>
                  </div>
                </Link>
              )}

              {/* Rest of the posts in Grid layout */}
              {gridPosts.length > 0 && (
                <div className="space-y-10">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-4 border-b border-border/50">
                    <div>
                      <span className="eyebrow text-steel-dark text-[10px] font-bold tracking-widest uppercase">Latest Updates</span>
                      <h3 className="mt-1 text-2xl font-bold tracking-tight text-obsidian">
                        Explore Articles
                      </h3>
                    </div>
                    <div className="text-xs text-steel font-medium">
                      Showing {gridPosts.length} insights
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {gridPosts.map((p) => {
                      const imgProps = getFeaturedImageProps(p, "medium_large");
                      const category = getCategoryName(p);
                      const dateStr = formatDate(p.date);

                      return (
                        <Link
                          key={p.id}
                          to="/blog/$slug"
                          params={{ slug: p.slug }}
                          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-md transition-all duration-300 text-left"
                        >
                          <div className="aspect-[5/2] overflow-hidden bg-surface border-b border-border/50 flex items-center justify-center relative">
                            <img
                              src={imgProps.src}
                              srcSet={imgProps.srcSet}
                              sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 380px"
                              alt=""
                              loading="lazy"
                              decoding="async"
                              className="h-full w-full object-cover transition-transform duration-700"
                            />
                          </div>
                          <div className="flex flex-1 flex-col p-6">
                            <div className="flex items-center gap-2 mb-3 text-[10px] font-bold uppercase tracking-widest text-steel-dark">
                              <span className="text-hyperblue">{category}</span>
                              <span className="text-steel-light/60">•</span>
                              <span>{dateStr}</span>
                            </div>

                            <h4
                              className="text-lg font-bold tracking-tight text-obsidian group-hover:text-hyperblue transition-colors line-clamp-2 leading-snug"
                              dangerouslySetInnerHTML={{ __html: p.title.rendered }}
                            />

                            <p className="mt-3 flex-1 text-sm font-medium text-steel-dark line-clamp-3 leading-relaxed">
                              {cleanWpExcerpt(p.excerpt.rendered)}
                            </p>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>
      </section>

      {/* Newsletter / CTA Box */}
      <section className="bg-obsidian px-6 py-16 text-primary-foreground border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-10 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <span className="eyebrow text-hyperblue text-[10px] font-bold tracking-widest uppercase">
              Stay Informed
            </span>
            <h2 className="mt-3 text-balance text-3xl font-extrabold tracking-tight md:text-5xl">
              Get the latest global insights in your inbox.
            </h2>
            <p className="mt-4 text-base font-medium text-steel-light/75 leading-relaxed">
              We send a monthly breakdown of marketing benchmarks, procurement tips, and rising agencies globally.
            </p>
          </div>
          <div className="w-full max-w-md shrink-0">
            <form className="flex w-full rounded-sm border border-white/10 bg-white/5 p-1 backdrop-blur-xs">
              <input
                type="email"
                placeholder="Enter your email"
                required
                className="flex-1 bg-transparent px-4 py-3 text-sm text-white placeholder-steel-light/50 outline-none"
              />
              <button
                type="submit"
                className="rounded-sm bg-white px-6 py-3 text-xs font-bold uppercase tracking-widest text-obsidian transition-colors hover:bg-hyperblue hover:text-white"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
