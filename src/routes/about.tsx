import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ShieldCheck, ArrowRight, Star, Globe, Users, Trophy, Compass } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About Us — Finding Global" },
      { name: "description", content: "Learn about Finding Global, our mission, vision, and how we empower brand-agency matchmaking globally." },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/about/" },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      {/* HERO SECTION */}
      <section className="relative px-6 py-12 lg:py-16 overflow-hidden border-b border-border/40">
        {/* Soft light radial glows */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] bg-hyperblue/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[450px] h-[450px] bg-indigo-500/[0.02] rounded-full blur-[120px] pointer-events-none" />
        <div className="architectural-grid pointer-events-none absolute inset-0 z-0 opacity-30" />

        <div className="mx-auto max-w-7xl relative z-10 text-center">
          {/* Top Logo Container */}
          <div className="flex justify-center mb-6">
            <img
              src="/minimallogo"
              alt="Finding Global Logo"
              className="h-24 md:h-32 w-auto object-contain"
            />
          </div>

          <h1 className="text-balance text-4xl font-black leading-[1.1] tracking-tight text-obsidian sm:text-5xl md:text-6xl max-w-4xl mx-auto">
            Empowering agency partnerships <span className="text-hyperblue">globally.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-[55ch] text-lg font-semibold text-steel-dark leading-relaxed">
            Finding Global is the premier procurement network, matching brands with proven marketing, technology, and creative partners globally.
          </p>
        </div>
      </section>

      {/* THREE CORE CARDS SECTION */}
      <section className="px-6 py-16 bg-[#fafafa] dark:bg-surface-muted border-b border-border/30">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            
            {/* Card 1: What is Finding Global */}
            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-xs hover:shadow-card-hover hover:border-hyperblue/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="size-12 rounded-xl border border-border bg-[#F8F9FA] text-obsidian flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-obsidian group-hover:text-white group-hover:border-obsidian">
                  <Users className="size-6" />
                </div>
                <h3 className="text-base font-bold tracking-wider text-obsidian mb-3 uppercase">
                  What is Finding Global
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-steel-dark">
                  We are a dedicated matchmaker connecting brands with their ideal agency partners. Our network enables companies to discover verified expertise effortlessly.
                </p>
              </div>
            </div>

            {/* Card 2: Why We Exist */}
            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-xs hover:shadow-card-hover hover:border-hyperblue/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="size-12 rounded-xl border border-border bg-[#F8F9FA] text-obsidian flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-obsidian group-hover:text-white group-hover:border-obsidian">
                  <Compass className="size-6" />
                </div>
                <h3 className="text-base font-bold tracking-wider text-obsidian mb-3 uppercase">
                  Why We Exist
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-steel-dark">
                  We solve the stress of manual agency search and pitch processes. By offering a transparent, data-driven platform, we help brands hire with complete confidence.
                </p>
              </div>
            </div>

            {/* Card 3: Our Vision */}
            <div className="group bg-card rounded-2xl p-8 border border-border/50 shadow-xs hover:shadow-card-hover hover:border-hyperblue/20 hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between">
              <div>
                <div className="size-12 rounded-xl border border-border bg-[#F8F9FA] text-obsidian flex items-center justify-center mb-6 transition-all duration-300 group-hover:bg-obsidian group-hover:text-white group-hover:border-obsidian">
                  <Trophy className="size-6" />
                </div>
                <h3 className="text-base font-bold tracking-wider text-obsidian mb-3 uppercase">
                  Our Vision
                </h3>
                <p className="text-sm font-semibold leading-relaxed text-steel-dark">
                  To become the primary collaboration infrastructure globally, fostering long-term, high-value growth for both brands and agency networks.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* EXPAND BUSINESS SECTION */}
      <section className="px-6 py-24 bg-background relative">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
            
            {/* Left Content Column */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-success/5 border border-success/15 px-3.5 py-1 text-success">
                <ShieldCheck className="size-4" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Trusted by 100+ brands</span>
              </div>
              
              <h2 className="text-3xl font-extrabold tracking-tight text-obsidian sm:text-5xl leading-[1.15]">
                Scale your pipeline with Finding Global
              </h2>
              
              <p className="text-base text-steel-dark leading-relaxed font-medium">
                We make collaboration simple. Whether you're a brand seeking qualified partners or an agency expanding your market presence, we provide the platform to connect and win.
              </p>

              <div className="border-t border-border pt-6 space-y-6">
                <p className="text-sm text-steel-dark font-semibold leading-relaxed">
                  <span className="font-bold text-obsidian">Our promise:</span> We eliminate manual vendor sourcing. Submit your project parameters, and get introduced to checked partners within 24 hours.
                </p>
                
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to="/submit-project"
                    className="group inline-flex items-center gap-2 rounded-xl bg-obsidian hover:bg-obsidian/90 px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-white shadow-md transition-all duration-200"
                  >
                    Post your brief
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                  <Link
                    to="/agencies"
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-card hover:bg-surface-muted px-6 py-3.5 text-xs font-bold uppercase tracking-wider text-obsidian transition-all duration-200"
                  >
                    Explore agencies
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Image Column */}
            <div className="lg:col-span-6">
              <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-border/80 group">
                <img
                  src="https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&q=80&w=1200"
                  alt="Modern office collaborative workspace"
                  loading="lazy"
                  className="w-full h-auto object-cover aspect-[4/3] group-hover:scale-102 transition-transform duration-700 ease-out"
                />
                {/* Visual Accent Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-obsidian/40 via-transparent to-transparent pointer-events-none" />
                
                {/* Floating card indicator */}
                <div className="absolute bottom-5 left-5 bg-white/90 backdrop-blur-md border border-white/20 p-4 rounded-xl shadow-lg max-w-xs hidden sm:block">
                  <div className="flex items-center gap-2 text-yellow-500 mb-1">
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                    <Star className="size-3.5 fill-current" />
                  </div>
                  <p className="text-[11px] font-bold text-obsidian">"The fastest way to connect with verified global agencies."</p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
