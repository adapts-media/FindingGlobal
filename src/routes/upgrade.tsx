import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useAuth } from "@/lib/auth-context";
import { useEffect, useState } from "react";
import { agencyApi, type ApiAgency } from "@/lib/api";
import { toast } from "sonner";
import { Check, ArrowLeft, Loader2, Sparkles } from "lucide-react";

export const Route = createFileRoute("/upgrade")({
  head: () => ({
    meta: [
      { title: "Upgrade your plan — Finding Global" },
      { name: "description", content: "Choose a plan that fits your agency's growth goals." },
      { name: "robots", content: "noindex, follow" },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/upgrade/" },
    ],
  }),
  component: UpgradePage,
});

function UpgradePage() {
  const { user } = useAuth();
  const [agency, setAgency] = useState<ApiAgency | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAnnual, setIsAnnual] = useState(false);

  useEffect(() => {
    if (!user || !user.agencySlug) return;
    agencyApi.get(user.agencySlug)
      .then(r => setAgency(r.agency))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user]);

  const tiers = [
    {
      id: "Starter",
      name: "Basic Listing",
      price: "Free",
      desc: "Perfect for boutique agencies starting out globally.",
      features: [
        "Standard public agency profile",
        "Listed in basic directory search",
        "Respond to up to 3 briefs per month",
        "Basic profile analytics reports"
      ],
      cta: agency?.plan === "Growth" ? "Downgrade to Free" : "Start basic listing",
      highlight: false,
      current: agency?.plan === "Starter" || !agency?.plan
    },
    {
      id: "Growth",
      name: "FindingGlobal+",
      price: isAnnual ? "$79" : "$99",
      desc: "Built for established agencies looking to scale their pipeline globally.",
      features: [
        "Priority ranking in search results",
        "Verified Partner Badge on profile",
        "Unlimited project responses & matches",
        "Advanced competitor analytics",
        "Direct messaging",
        "Full team profile access"
      ],
      cta: "Get FindingGlobal+",
      highlight: true,
      current: agency?.plan === "Growth"
    }
  ];

  const [paying, setPaying] = useState<string | null>(null);
  const navigate = Route.useNavigate();

  async function handleUpgrade(planId: string, displayName: string) {
    setPaying(planId);
    try {
      const billingPeriod = isAnnual ? "annual" : "monthly";
      const res = await agencyApi.upgrade(planId, billingPeriod);
      if (res.redirectUrl) {
        window.location.href = res.redirectUrl;
      } else {
        const verb = planId === "Starter" ? "downgraded" : "upgraded";
        toast.success(`Success! You have been ${verb} to the ${displayName} plan.`);
        navigate({ to: "/agency-dashboard" });
      }
    } catch (e) {
      toast.error("Upgrade failed. Please try again.");
    } finally {
      setPaying(null);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground relative overflow-hidden">
      <SiteHeader />

      {/* Subtle background noise and grid patterns */}
      <div className="noise-bg absolute inset-0 pointer-events-none z-0" />
      <div className="architectural-grid pointer-events-none absolute inset-0 z-0 opacity-10" />

      {/* Floating gradient glow lights */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-hyperblue/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-hyperblue/[0.03] rounded-full blur-[150px] pointer-events-none z-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-hyperblue/[0.04] rounded-full blur-[130px] pointer-events-none z-0" />

      <section className="relative py-12 md:py-16 overflow-hidden border-b border-border/40 z-10">
        <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10">
          <div className="mb-12 text-center relative">
            {/* Spotlight blur behind heading */}
            <div className="absolute top-6 left-1/2 -translate-x-1/2 w-[400px] h-[200px] bg-hyperblue/10 rounded-full blur-[80px] pointer-events-none z-0" />

            <h1 className="text-balance text-4xl sm:text-5xl md:text-[56px] font-black leading-[1.05] tracking-tighter text-obsidian max-w-2xl mx-auto relative z-10">
              Choose the right <span className="block">plan for your agency.</span>
            </h1>
            <p className="mx-auto mt-4 max-w-[550px] text-base md:text-[18px] font-semibold text-slate-500 leading-relaxed relative z-10">
              Whether you're just starting or ready to scale globally, we have a plan to help you win more projects.
            </p>

            {/* Billing Toggle Switch */}
            <div className="mt-8 flex flex-col items-center gap-3 relative z-10">
              <div className="relative inline-flex items-center rounded-full bg-white/70 p-1 border border-black/[0.08] shadow-xs backdrop-blur-md">
                {/* Sliding background pill with spring animation */}
                <div
                  className="absolute h-[calc(100%-8px)] top-1 rounded-full bg-gradient-to-r from-hyperblue to-[#4f46e5] shadow-[0_4px_12px_rgba(37,99,235,0.25)] transition-all duration-400 ease-[cubic-bezier(0.25,1,0.5,1)]"
                  style={{
                    width: '110px',
                    left: isAnnual ? '118px' : '4px'
                  }}
                />
                <button
                  type="button"
                  onClick={() => setIsAnnual(false)}
                  className={`relative z-10 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-300 w-[110px] text-center cursor-pointer ${!isAnnual ? 'text-white' : 'text-slate-500 hover:text-obsidian'}`}
                >
                  Monthly
                </button>
                <button
                  type="button"
                  onClick={() => setIsAnnual(true)}
                  className={`relative z-10 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-full transition-colors duration-300 w-[110px] text-center cursor-pointer ${isAnnual ? 'text-white' : 'text-slate-500 hover:text-obsidian'}`}
                >
                  Annually
                </button>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 mt-1">
                Annually receives 20% discount
                <span className="rounded-full bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 text-[9px] font-black text-emerald-600 uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.15)]">
                  Save 20%
                </span>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto items-stretch relative z-10">
            {tiers.map((tier) => {
              const isPremium = tier.highlight;
              return (
                <div
                  key={tier.id}
                  className={
                    isPremium
                      ? "relative flex flex-col justify-between rounded-2xl border-2 border-obsidian bg-obsidian text-white p-8 md:p-10 shadow-elevated"
                      : "flex flex-col justify-between rounded-2xl border border-border/60 bg-card p-8 md:p-10 shadow-xs transition-all duration-300 hover:border-border/80"
                  }
                >
                  {isPremium && (
                    <div className="absolute top-0 right-8 -translate-y-1/2">
                      <span className="rounded-full bg-hyperblue px-4 py-1.5 text-[9px] font-black uppercase tracking-widest text-white shadow-sm">
                        Recommended
                      </span>
                    </div>
                  )}

                  <div>
                    <span className={isPremium ? "eyebrow text-hyperblue" : "eyebrow text-steel-dark"}>
                      {tier.id === "Starter" ? "Basic Listing" : tier.name}
                    </span>

                    <div className="mt-4 flex items-baseline">
                      <span className={isPremium ? "text-5xl font-black tracking-tight text-white" : "text-5xl font-black tracking-tight text-obsidian"}>
                        {tier.price}
                      </span>
                      {tier.price !== "Free" && (
                        <span className={isPremium ? "ml-1 text-sm font-bold text-steel-light/70" : "ml-1 text-sm font-bold text-steel-dark"}>
                          /month
                        </span>
                      )}
                    </div>
                    {tier.price !== "Free" && isAnnual && (
                      <span className={isPremium ? "text-[10px] font-bold mt-1 block uppercase tracking-wider text-hyperblue" : "text-[10px] font-bold mt-1 block uppercase tracking-wider text-steel-dark"}>
                        Billed annually ($948/yr)
                      </span>
                    )}

                    <p className={isPremium ? "mt-4 text-sm font-medium leading-relaxed text-steel-light/80" : "mt-4 text-sm font-medium leading-relaxed text-steel-dark"}>
                      {tier.desc}
                    </p>

                    <div className={isPremium ? "mt-8 border-t border-white/10 pt-8" : "mt-8 border-t border-border/40 pt-8"}>
                      <ul className="space-y-4">
                        {tier.features.map((feature) => (
                          <li key={feature} className={isPremium ? "flex items-start gap-3 text-sm text-steel-light/95" : "flex items-start gap-3 text-sm text-steel-dark"}>
                            <Check className="mt-0.5 size-4 shrink-0 text-hyperblue" />
                            <span className="font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-10">
                    <button
                      disabled={tier.current || !!paying}
                      onClick={() => {
                        if (!tier.current) {
                          handleUpgrade(tier.id, tier.name);
                        }
                      }}
                      className={
                        isPremium
                          ? "block w-full text-center rounded-xl bg-hyperblue py-4 px-6 text-xs font-bold uppercase tracking-wider text-white shadow-md hover:bg-hyperblue/90 hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-default cursor-pointer"
                          : "block w-full text-center rounded-xl border border-border bg-card py-4 px-6 text-xs font-bold uppercase tracking-wider text-obsidian hover:border-obsidian transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-default cursor-pointer"
                      }
                    >
                      {paying === tier.id ? (
                        <>
                          <Loader2 className="size-4 animate-spin inline mr-2" />
                          Processing...
                        </>
                      ) : tier.current ? (
                        "Current Plan"
                      ) : (
                        tier.cta
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Enterprise custom solution banner */}
          <div className="mt-16 rounded-[32px] border border-hyperblue/20 bg-white p-8 md:p-10 text-center relative overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 hover:border-hyperblue/30 hover:shadow-xl max-w-4xl mx-auto z-10">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[350px] rounded-full bg-hyperblue/[0.01] blur-[100px] pointer-events-none" />
            <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
              <h3 className="text-xl sm:text-2xl font-black tracking-tight text-obsidian">
                Need a custom enterprise solution?
              </h3>
              <p className="mt-3 text-sm font-semibold text-slate-500 leading-relaxed max-w-[55ch]">
                For large networks, agencies managing multiple geographical presences, or holding groups seeking custom procurement support.
              </p>
              <Link to="/enterprise/" className="mt-6 rounded-2xl bg-obsidian hover:bg-neutral-800 hover:-translate-y-0.5 active:scale-95 px-8 h-[52px] text-xs font-black uppercase tracking-widest text-white shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer flex items-center justify-center">
                Talk to our team
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />

      {/* Premium inline css for background noise, marquee, and animations */}
      <style dangerouslySetInnerHTML={{
        __html: `
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
          opacity: 0.018;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
}
