import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AgencyCard } from "@/components/agency-card";
import { CTAPopup } from "@/components/cta-popup";
import { HeroSection } from "@/components/hero-section";
import { SERVICE_CATEGORIES, type Agency } from "@/lib/mock-data";
import { agencyApi, type ApiAgency } from "@/lib/api";
import { CountUp } from "@/components/count-up";
import { CheckCircle2, Search, Star, FileText, Sparkles, Handshake, ArrowRight, Clock, AlertCircle, Users, Briefcase, Eye, Megaphone, Palette, Laptop, MousePointerClick, Server, TrendingUp } from "lucide-react";
import { getSearchUrlParams } from "@/lib/utils";


export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Finding Global — Find the best agencies globally" },
      {
        name: "description",
        content:
          "Submit a brief and get matched with vetted marketing, branding, tech, and consulting agencies globally.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Finding Global — Find the best agencies globally" },
      {
        property: "og:description",
        content:
          "Get matched with proven global agency partners. Submit your brief in under 3 minutes.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/" },
    ],
  }),
  component: HomePage,
});

const TESTIMONIALS_COL_1 = [
  {
    quote: "Finding the right agency for our rebranding was smooth and quick. The platform is incredibly user-friendly and efficient.",
    author: "Bilal Ahmed",
    role: "IT Manager",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "The support team at Finding Global is exceptional, guiding us through the brief submission and screening process.",
    author: "Saman Malik",
    role: "Customer Support Lead",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "Our brand visibility improved dramatically with a partner selected through Finding Global's vetted network.",
    author: "Tariq Mahmood",
    role: "Marketing Director",
    image: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face"
  }
];

const TESTIMONIALS_COL_2 = [
  {
    quote: "Its robust matching engine and quick response times have transformed our procurement workflow, saving us weeks of research.",
    author: "Zainab Hussain",
    role: "Project Manager",
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "The vetted agencies provided top-tier proposals within 24 hours. Highly recommend for any Middle East business.",
    author: "Aliza Khan",
    role: "Business Analyst",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "We were matched with a developer agency that delivered our custom app under budget and ahead of schedule.",
    author: "Omar Farooq",
    role: "CTO",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
  }
];

const TESTIMONIALS_COL_3 = [
  {
    quote: "We found a performance marketing partner that exceeded expectations, understanding our regional audience perfectly.",
    author: "Sana Sheikh",
    role: "Sales Manager",
    image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "Using Finding Global, our online presence and e-commerce sales improved significantly.",
    author: "Hassan Ali",
    role: "E-commerce Manager",
    image: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&h=150&fit=crop&crop=face"
  },
  {
    quote: "Finding a specialized agency in Qatar used to be challenging, but this platform made it simple and reliable.",
    author: "Mariam Al-Sayed",
    role: "Director of Operations",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face"
  }
];

function adaptAgency(a: ApiAgency): Agency {
  return {
    slug: a.slug,
    name: a.name,
    tagline: a.tagline?.startsWith("Leading agency specializing in") ? "" : a.tagline,
    description: a.description ?? "",
    city: a.city,
    country: a.country as Agency["country"],
    countryCode: a.countryCode,
    founded: a.founded ?? 0,
    teamSize: a.teamSize ?? "",
    minBudget: a.minBudget,
    rating: a.rating,
    reviewCount: a.reviewCount,
    services: a.services as Agency["services"],
    industries: a.industries as Agency["industries"],
    logoSeed: a.logoSeed,
    coverSeed: a.coverSeed ?? "",
    featured: a.featured,
    verified: a.verified,
    plan: a.plan,
    portfolio: (a.portfolio ?? []) as Agency["portfolio"],
    team: (a.team ?? []) as Agency["team"],
    reviews: (a.reviews ?? []) as Agency["reviews"],
    website: a.website,
  };
}

const SERVICE_GROUPS = [
  {
    title: "Advertising",
    icon: Megaphone,
    services: ["360º Advertising", "Advertising", "Advertising Campaign", "Advertising Production", "Creative"],
  },
  {
    title: "Creative & Visual",
    icon: Palette,
    services: ["Design", "Photography", "Post Production", "User Experience (UX/UI)", "Video Editing"],
  },
  {
    title: "Development & Product",
    icon: Laptop,
    services: ["Artificial Intelligence", "Ecommerce", "Mobile App", "Software Development", "Web Design"],
  },
  {
    title: "Digital Marketing",
    icon: MousePointerClick,
    services: ["Branding", "Digital Marketing", "Event", "Public Relations (PR)", "SEO"],
  },
  {
    title: "IT Services",
    icon: Server,
    services: ["AWS Consulting", "Consulting", "Cyber Security", "Data Protection", "SaaS Strategy Consulting"],
  },
  {
    title: "Marketing",
    icon: TrendingUp,
    services: ["Affiliate Marketing", "B2B Marketing", "Communication Strategy", "International Marketing", "Marketing"],
  }
];

function HomePage() {
  const [featured, setFeatured] = useState<Agency[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    agencyApi.list({ featured: "true" }).then((res) => {
      setFeatured(res.agencies.map(adaptAgency));
    });
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      <HeroSection />

      {/* PROBLEMS / SOUND FAMILIAR SECTION */}
      <section className="bg-[#fafafa] dark:bg-surface-muted border-y border-border/30 px-6 py-20 relative overflow-hidden">

        <div className="mx-auto max-w-7xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            Why isn't your agency growing?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg font-medium text-steel-dark leading-relaxed">
            Winning clients shouldn't depend on referrals or luck. Build a predictable pipeline instead.
          </p>

          <div className="mx-auto mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1 */}
            <div className="flex flex-col items-start text-left bg-card rounded-2xl p-6 border border-border/40 shadow-xs transition-all duration-300 hover:shadow-md hover:border-hyperblue/20 hover:-translate-y-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mb-5">
                <AlertCircle className="size-5" />
              </div>
              <h3 className="text-base font-bold text-obsidian tracking-tight leading-snug">
                Leads have dried up
              </h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-steel-dark">
                Some months are great. Then nothing. An unpredictable pipeline makes growth impossible.
              </p>
            </div>

            {/* Card 2 */}
            <div className="flex flex-col items-start text-left bg-card rounded-2xl p-6 border border-border/40 shadow-xs transition-all duration-300 hover:shadow-md hover:border-hyperblue/20 hover:-translate-y-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mb-5">
                <Users className="size-5" />
              </div>
              <h3 className="text-base font-bold text-obsidian tracking-tight leading-snug">
                Referrals aren't enough
              </h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-steel-dark">
                Great clients come from referrals but referrals don't scale. You need a reliable source of new business.
              </p>
            </div>

            {/* Card 3 */}
            <div className="flex flex-col items-start text-left bg-card rounded-2xl p-6 border border-border/40 shadow-xs transition-all duration-300 hover:shadow-md hover:border-hyperblue/20 hover:-translate-y-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mb-5">
                <Briefcase className="size-5" />
              </div>
              <h3 className="text-base font-bold text-obsidian tracking-tight leading-snug">
                Cold outreach gets ignored
              </h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-steel-dark">
                Thousands of emails. Few replies. Reach businesses already looking for agencies like yours.
              </p>
            </div>

            {/* Card 4 */}
            <div className="flex flex-col items-start text-left bg-card rounded-2xl p-6 border border-border/40 shadow-xs transition-all duration-300 hover:shadow-md hover:border-hyperblue/20 hover:-translate-y-1">
              <div className="flex size-10 items-center justify-center rounded-full bg-hyperblue/10 text-hyperblue mb-5">
                <Eye className="size-5" />
              </div>
              <h3 className="text-base font-bold text-obsidian tracking-tight leading-snug">
                You're losing visitors
              </h3>
              <p className="mt-2.5 text-sm font-medium leading-relaxed text-steel-dark">
                Companies visit your website every day. Most leave without contacting you and you never know they were interested.
              </p>
            </div>
          </div>
        </div>
      </section>


      {/* FEATURED AGENCIES */}
      <section className="bg-background pt-24 pb-16 relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-px bg-gradient-to-r from-transparent via-border to-transparent" />

        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 flex flex-col items-start justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold tracking-tight text-obsidian md:text-5xl">
                Featured partners this quarter
              </h2>
              <p className="mt-4 text-lg font-medium text-steel-dark leading-relaxed">
                Firms demonstrating exceptional craft, regional expertise, and proven execution across the Middle East.
              </p>
            </div>
            <Link
              to="/agencies/"
              className="group flex items-center gap-3 rounded-full border border-border bg-card px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-obsidian transition-all hover:border-obsidian hover:shadow-sm"
            >
              Explore Directory
              <svg className="size-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
            {featured.map((agency) => (
              <AgencyCard key={agency.slug} agency={agency} />
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-[#fafafa] dark:bg-surface-muted border-y border-border/30 py-16 md:py-20 relative overflow-hidden">
        {/* Floating gradient blur lights */}
        <div className="absolute top-1/4 left-[5%] size-[350px] rounded-full bg-hyperblue/[0.03] blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-[5%] size-[350px] rounded-full bg-purple-600/[0.03] blur-[120px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-16 max-w-4xl text-left">
            <h2 className="text-4xl font-extrabold tracking-tight text-obsidian sm:text-5xl">
              From brief to shortlist in under 24 hours.
            </h2>
            <p className="mt-4 max-w-3xl text-lg font-medium text-steel-dark leading-relaxed">
              A streamlined, technology-driven procurement process built for speed, transparency, and regional compatibility.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* STEP 01 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-8 shadow-sm transition-all duration-300 hover:border-hyperblue/30 hover:shadow-elevated hover:-translate-y-0.5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hyperblue">
                  <FileText className="size-4" />
                  <span>Step 01</span>
                </div>

                <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-obsidian">
                  Submit your brief
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-steel-dark">
                  Tell us about your project, budget, timeline, and the markets you serve. Takes ~3 minutes.
                </p>
              </div>

              {/* Mockup brief card */}
              <div className="mt-8 rounded-xl bg-surface p-5 border border-border/60">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel">Project Scope</span>
                  <div className="rounded-md border border-border bg-white px-3 py-2 text-xs font-semibold text-obsidian shadow-xs">
                    Global SEO Strategy
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-steel">Total Budget</span>
                  <div className="flex items-center justify-between gap-4">
                    {/* Stylized custom budget slider track */}
                    <div className="relative flex-1 h-2 rounded-full bg-obsidian/10">
                      <div className="absolute left-[10%] right-[35%] h-full bg-hyperblue rounded-full" />
                    </div>
                    <span className="text-xs font-bold text-hyperblue whitespace-nowrap">$30k - $50k</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <span className="rounded bg-hyperblue/10 border border-hyperblue/20 px-2 py-1 text-[9px] font-bold tracking-wider uppercase text-hyperblue">US Market</span>
                  <span className="rounded bg-obsidian/5 border border-border px-2 py-1 text-[9px] font-bold tracking-wider uppercase text-steel-dark">6 Months</span>
                </div>
              </div>
            </div>

            {/* STEP 02 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-8 shadow-sm transition-all duration-300 hover:border-hyperblue/30 hover:shadow-elevated hover:-translate-y-0.5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hyperblue">
                  <Sparkles className="size-4" />
                  <span>Step 02</span>
                </div>

                <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-obsidian">
                  Get matched
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-steel-dark">
                  Our matching engine surfaces 5-10 agencies that fit your services, budget, and industry.
                </p>
              </div>

              {/* Mockup matches list */}
              <div className="mt-8 flex flex-col gap-3 rounded-xl bg-surface p-5 border border-border/60">
                {/* Agency Match 1 */}
                <div className="flex items-center justify-between rounded-r-lg border-l-4 border-hyperblue bg-white p-3 shadow-xs border border-border/60">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-obsidian">Digital Boost</span>
                    <span className="text-[10px] font-medium text-steel-dark">Performance Marketing</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black tracking-tight text-hyperblue">98%</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-steel">Match</span>
                  </div>
                </div>

                {/* Agency Match 2 */}
                <div className="flex items-center justify-between rounded-r-lg border-l-4 border-obsidian/20 bg-white/70 p-3 shadow-xs border border-border/50">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-obsidian/90">Growth Partners</span>
                    <span className="text-[10px] font-medium text-steel-dark">Strategic SEO</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-black tracking-tight text-obsidian/85">94%</span>
                    <span className="text-[8px] font-bold uppercase tracking-wider text-steel">Match</span>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 03 */}
            <div className="flex flex-col justify-between rounded-2xl border border-border bg-white p-8 shadow-sm transition-all duration-300 hover:border-hyperblue/30 hover:shadow-elevated hover:-translate-y-0.5">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-hyperblue">
                  <Handshake className="size-4" />
                  <span>Step 03</span>
                </div>

                <h3 className="mt-5 text-2xl font-extrabold tracking-tight text-obsidian">
                  Start working
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-steel-dark">
                  Review proposals, chat with senior teams, and select the partner that fits your goals.
                </p>
              </div>

              {/* Mockup chat and contract */}
              <div className="mt-8 rounded-xl bg-surface p-5 border border-border/60">
                {/* Chat Mockup */}
                <div className="rounded-lg bg-white p-3 shadow-xs border border-border/80">
                  <div className="flex items-center justify-between border-b border-border pb-2 mb-2.5">
                    <div className="flex items-center gap-2">
                      <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-hyperblue text-[10px] font-bold text-white">
                        DB
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-obsidian leading-none">Digital Boost Agency</span>
                        <span className="text-[8px] font-medium text-green-600">Online now</span>
                      </div>
                    </div>
                    {/* Screen/video icon */}
                    <svg className="size-3.5 text-steel-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </div>

                  <div className="space-y-2">
                    {/* Received Message */}
                    <div className="max-w-[85%] rounded-lg bg-surface px-2.5 py-1.5 text-[9px] font-medium text-obsidian/90 leading-relaxed">
                      Hey there! We've reviewed your brief...
                    </div>

                    {/* Sent Message */}
                    <div className="ml-auto max-w-[85%] rounded-lg bg-hyperblue px-2.5 py-1.5 text-[9px] font-medium text-white text-right leading-relaxed">
                      Looks great, let's finalize!
                    </div>
                  </div>
                </div>

                {/* Contract Status Row */}
                <div className="mt-4 flex items-center justify-between px-1 text-[9px] font-bold uppercase tracking-wider text-steel">
                  <span>Contract Status</span>
                  <span className="flex items-center gap-1 text-green-600">
                    <CheckCircle2 className="size-3.5 text-green-600 fill-green-600/20" />
                    <span>Approved</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* SIGNAL DETECTION SECTION */}
      <section className="bg-background py-16">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="relative rounded-3xl bg-surface-muted p-8 lg:p-12">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-[#1ED760] text-white">
                    <svg viewBox="0 0 24 24" className="size-6 fill-current"><path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.02 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15.001 10.62 18.66 12.9c.42.24.54.84.301 1.14zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.38 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.239.54-.959.72-1.559.3z" /></svg>
                  </div>
                  <div>
                    <p className="font-bold text-obsidian">Spotify visited your profile 3 times this week</p>
                    <p className="mt-1 text-xs font-medium text-steel-dark">Dubai · Viewed pricing · <span className="text-orange-500 font-bold">Hot</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-lg">
                    BMW
                  </div>
                  <div>
                    <p className="font-bold text-obsidian">BMW searching "SEO agency Dubai"</p>
                    <p className="mt-1 text-xs font-medium text-steel-dark">Marketplace signal · <span className="text-green-500 font-bold">Active now</span></p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-yellow-400 text-obsidian font-bold text-xl">
                    N
                  </div>
                  <div>
                    <p className="font-bold text-obsidian">Noon scored "Hot" - ready to buy</p>
                    <p className="mt-1 text-xs font-medium text-steel-dark">Riyadh · 4 page views, 2 return visits · Intent: high</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1">
                  <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-white font-bold text-xl">
                    C
                  </div>
                  <div>
                    <p className="font-bold text-obsidian">Careem is hiring a Head of Marketing</p>
                    <p className="mt-1 text-xs font-medium text-steel-dark">Dubai · Series F funded · <span className="text-orange-400 font-bold">Warm</span></p>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <div className="inline-flex items-center rounded-full bg-pink-100 px-3 py-1 text-xs font-bold text-pink-600">
                Finding Global
              </div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
                Know who's looking for your services. <span className="text-hyperblue">Right now.</span>
              </h2>
              <p className="mt-4 text-lg font-medium text-steel-dark">
                Finding Global identifies the companies visiting your profile, searching for your services on our marketplace, and showing buying signals. You see who's hot before your competitors do.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Profile visitor identification (company-level IP tracking)",
                  "Finding Global marketplace search alerts in real time",
                  "Buyer intent scoring: hot, warm, or cold",
                  "CRM sync with HubSpot, Salesforce, Pipedrive",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-steel-dark">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 inline-flex rounded-xl bg-green-50 border border-green-200/60 px-5 py-4 text-sm font-medium text-green-800 shadow-sm">
                98% of buyers identified that would otherwise leave anonymously
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MARKETPLACE SECTION */}
      <section className="bg-background pb-16 pt-8">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
            <div className="order-2 lg:order-1">
              <div className="inline-flex items-center rounded-full bg-hyperblue/10 px-3 py-1 text-xs font-bold text-hyperblue">
                Marketplace
              </div>
              <h2 className="mt-6 text-3xl font-extrabold tracking-tight md:text-4xl lg:text-5xl">
                60,000 buyers search Finding Global every month. Be the agency <span className="text-hyperblue">they find.</span>
              </h2>
              <p className="mt-4 text-lg font-medium text-steel-dark">
                Finding Global ranks #1 on the most competitive agency keywords. When a company searches "performance marketing agency" or "UX design firm", they land on Finding Global. Your profile, your case studies, your reviews are what they see first.
              </p>
              <ul className="mt-8 space-y-4">
                {[
                  "Rank on 2,400+ high-intent landing pages",
                  "Buyers see your profile, portfolio, and verified reviews",
                  "Promoted placements for maximum visibility",
                  "Qualified leads delivered straight to your inbox",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-steel-dark">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-green-500" />
                    <span className="font-medium">{item}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-8 inline-flex rounded-xl bg-hyperblue/5 border border-hyperblue/15 px-5 py-4 text-sm font-medium text-hyperblue shadow-sm">
                Agencies report 3x more inbound leads within 90 days
              </div>
            </div>
            <div className="order-1 lg:order-2 relative rounded-3xl bg-surface-muted p-8 lg:p-12">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 rounded-2xl bg-card px-5 py-4 shadow-sm border border-border">
                  <Search className="size-5 text-steel" />
                  <span className="text-sm font-medium text-steel-dark">Search "Performance marketing agency"</span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1 gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-hyperblue/10 text-hyperblue font-bold">
                      DB
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-obsidian">Digital Boost Agency</p>
                        <span className="rounded bg-hyperblue/10 px-1.5 py-0.5 text-[10px] font-bold text-hyperblue uppercase tracking-wider">Promoted</span>
                      </div>
                      <p className="mt-1 text-xs font-medium text-steel-dark">Dubai, UAE</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-start sm:self-auto pl-16 sm:pl-0">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-obsidian">4.9</span>
                    <span className="text-xs font-medium text-steel-dark">(127)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1 gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700 font-bold">
                      GP
                    </div>
                    <div>
                      <p className="font-bold text-obsidian">Growth Partners</p>
                      <p className="mt-1 text-xs font-medium text-steel-dark">Riyadh, KSA</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-start sm:self-auto pl-16 sm:pl-0">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-obsidian">4.8</span>
                    <span className="text-xs font-medium text-steel-dark">(89)</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between rounded-2xl bg-card p-5 shadow-sm border border-border transition-transform hover:-translate-y-1 gap-3 sm:gap-0">
                  <div className="flex items-center gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-pink-100 text-pink-700 font-bold">
                      SD
                    </div>
                    <div>
                      <p className="font-bold text-obsidian">Scale Digital</p>
                      <p className="mt-1 text-xs font-medium text-steel-dark">Cairo, Egypt</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 self-start sm:self-auto pl-16 sm:pl-0">
                    <Star className="size-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-bold text-obsidian">4.7</span>
                    <span className="text-xs font-medium text-steel-dark">(156)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICE CATEGORIES SECTION */}
      <section className="bg-background pt-8 pb-24 border-b border-border/30">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="mb-20 flex flex-col items-center text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 shadow-sm">
              <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />
              <span className="eyebrow text-steel-dark text-[9px] font-bold tracking-widest uppercase">Expertise</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-obsidian md:text-4xl lg:text-5xl max-w-2xl">
              Specialized expertise for every requirement.
            </h2>
            <p className="mt-5 max-w-2xl text-lg font-medium text-steel-dark leading-relaxed">
              Connect directly with verified service providers across more than 1,000 distinct categories, matched to your specific needs.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-16 gap-y-16">
            {SERVICE_GROUPS.map((group, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
                  <group.icon className="size-5 text-steel-dark" strokeWidth={1.5} />
                  <h3 className="text-sm font-bold uppercase tracking-wider text-obsidian">{group.title}</h3>
                </div>

                <ul className="space-y-4">
                  {group.services.map((service, sIdx) => (
                    <li key={sIdx}>
                      <Link to="/agencies/" search={getSearchUrlParams(service)} className="group/link flex items-center justify-between text-sm font-medium text-steel-dark hover:text-obsidian transition-colors">
                        <span>{service}</span>
                        <ArrowRight className="size-3.5 opacity-0 -translate-x-2 group-hover/link:opacity-100 group-hover/link:translate-x-0 transition-all duration-300 text-steel" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              to="/agencies/"
              className="group inline-flex items-center gap-2 rounded-full border border-border bg-surface px-8 py-3.5 text-xs font-bold uppercase tracking-wider text-obsidian hover:border-obsidian hover:shadow-sm transition-all"
            >
              Explore all categories
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-background py-16 border-b border-border relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 mb-4 shadow-sm">
              <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />
              <span className="eyebrow text-steel-dark text-[9px] font-bold tracking-widest uppercase">Testimonials</span>
            </div>
            <h2 className="text-4xl font-extrabold tracking-tight text-obsidian sm:text-5xl">
              What our users say
            </h2>
            <p className="mt-3 max-w-2xl mx-auto text-base font-medium text-steel-dark">
              See what our customers have to say about us.
            </p>
          </div>

          <div className="relative h-[640px] overflow-hidden">
            {/* Top and Bottom Fades */}
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background via-background/80 to-transparent pointer-events-none z-10" />
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/80 to-transparent pointer-events-none z-10" />

            {/* Scrolling Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
              {/* Column 1 */}
              <div className="relative h-full overflow-hidden flex flex-col">
                <div className="flex flex-col gap-6 animate-marquee-vertical-slow">
                  {[...TESTIMONIALS_COL_1, ...TESTIMONIALS_COL_1].map((t, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-hyperblue/20 transition-all duration-300">
                      <p className="text-sm font-medium text-steel-dark leading-relaxed mb-4">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <img
                          src={t.image}
                          alt={t.author}
                          className="size-10 rounded-full object-cover border border-border/60 bg-surface-muted"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-obsidian leading-none">{t.author}</span>
                          <span className="text-xs text-steel mt-1">{t.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 2 */}
              <div className="relative h-full overflow-hidden flex flex-col hidden md:flex">
                <div className="flex flex-col gap-6 animate-marquee-vertical-fast">
                  {[...TESTIMONIALS_COL_2, ...TESTIMONIALS_COL_2].map((t, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-hyperblue/20 transition-all duration-300">
                      <p className="text-sm font-medium text-steel-dark leading-relaxed mb-4">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <img
                          src={t.image}
                          alt={t.author}
                          className="size-10 rounded-full object-cover border border-border/60 bg-surface-muted"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-obsidian leading-none">{t.author}</span>
                          <span className="text-xs text-steel mt-1">{t.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Column 3 */}
              <div className="relative h-full overflow-hidden flex flex-col hidden lg:flex">
                <div className="flex flex-col gap-6 animate-marquee-vertical-slow">
                  {[...TESTIMONIALS_COL_3, ...TESTIMONIALS_COL_3].map((t, idx) => (
                    <div key={idx} className="rounded-2xl border border-border/80 bg-card p-6 shadow-sm hover:border-hyperblue/20 transition-all duration-300">
                      <p className="text-sm font-medium text-steel-dark leading-relaxed mb-4">
                        "{t.quote}"
                      </p>
                      <div className="flex items-center gap-3">
                        <img
                          src={t.image}
                          alt={t.author}
                          className="size-10 rounded-full object-cover border border-border/60 bg-surface-muted"
                        />
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-obsidian leading-none">{t.author}</span>
                          <span className="text-xs text-steel mt-1">{t.role}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CSS styles for vertical scrolling */}
        <style dangerouslySetInnerHTML={{
          __html: `
          @keyframes marquee-vertical {
            0% { transform: translateY(0); }
            100% { transform: translateY(-50%); }
          }
          .animate-marquee-vertical-slow {
            animation: marquee-vertical 32s linear infinite;
          }
          .animate-marquee-vertical-fast {
            animation: marquee-vertical 24s linear infinite;
          }
          .animate-marquee-vertical-slow:hover,
          .animate-marquee-vertical-fast:hover {
            animation-play-state: paused;
          }
        `}} />
      </section>

      {/* FOR AGENCIES CTA */}
      <section className="relative overflow-hidden bg-obsidian py-10 md:py-12 text-white border-t border-white/5">
        {/* Glow background effects */}
        <div className="absolute top-0 right-0 size-[400px] rounded-full bg-hyperblue/15 blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-[10%] size-[300px] rounded-full bg-purple-500/10 blur-[100px] pointer-events-none" />

        <div className="relative z-10 mx-auto max-w-7xl px-4 md:px-6">
          <div className="flex flex-col items-start justify-between gap-12 lg:flex-row lg:items-center">
            <div className="max-w-3xl text-left">
              <h2 className="text-balance text-3xl font-black tracking-tight sm:text-4xl md:text-5xl leading-[1.15]">
                Win qualified projects from serious clients <span className="inline-block text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-200 pr-1.5 -mr-1.5 pb-2 -mb-2">globally</span>.
              </h2>
              <p className="mt-4 text-base md:text-lg font-medium text-steel-light/70 leading-relaxed max-w-2xl">
                Build a profile, receive briefs that match your expertise, and grow global revenue
                without chasing cold leads. Join our verified network today.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0 w-full lg:w-auto">
              <Link
                to="/for-agencies/"
                className="group relative inline-flex w-full sm:w-auto items-center justify-center gap-3 rounded-full bg-white px-8 py-4 text-xs font-bold uppercase tracking-widest text-obsidian shadow-lg hover:shadow-hyperblue/20 hover:bg-hyperblue hover:text-white transition-all duration-300 active:scale-95"
              >
                <span>Join the network</span>
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
      <CTAPopup />
    </div>
  );
}
