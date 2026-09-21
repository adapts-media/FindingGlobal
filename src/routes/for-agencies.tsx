import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import {
  ShieldCheck,
  Globe,
  MessageSquare,
  BarChart3,
  Award,
  Sparkles,
  Check,
  ArrowRight,
} from "lucide-react";

export const Route = createFileRoute("/for-agencies")({
  head: () => ({
    meta: [
      { title: "Join the network — For agencies | Finding Global" },
      {
        name: "description",
        content:
          "Win qualified projects from serious clients globally. Build your profile and start receiving briefs.",
      },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
      { property: "og:title", content: "Grow your agency globally — Finding Global" },
      {
        property: "og:description",
        content: "Join 184 vetted partners receiving qualified briefs from global decision-makers.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/for-agencies/" },
    ],
  }),
  component: ForAgenciesPage,
});

function ForAgenciesPage() {
  const [isAnnual, setIsAnnual] = useState(false);

  // --- References for Parallax Layers ---
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bgGridRef = useRef<HTMLDivElement | null>(null);
  const spotlightRef = useRef<HTMLDivElement | null>(null);
  const headlineRef = useRef<HTMLDivElement | null>(null);
  const subtitleRef = useRef<HTMLDivElement | null>(null);
  const ctasRef = useRef<HTMLDivElement | null>(null);

  // --- Hover State for Spotlight Fade ---
  const [isHovered, setIsHovered] = useState(false);

  // --- Animation loop coordinates ---
  const targetPos = useRef({ x: 0, y: 0 });
  const currentPos = useRef({ x: 0, y: 0 });

  // --- Mouse Parallax & Spotlight Effect Logic ---
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationFrameId: number;

    const handleMouseMove = (event: MouseEvent) => {
      setIsHovered(true);
      const rect = container.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // Keep targets unclamped so spotlight tracks mouse to extreme edges
      targetPos.current.x = event.clientX - centerX;
      targetPos.current.y = event.clientY - centerY;
    };

    const handleMouseLeave = () => {
      setIsHovered(false);
      // Smoothly reset back to center when mouse leaves
      targetPos.current.x = 0;
      targetPos.current.y = 0;
    };

    const updateParallax = () => {
      // Lerp logic: current = current + (target - current) * lerpFactor (0.08)
      currentPos.current.x += (targetPos.current.x - currentPos.current.x) * 0.08;
      currentPos.current.y += (targetPos.current.y - currentPos.current.y) * 0.08;

      const { x, y } = currentPos.current;

      // Clamp coordinates specifically for parallax layers to keep them within limits
      const clampedX = Math.max(-500, Math.min(500, x));
      const clampedY = Math.max(-300, Math.min(300, y));

      if (bgGridRef.current) {
        bgGridRef.current.style.transform = `translate3d(${clampedX * 0.04}px, ${clampedY * 0.04}px, 0)`;
      }
      if (spotlightRef.current) {
        // Spotlight calculation relative to top-left of container (uses unclamped coordinates for full reach)
        const centerX = container.clientWidth / 2;
        const centerY = container.clientHeight / 2;
        const spotlightX = centerX + x - 500;
        const spotlightY = centerY + y - 500;
        spotlightRef.current.style.transform = `translate3d(${spotlightX}px, ${spotlightY}px, 0)`;
      }
      if (headlineRef.current) {
        headlineRef.current.style.transform = `translate3d(${clampedX * 0.02}px, ${clampedY * 0.02}px, 0)`;
      }
      if (subtitleRef.current) {
        subtitleRef.current.style.transform = `translate3d(${clampedX * 0.015}px, ${clampedY * 0.015}px, 0)`;
      }
      if (ctasRef.current) {
        ctasRef.current.style.transform = `translate3d(${clampedX * 0.003}px, ${clampedY * 0.003}px, 0)`;
      }

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    container.addEventListener("mousemove", handleMouseMove);
    container.addEventListener("mouseleave", handleMouseLeave);
    animationFrameId = requestAnimationFrame(updateParallax);

    // Cleanup listeners and animations on unmount
    return () => {
      container.removeEventListener("mousemove", handleMouseMove);
      container.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <SiteHeader />

      {/* HERO SECTION */}
      <section
        ref={containerRef}
        className="relative z-0 overflow-hidden px-6 py-20 md:py-28 border-b border-border/40 bg-background flex flex-col items-center justify-center min-h-[500px]"
      >
        {/* LAYER 1: Background Grid Pattern (Moves MOST, 0.04) (z-index: 1) */}
        <div
          ref={bgGridRef}
          className="architectural-grid absolute -inset-x-12 -inset-y-10 pointer-events-none opacity-40 z-1"
          style={{ willChange: "transform" }}
        />

        {/* LAYER 2.5: Spotlight Glow Layer (z-index: 2) */}
        <div
          ref={spotlightRef}
          className="absolute top-0 left-0 w-[1000px] h-[1000px] pointer-events-none rounded-full z-2"
          style={{
            willChange: "transform",
            opacity: isHovered ? 1 : 0,
            transition: `opacity ${isHovered ? "0.3s" : "0.6s"} ease`,
            background: `
              radial-gradient(circle, rgba(0, 59, 179, 0.05) 0%, rgba(0, 59, 179, 0) 60%),
              radial-gradient(circle, rgba(0, 59, 179, 0.01) 0%, rgba(0, 59, 179, 0) 100%)
            `,
          }}
        />

        <div className="relative z-3 mx-auto max-w-5xl text-center flex flex-col items-center">
          {/* LAYER 3: Headline (Moves Subtly, 0.02) (z-index: 3) */}
          <div
            ref={headlineRef}
            className="w-full select-none relative z-3"
            style={{ willChange: "transform" }}
          >
            <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight text-obsidian sm:text-6xl md:text-7xl">
              Win qualified agency briefs <br className="hidden md:inline" />
              <span className="text-hyperblue">without the cold outreach.</span>
            </h1>
          </div>

          {/* LAYER 4: Subtitle (Moves slightly less than Headline, 0.015) (z-index: 4) */}
          <div
            ref={subtitleRef}
            className="mt-8 w-full select-none relative z-4"
            style={{ willChange: "transform" }}
          >
            <p className="mx-auto max-w-[55ch] text-lg font-semibold text-steel-dark leading-relaxed md:text-xl">
              Join the vetted network used by regional marketing leaders, fast-growing startups, and enterprise procurement teams to hire agencies.
            </p>
          </div>

          {/* LAYER 6: CTA Buttons (Moves LEAST, 0.003) (z-index: 6) */}
          <div
            ref={ctasRef}
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row relative z-6"
            style={{ willChange: "transform" }}
          >
            <Link
              to="/login/"
              className="group inline-flex items-center gap-2 rounded-xl bg-obsidian px-8 py-4 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-obsidian/90 hover:shadow-lg transition-all duration-200"
            >
              Apply to join
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              to="/agencies/"
              className="rounded-xl border border-border bg-card px-8 py-4 text-xs font-bold uppercase tracking-wider text-obsidian hover:border-obsidian hover:bg-surface-muted transition-all duration-200"
            >
              See current partners
            </Link>
          </div>
        </div>
      </section>

      {/* STATS SECTION */}
      <section className="bg-[#fafafa] dark:bg-surface-muted py-8 border-b border-border/30">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4 text-center">
            {[
              { val: "184+", label: "Vetted Agencies" },
              { val: "$4.2M+", label: "In Brief Value Matched" },
              { val: "< 24hr", label: "Average Shortlist Time" },
              { val: "0%", label: "Commission On Deals" },
            ].map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-3xl md:text-4xl font-black tracking-tight text-obsidian">
                  {stat.val}
                </span>
                <span className="mt-2 text-xs font-bold uppercase tracking-wider text-steel-dark">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* THE VETTING PROCESS */}
      <section className="px-6 py-16 border-b border-border/40 relative">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="eyebrow text-hyperblue">How it works</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-obsidian md:text-5xl">
              Our 3-step vetting workflow
            </h2>
            <p className="mt-4 text-base font-semibold text-steel-dark leading-relaxed">
              We only connect clients with agencies that have proven capabilities. Here's how we verify our partners.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                step: "01",
                title: "Apply & Share Portfolio",
                desc: "Submit your agency credentials, case studies, core competencies, and geographical markets.",
              },
              {
                step: "02",
                title: "Client Reference Review",
                desc: "We conduct brief checks on recent client work to verify execution quality and project timelines.",
              },
              {
                step: "03",
                title: "Get Vetted Badge & Leads",
                desc: "Once verified, your profile goes live on our directory and you start receiving matches.",
              },
            ].map((step, idx) => (
              <div key={idx} className="relative bg-card rounded-2xl p-8 border border-border/50 shadow-xs flex flex-col justify-between hover:shadow-card-hover transition-all duration-300">
                <div>
                  <span className="text-5xl font-black tracking-tighter text-hyperblue/20">
                    {step.step}
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-obsidian tracking-tight">
                    {step.title}
                  </h3>
                  <p className="mt-3 text-sm font-medium leading-relaxed text-steel-dark">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU GET SECTION */}
      <section className="bg-[#fafafa] dark:bg-surface-muted px-6 py-16 border-b border-border/40">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="eyebrow text-hyperblue">Benefits</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-obsidian md:text-5xl">
              Everything you need to grow
            </h2>
            <p className="mt-4 text-base font-semibold text-steel-dark leading-relaxed">
              We built Finding Global to streamline agency growth. Focus on delivering great work, we'll handle the pipeline.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: ShieldCheck,
                title: "Pre-screened Briefs",
                desc: "Every project brief is vetted by our team for clear budgets, realistic scopes, and client intent.",
              },
              {
                icon: Globe,
                title: "SEO-Optimized Profiles",
                desc: "Your custom public agency page is built to capture search traffic and rank for high-intent queries.",
              },
              {
                icon: BarChart3,
                title: "Market Insights",
                desc: "Track views, click-through rates, and benchmark your agency's pricing against regional averages.",
              },
              {
                icon: Sparkles,
                title: "Featured Placement",
                desc: "Rank at the top of category searches and get promoted on client match lists for maximum reach.",
              },
              {
                icon: MessageSquare,
                title: "Direct Client Chat",
                desc: "No intermediaries. Communicate directly with decision-makers via our integrated workspace platform.",
              },
              {
                icon: Award,
                title: "Verified Partner Badge",
                desc: "Display our verified badge on your profile and website to build trust and close deals faster.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="group bg-card rounded-2xl p-8 border border-border/40 shadow-xs transition-all duration-300 hover:shadow-card-hover hover:border-hyperblue/25 hover:-translate-y-1 text-left"
              >
                <div className="flex size-12 items-center justify-center rounded-xl border border-border bg-[#F8F9FA] text-obsidian mb-6 transition-all duration-300 group-hover:bg-obsidian group-hover:text-white group-hover:border-obsidian">
                  <item.icon className="size-6" />
                </div>
                <h3 className="text-lg font-bold text-obsidian tracking-tight leading-snug">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-medium leading-relaxed text-steel-dark">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section className="px-6 py-16 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[450px] rounded-full bg-hyperblue/[0.02] blur-[150px] pointer-events-none" />

        <div className="mx-auto max-w-7xl relative z-10">
          <div className="mb-16 text-center">
            <span className="eyebrow text-hyperblue">Membership</span>
            <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-obsidian md:text-5xl">
              Pay only for what works
            </h2>
            <p className="mt-4 max-w-xl mx-auto text-base font-semibold text-steel-dark leading-relaxed">
              No commissions, no hidden fees. Choose the tier that matches your agency's scale and growth goals.
            </p>

            {/* Billing Toggle Switch */}
            <div className="mt-8 flex items-center justify-center gap-4">
              <span className={`text-sm font-bold ${!isAnnual ? "text-obsidian" : "text-steel-dark"}`}>Monthly</span>
              <button
                onClick={() => setIsAnnual(!isAnnual)}
                className="relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-obsidian/10 transition-colors duration-200 ease-in-out focus:outline-hidden"
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-hyperblue shadow-sm ring-0 transition duration-200 ease-in-out ${isAnnual ? "translate-x-5" : "translate-x-0"
                    }`}
                />
              </button>
              <span className={`text-sm font-bold flex items-center gap-1.5 ${isAnnual ? "text-obsidian" : "text-steel-dark"}`}>
                Annually
                <span className="rounded-full bg-green-100 border border-green-200/50 px-2 py-0.5 text-[9px] font-black text-green-700 uppercase tracking-wider">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch">
            {/* Free Tier */}
            <div className="flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-8 md:p-10 shadow-xs transition-all duration-300 hover:border-border/80">
              <div>
                <span className="eyebrow text-steel-dark">Basic Listing</span>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-black tracking-tight text-obsidian">Free</span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-steel-dark">
                  Perfect for boutique agencies starting out globally.
                </p>

                <div className="mt-8 border-t border-border/40 pt-8">
                  <ul className="space-y-4">
                    {[
                      "Standard public agency profile",
                      "Listed in basic directory search",
                      "Respond to up to 3 briefs per month",
                      "Basic profile analytics reports",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-steel-dark">
                        <Check className="mt-0.5 size-4 shrink-0 text-hyperblue" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  to="/login/"
                  className="block w-full text-center rounded-xl border border-border bg-card py-4 px-6 text-xs font-bold uppercase tracking-wider text-obsidian hover:border-obsidian transition-all duration-200"
                >
                  Start basic listing
                </Link>
              </div>
            </div>

            {/* Premium Tier */}
            <div className="relative flex flex-col justify-between rounded-2xl border-2 border-obsidian bg-obsidian text-white p-8 md:p-10 shadow-elevated">
              <div className="absolute top-0 right-8 -translate-y-1/2">
                <span className="rounded-full bg-hyperblue px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                  Recommended
                </span>
              </div>

              <div>
                <span className="eyebrow text-hyperblue">FindingGlobal+</span>
                <div className="mt-4 flex items-baseline">
                  <span className="text-5xl font-black tracking-tight text-white">
                    {isAnnual ? "$79" : "$99"}
                  </span>
                  <span className="ml-1 text-sm font-bold text-steel-light/70">/month</span>
                </div>
                <p className="mt-4 text-sm font-medium leading-relaxed text-steel-light/80">
                  Built for established agencies looking to scale their pipeline globally.
                </p>

                <div className="mt-8 border-t border-white/10 pt-8">
                  <ul className="space-y-4">
                    {[
                      "Priority ranking in search results",
                      "Verified Partner Badge on profile",
                      "Unlimited project responses & matches",
                      "Advanced competitor analytics",
                      "Direct messaging",
                      "Full team profile access",
                    ].map((feature, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-steel-light/95">
                        <Check className="mt-0.5 size-4 shrink-0 text-hyperblue" />
                        <span className="font-medium">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-10">
                <Link
                  to="/login/"
                  className="block w-full text-center rounded-xl bg-hyperblue py-4 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-hyperblue/90 hover:shadow-lg transition-all duration-200"
                >
                  Get FindingGlobal+
                </Link>
              </div>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-3xl mx-auto">
            <div className="text-center mb-16">
              <span className="eyebrow text-hyperblue">FAQ</span>
              <h3 className="mt-4 text-3xl font-extrabold tracking-tight text-obsidian md:text-4xl">
                Frequently Asked Questions
              </h3>
              <p className="mt-2 text-sm text-steel-dark font-medium">
                Everything you need to know about Finding Global partnerships, billing, and leads.
              </p>
            </div>

            <Accordion type="single" collapsible defaultValue="item-0" className="w-full space-y-4">
              {FAQS.map((faq, idx) => (
                <AccordionItem
                  key={idx}
                  value={`item-${idx}`}
                  className="border border-border/60 bg-card rounded-2xl px-6 transition-all hover:border-hyperblue/30 hover:shadow-sm"
                >
                  <AccordionTrigger className="text-base font-bold text-obsidian hover:no-underline py-5 [&[data-state=open]]:text-hyperblue transition-colors">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm font-medium leading-relaxed text-steel-dark pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

const FAQS = [
  {
    q: "How does brief/lead verification work?",
    a: "Every brief submitted on Finding Global undergoes verification by our team. We screen for budget adequacy, clear scope, and confirm that the sender has decision-making authority before sharing it with relevant agency partners.",
  },
  {
    q: "Can we upgrade, downgrade, or cancel our subscription?",
    a: "Yes, you can manage your plan at any time from your account settings. Upgrades apply instantly with pro-rated billing, while downgrades or cancellations take effect at the end of the current billing cycle.",
  },
  {
    q: "Does Finding Global charge a commission on won projects?",
    a: "No, we do not take any commission or percentage of projects won. You keep 100% of your project revenue; you only pay the flat subscription fee for your selected plan.",
  },
  {
    q: "How long does the verification process take?",
    a: "After upgrading to the FindingGlobal+ plan, our vetting process typically takes 3-5 business days. We review your company credentials, case studies, and may reach out to verify client references.",
  },
  {
    q: "Can we respond to briefs outside our core country?",
    a: "Absolutely. Finding Global allows you to filter and receive briefs from any country, regardless of where your agency is registered or located.",
  },
];
