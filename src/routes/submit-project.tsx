import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useState, memo, useEffect } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { ChevronDown, ArrowLeft, ArrowRight } from "lucide-react";
import {
  SERVICE_CATEGORIES,
  COUNTRIES,
  INDUSTRIES,
  BUDGET_TIERS,
  type ServiceCategory,
  type Country,
  type Industry,
  type BudgetTier,
} from "@/lib/mock-data";
import { CountrySelect } from "@/components/country-select";
import { DropdownSelect } from "@/components/dropdown-select";
import { projectApi, ApiError, type ApiProject, type ApiAgency, getToken } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { AgencyCard } from "@/components/agency-card";
import { type Agency } from "@/lib/mock-data";
import { Slider } from "@/components/ui/slider";

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
  };
}

export const Route = createFileRoute("/submit-project")({
  validateSearch: (s: Record<string, unknown>): { q?: string; agency?: string; projectId?: string; service?: string } => ({
    q: typeof s.q === "string" ? s.q : undefined,
    agency: typeof s.agency === "string" ? s.agency : undefined,
    projectId: typeof s.projectId === "string" ? s.projectId : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Submit a project brief — Finding Global" },
      {
        name: "description",
        content:
          "Describe your project and get matched with up to 10 vetted global agencies in under 24 hours.",
      },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/submit-project/" },
    ],
  }),
  component: SubmitProjectPage,
});

const STEPS = ["Services", "Budget & Timeline", "Market", "Your details", "Review"] as const;

function SubmitProjectPage() {
  const search = Route.useSearch();
  const navigate = useNavigate({ from: "/submit-project" });
  const { user } = useAuth();

  if (user?.role === "agency") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="max-w-md text-center">
            <h1 className="text-2xl font-bold text-obsidian mb-4">Access Restricted</h1>
            <p className="text-steel-dark mb-8">
              Agencies can only receive leads and cannot post projects. To post a project, please sign in with a client account.
            </p>
            <Link
              to="/agency-dashboard/"
              className="inline-block rounded-xl bg-obsidian px-6 py-3 text-xs font-bold uppercase tracking-widest text-white transition-all hover:bg-hyperblue hover:shadow-sm"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const [step, setStep] = useState(0);

  const [formData, setFormData] = useState({
    services: (search.service ? [search.service as ServiceCategory] : []) as ServiceCategory[],
    budget: "25k-75k" as BudgetTier,
    timeline: "1–3 months",
    country: "United Arab Emirates" as Country,
    industry: "Technology & SaaS" as Industry,
    details: search.q ?? "",
    name: "",
    company: "",
    email: "",
    otherService: "",
    otherIndustry: "",
    customTimelineMonths: 12,
  });

  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdProject, setCreatedProject] = useState<ApiProject | null>(null);
  const [loadingProject, setLoadingProject] = useState(false);
  const [showBriefReview, setShowBriefReview] = useState(false);

  // Restore draft if user is not logged in
  useEffect(() => {
    if (!user && localStorage.getItem("temp_project_brief")) {
      try {
        const saved = JSON.parse(localStorage.getItem("temp_project_brief")!);
        setFormData(saved);
        setShowBriefReview(true);
      } catch (e) {
        console.error("Failed to restore project draft", e);
      }
    }
  }, [user]);

  // Auto-submit brief after registration/login redirect
  useEffect(() => {
    if (user && user.role !== "agency") {
      const savedBrief = localStorage.getItem("temp_project_brief");
      if (savedBrief) {
        localStorage.removeItem("temp_project_brief");
        const parsed = JSON.parse(savedBrief);
        setSubmitting(true);
        setLoadingProject(true);
        const firstService = parsed.services[0] === "Other" ? parsed.otherService : (parsed.services[0] ?? "Project");
        projectApi.create({
          title: parsed.company ? `${parsed.company} — ${firstService}` : `${firstService} brief`,
          description: parsed.details || undefined,
          services: parsed.services.map((s: string) => s === "Other" ? parsed.otherService : s),
          budget: parsed.budget,
          country: parsed.country,
          industry: parsed.industry === "Other" ? parsed.otherIndustry : parsed.industry,
        }).then((r) => {
          setCreatedProject(r.project);
          setSubmitted(true);
          navigate({
            search: (prev) => ({
              ...prev,
              projectId: r.project._id,
            }),
          });
        }).catch((err) => {
          console.error("Failed to submit saved brief:", err);
          setSubmitError("Failed to import your project brief.");
        }).finally(() => {
          setSubmitting(false);
          setLoadingProject(false);
        });
      }
    }
  }, [user]);

  useEffect(() => {
    if (search.projectId) {
      setLoadingProject(true);
      projectApi
        .get(search.projectId)
        .then((res) => {
          setCreatedProject(res.project);
          setSubmitted(true);
        })
        .catch((err) => {
          console.error("Failed to load project:", err);
        })
        .finally(() => {
          setLoadingProject(false);
        });
    } else {
      setSubmitted(false);
      setCreatedProject(null);
    }
  }, [search.projectId]);

  const updateField = (field: keyof typeof formData) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  async function submitBrief() {
    setSubmitError(null);
    if (!user) {
      // Save draft locally and show brief preview with account creation prompt
      localStorage.setItem("temp_project_brief", JSON.stringify(formData));
      setShowBriefReview(true);
      return;
    }
    setSubmitting(true);
    try {
      const firstService = formData.services[0] === "Other" ? formData.otherService : (formData.services[0] ?? "Project");
      const r = await projectApi.create({
        title: formData.company ? `${formData.company} — ${firstService}` : `${firstService} brief`,
        description: formData.details || undefined,
        services: formData.services.map(s => s === "Other" ? formData.otherService : s),
        budget: formData.budget,
        country: formData.country,
        industry: formData.industry === "Other" ? formData.otherIndustry : formData.industry,
      });
      setCreatedProject(r.project);
      setSubmitted(true);
      navigate({
        search: (prev) => ({
          ...prev,
          projectId: r.project._id,
        }),
      });
    } catch (err) {
      setSubmitError(err instanceof ApiError ? err.message : "Failed to submit brief");
    } finally {
      setSubmitting(false);
    }
  }

  const canNext =
    (step === 0 &&
      formData.services.length > 0 &&
      (!formData.services.includes("Other") || formData.otherService.trim().length > 0)
    ) ||
    (step === 1 && !!formData.budget && !!formData.timeline) ||
    (step === 2 &&
      !!formData.country &&
      !!formData.industry &&
      (formData.industry !== "Other" || formData.otherIndustry.trim().length > 0)
    ) ||
    (step === 3 && formData.name.length > 1 && formData.email.includes("@") && formData.company.length > 1) ||
    step === 4;

  if (loadingProject) {
    return (
      <div className="flex min-h-screen flex-col bg-[#121212]">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center text-white">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-hyperblue border-t-transparent" />
            <span className="text-xs font-bold uppercase tracking-widest text-white/50">Loading matches...</span>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (submitted && createdProject) {
    return (
      <div className="flex min-h-screen flex-col bg-[#121212]">
        <SiteHeader />

        {/* Sleek Dark Hero Section matching user search hero */}
        <section className="bg-[#121212] text-white pt-24 pb-28 relative overflow-hidden border-b border-white/5">
          {/* Background Grid Pattern */}
          <div className="architectural-grid absolute inset-0 opacity-15 pointer-events-none" />

          {/* Radial Glow Highlight */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-hyperblue/10 rounded-full blur-3xl pointer-events-none" />

          <div className="mx-auto max-w-7xl px-4 md:px-6 relative z-10 text-center flex flex-col items-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1 mb-6 shadow-sm backdrop-blur-sm text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="eyebrow text-[9px] font-bold tracking-widest uppercase">Brief Received Successfully</span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl max-w-4xl leading-[1.1]">
              Your shortlist is ready, <span className="text-hyperblue font-extrabold">{(formData.name || createdProject.clientUserId?.name || "there").split(" ")[0]}</span>.
            </h1>

            {/* Subheading */}
            <p className="mt-6 max-w-2xl text-base md:text-lg font-medium text-white/70 leading-relaxed">
              We've matched <span className="text-hyperblue font-extrabold tabular-nums">{createdProject.matchedAgencies.length}</span>{" "}
              vetted agencies to your brief. Each partner has been notified and will review your requirements.
            </p>

            <div className="mt-8 flex items-center gap-2 text-xs font-bold text-white/50 bg-white/5 border border-white/10 rounded-lg px-4 py-2 backdrop-blur-sm">
              <span className="text-emerald-400 font-extrabold">✓</span> Expect first responses within 24 hours
            </div>
          </div>
        </section>

        <section className="py-16 bg-background flex-1">
          <div className="mx-auto max-w-7xl px-4 md:px-6">
            <div className="mb-10 text-left border-b border-border/40 pb-6">
              <h2 className="text-2xl font-black text-obsidian tracking-tight uppercase">Matched Partners</h2>
              <p className="text-sm font-bold text-steel-dark mt-1">Based on your service criteria, budget, and target market.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
              {createdProject.matchedAgencies.map((a) => (
                <AgencyCard key={a._id} agency={adaptAgency(a)} />
              ))}
            </div>

            <div className="mt-16 flex flex-col items-center justify-center gap-3">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-obsidian px-8 py-4 text-xs font-extrabold uppercase tracking-widest text-white shadow-lg hover:bg-hyperblue hover:scale-[1.02] active:scale-[0.98] transition-all duration-200"
              >
                Go to your dashboard
                <ArrowRight className="size-4" />
              </Link>
              <span className="text-xs font-bold text-steel-dark">Track responses, message agencies, and compare offers</span>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    );
  }

  if (showBriefReview && !user) {
    return (
      <div className="flex min-h-screen flex-col bg-slate-50">
        <SiteHeader />

        <div className="mx-auto max-w-7xl px-4 py-8 md:px-6 w-full flex-1 flex flex-col lg:flex-row gap-8">

          {/* Left panel: Outline (Clutch style light blue background sidebar) */}
          <div className="w-full lg:w-1/4 bg-[#e0efff]/60 rounded-2xl p-6 border border-[#cbe1fb] flex flex-col gap-6">
            <div>
              <h2 className="text-xl font-bold text-[#1b365d] flex items-center gap-2">
                Your Project Brief
                <span className="text-xs font-semibold text-slate-400 bg-white/80 rounded-full px-2.5 py-0.5 border border-slate-200">i</span>
              </h2>
              <ul className="mt-6 space-y-4 text-xs font-bold text-slate-500/80">
                <li className="flex items-center gap-2 text-[#2563eb]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb]" /> Review your project details
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> We'll send your project to best-fit providers
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" /> Receive a response directly
                </li>
              </ul>
            </div>

            <div className="border-t border-[#cbe1fb] pt-6">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#1b365d]/50">Outline</span>
              <ul className="mt-4 space-y-3.5 text-xs font-semibold text-slate-600">
                <li className="text-slate-400">Key Information</li>
                <li className="text-[#2563eb] bg-[#2563eb]/10 px-3 py-1.5 rounded-lg border border-[#2563eb]/20">Introduction</li>
                <li className="hover:text-slate-800 cursor-pointer">Objectives</li>
                <li className="hover:text-slate-800 cursor-pointer">Services Needed</li>
                <li className="hover:text-slate-800 cursor-pointer">Key Deliverables</li>
                <li className="hover:text-slate-800 cursor-pointer">Questions</li>
                <li className="hover:text-slate-800 cursor-pointer">Additional Requirements</li>
              </ul>
            </div>
          </div>

          {/* Right panel: Details & Content */}
          <div className="flex-1 bg-white rounded-2xl p-6 md:p-8 border border-slate-200/80 shadow-sm relative overflow-hidden flex flex-col gap-6 min-h-[500px]">

            {/* Meta Table (Clutch style details box) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-slate-200 border border-slate-200 rounded-xl overflow-hidden text-xs font-semibold text-slate-700">
              <div className="bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Timeline</span>
                <span className="font-bold text-slate-800">
                  {formData.timeline === "Custom Range" ? `${formData.customTimelineMonths} months` : formData.timeline}
                </span>
              </div>
              <div className="bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Budget</span>
                <span className="font-bold text-slate-800">
                  {BUDGET_TIERS.find((b) => b.id === formData.budget)?.label ?? "—"}
                </span>
              </div>
              <div className="bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Location Preference</span>
                <span className="font-bold text-slate-800">{formData.country}</span>
              </div>
              <div className="bg-slate-50/50 p-4 flex items-center justify-between gap-4">
                <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Contact</span>
                <span className="font-bold text-slate-800">{formData.name || "—"} {formData.company ? `(${formData.company})` : ""}</span>
              </div>
            </div>

            {/* Introduction block */}
            <div className="flex flex-col gap-3">
              <h3 className="text-base font-bold text-slate-800">Introduction</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                We are a company in the {formData.industry === "Other" ? formData.otherIndustry : formData.industry} industry, seeking a skilled {formData.services.map(s => s === "Other" ? formData.otherService : s).join(" & ") || "agency"} service provider to assist with our project requirements.
              </p>
            </div>

            {/* Objectives block */}
            <div className="flex flex-col gap-3 pb-40">
              <h3 className="text-base font-bold text-slate-800">Objectives</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                {formData.details || `Develop and execute key solutions in ${formData.country} to achieve our strategic goals in the ${formData.industry === "Other" ? formData.otherIndustry : formData.industry} sector.`}
              </p>
            </div>

            {/* BLURRED / LOCKED OVERLAY (Access your full project brief) */}
            <div className="absolute inset-x-0 bottom-0 h-80 bg-gradient-to-t from-white via-white/95 to-transparent flex flex-col items-center justify-end p-8 border-t border-slate-100 z-20">
              <div className="w-full max-w-2xl bg-gradient-to-br from-[#f8fafc] to-[#f1f5f9] rounded-2xl border border-slate-200/80 shadow-lg p-6 md:p-8 flex flex-col items-center text-center">
                <h4 className="text-xl font-bold text-[#1b365d] tracking-tight">Access Your Full Project Brief</h4>
                <p className="text-xs font-semibold text-slate-500 mt-2 max-w-md">
                  Create an account or sign in to view your project brief and matched providers.
                </p>
                <div className="mt-6 flex flex-col sm:flex-row gap-3 w-full justify-center">
                  <Link
                    to="/login/"
                    search={{
                      tab: "signup",
                      redirect: "/submit-project/",
                      name: formData.name,
                      email: formData.email,
                      company: formData.company
                    }}
                    className="rounded-xl bg-obsidian hover:bg-neutral-800 text-white px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-md hover:shadow-lg active:scale-98 cursor-pointer text-center"
                  >
                    Create an Account
                  </Link>
                  <Link
                    to="/login/"
                    search={{
                      tab: "signin",
                      redirect: "/submit-project/"
                    }}
                    className="rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-obsidian px-8 py-3.5 text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md active:scale-98 cursor-pointer text-center"
                  >
                    Sign In
                  </Link>
                </div>
              </div>
            </div>

          </div>

        </div>

        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white relative overflow-hidden font-sans">
      {/* Premium Ambient Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-hyperblue/[0.03] rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-hyperblue/[0.02] rounded-full blur-[140px] pointer-events-none" />
      <div className="architectural-grid pointer-events-none absolute inset-0 opacity-10" />

      <SiteHeader />

      {/* Split Screen Layout Main Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 py-6 md:py-16 flex flex-col md:flex-row gap-8 md:gap-16 items-start relative z-10">
        
        {/* Left Half: Title and Vertical Stepper */}
        <div className="w-full md:w-[320px] shrink-0 flex flex-col text-left md:sticky md:top-28 mt-2">
          {/* Pill Switcher */}
          <div className="inline-flex rounded-full bg-slate-100/80 p-0.5 border border-slate-200/80 mb-5 shadow-xs backdrop-blur-md select-none relative self-start">
            <Link
              to="/submit-project/"
              className="rounded-full bg-obsidian px-4 py-1.5 text-[10px] font-bold text-white shadow-xs transition-all"
            >
              I'm looking for an agency
            </Link>
            <Link
              to="/for-agencies/"
              className="rounded-full bg-transparent px-4 py-1.5 text-[10px] font-bold text-slate-500 hover:text-obsidian transition-colors"
            >
              List my agency
            </Link>
          </div>

          {/* Heading */}
          <h1 className="text-2xl sm:text-3xl md:text-[38px] font-black tracking-tight leading-[1.08] text-obsidian">
            Tell us about your project
          </h1>

          {/* Subtitle */}
          <p className="mt-3 text-xs md:text-sm font-semibold text-slate-500 leading-relaxed">
            Takes ~3 minutes. We'll match you with up to 10 premium agencies globally.
          </p>

          {/* Vertical Stepper - Desktop */}
          <div className="mt-8 hidden md:block w-full">
            <div className="flex flex-col gap-6 relative pl-3">
              {/* Vertical Connector Line */}
              <div className="absolute left-[29px] top-4 bottom-4 w-[2px] bg-slate-100 z-0" />
              <div
                className="absolute left-[29px] top-4 w-[2px] bg-hyperblue z-0 transition-all duration-500 ease-out"
                style={{ height: `calc(${(step / (STEPS.length - 1)) * 100}% - 8px)` }}
              />

              {STEPS.map((s, i) => {
                const isCompleted = i < step;
                const isCurrent = i === step;
                const isActive = i <= step;

                return (
                  <div key={s} className="flex items-center gap-4 relative z-10">
                    <div
                      className={`size-9 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                        isCurrent
                          ? "bg-white border-hyperblue text-hyperblue shadow-[0_0_12px_rgba(0,59,179,0.2)]"
                          : isCompleted
                            ? "bg-hyperblue border-hyperblue text-white"
                            : "bg-white border-slate-200 text-slate-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="size-3 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <span className="text-xs font-black">{i + 1}</span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-colors duration-300 ${
                        isCurrent
                          ? "text-obsidian"
                          : isActive
                            ? "text-slate-600"
                            : "text-slate-400"
                      }`}
                    >
                      {s}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Progress Stepper - Mobile */}
          <div className="mt-4 mb-2 md:hidden w-full">
            <div className="flex gap-1.5 mb-2">
              {STEPS.map((s, i) => (
                <div
                  key={s}
                  className={`h-1 flex-1 rounded-full transition-all duration-500 ${
                    i === step
                      ? "bg-hyperblue shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                      : i < step
                        ? "bg-hyperblue/40"
                        : "bg-slate-100"
                  }`}
                />
              ))}
            </div>
            <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-slate-400">
              <span>Step {String(step + 1).padStart(2, "0")} / {String(STEPS.length).padStart(2, "0")}</span>
              <span className="text-hyperblue">{STEPS[step]}</span>
            </div>
          </div>

        </div>

        {/* Right Half: Form Card */}
        <div className="flex-1 w-full">
          <div className="relative rounded-[32px] border border-black/[0.06] bg-white p-6 sm:p-8 md:p-12 shadow-[0_30px_70px_rgba(0,0,0,0.06)] overflow-hidden z-10">
            {step === 0 && (
              <div className="animate-fade-in">
                <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">
                  What services do you need?
                </h2>
                <p className="mt-1 text-xs md:text-sm font-semibold text-slate-400">Select all that apply.</p>

                <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {SERVICE_CATEGORIES.map((s, index) => {
                    const active = formData.services.includes(s);
                    const animationDelay = `${index * 40}ms`;

                    if (s === "Other" && active) {
                      return (
                        <div
                          key={s}
                          style={{ animationDelay }}
                          className="relative flex items-center rounded-2xl border border-obsidian bg-obsidian text-white shadow-[0_0_0_1px_rgba(0,59,179,1),0_0_15px_rgba(0,59,179,0.25)] px-6 py-5 animate-fade-in transition-all duration-250 ease-out"
                        >
                          <input
                            type="text"
                            autoFocus
                            value={formData.otherService}
                            onChange={(e) => updateField("otherService")(e.target.value)}
                            placeholder="Specify (e.g. Video Production, PR)"
                            className="w-full bg-transparent text-xs sm:text-sm font-bold text-white placeholder-white/50 outline-none border-none p-0 focus:ring-0 focus:outline-none"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateField("otherService")("");
                              updateField("services")(formData.services.filter((x) => x !== "Other"));
                            }}
                            className="ml-2 text-white/70 hover:text-white p-1 hover:bg-white/10 rounded-full transition-colors shrink-0"
                            aria-label="Remove Other"
                          >
                            <svg className="size-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={s}
                        type="button"
                        style={{ animationDelay }}
                        onClick={() =>
                          updateField("services")(
                            formData.services.includes(s)
                              ? formData.services.filter((x) => x !== s)
                              : [...formData.services, s]
                          )
                        }
                        className={`group relative rounded-2xl border px-6 py-5 text-left text-xs sm:text-sm font-bold tracking-wide transition-all duration-250 ease-out cursor-pointer hover:border-hyperblue hover:shadow-[0_8px_30px_rgba(0,59,179,0.06)] animate-fade-in ${active
                            ? "border-obsidian bg-obsidian text-white shadow-[0_0_0_1px_rgba(0,59,179,1),0_0_15px_rgba(0,59,179,0.25)]"
                            : "border-slate-200 bg-white text-slate-700 hover:text-obsidian"
                          }`}
                      >
                        <span>{s}</span>
                        {active && (
                          <span className="absolute top-5.5 right-6 size-2 rounded-full bg-hyperblue shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Budget</h2>
                  <p className="mt-1 text-xs md:text-sm font-semibold text-slate-400">
                    Approximate budget for this engagement.
                  </p>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {BUDGET_TIERS.map((b, index) => {
                      const active = formData.budget === b.id;
                      const animationDelay = `${index * 40}ms`;
                      return (
                        <button
                          key={b.id}
                          type="button"
                          style={{ animationDelay }}
                          onClick={() => updateField("budget")(b.id)}
                          className={`group relative rounded-2xl border px-6 py-5 text-left text-xs sm:text-sm font-bold tracking-wide transition-all duration-250 ease-out cursor-pointer hover:border-hyperblue hover:shadow-[0_8px_30px_rgba(0,59,179,0.06)] animate-fade-in ${active
                              ? "border-obsidian bg-obsidian text-white shadow-[0_0_0_1px_rgba(0,59,179,1),0_0_15px_rgba(0,59,179,0.25)]"
                              : "border-slate-200 bg-white text-slate-700 hover:text-obsidian"
                            }`}
                        >
                          <span>{b.label}</span>
                          {active && (
                            <span className="absolute top-5.5 right-6 size-2 rounded-full bg-hyperblue shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Timeline</h2>
                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {["ASAP", "1-3 months", "3-6 months", "6+ months", "AMC", "Custom Range"].map((t, index) => {
                      const active = formData.timeline === t;
                      const animationDelay = `${index * 40}ms`;
                      return (
                        <button
                          key={t}
                          type="button"
                          style={{ animationDelay }}
                          onClick={() => updateField("timeline")(t)}
                          className={`group relative rounded-xl border px-5 py-4 text-center text-xs sm:text-sm font-bold tracking-wide transition-all duration-250 ease-out cursor-pointer hover:border-hyperblue hover:shadow-[0_8px_30px_rgba(0,59,179,0.06)] animate-fade-in ${active
                              ? "border-obsidian bg-obsidian text-white shadow-[0_0_0_1px_rgba(0,59,179,1),0_0_15px_rgba(0,59,179,0.25)]"
                              : "border-slate-200 bg-white text-slate-700 hover:text-obsidian"
                            }`}
                        >
                          <span>{t}</span>
                          {active && (
                            <span className="absolute top-5 right-5 size-1.5 rounded-full bg-hyperblue shadow-[0_0_8px_rgba(37,99,235,0.8)]" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {formData.timeline === "Custom Range" && (
                    <div className="mt-6 space-y-3 animate-fade-in">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Duration (months)</span>
                        <span className="text-sm font-extrabold text-hyperblue">{formData.customTimelineMonths} months</span>
                      </div>
                      <Slider
                        value={[formData.customTimelineMonths]}
                        min={1}
                        max={36}
                        step={1}
                        onValueChange={([val]) => updateField("customTimelineMonths")(val)}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                        <span>1 Month</span>
                        <span>3 Years</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Primary market</h2>
                  <div className="relative flex items-center mt-3">
                    <CountrySelect
                      value={formData.country}
                      onChange={(val) => updateField("country")(val as Country)}
                      excludeAllCountries
                    />
                  </div>
                </div>

                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Industry</h2>
                  <div className="relative flex items-center mt-3 w-full">
                    <DropdownSelect
                      value={formData.industry}
                      onChange={(val) => updateField("industry")(val as Industry)}
                      options={INDUSTRIES as unknown as string[]}
                      placeholder="Select Industry"
                    />
                  </div>
                </div>

                {formData.industry === "Other" && (
                  <div className="mt-2 animate-fade-in">
                    <label className="flex flex-col gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Please specify industry</span>
                      <input
                        type="text"
                        value={formData.otherIndustry}
                        onChange={(e) => updateField("otherIndustry")(e.target.value)}
                        placeholder="e.g. Fintech, Manufacturing, etc."
                        className="w-full rounded-2xl border border-slate-200 bg-white px-5 py-4 text-xs sm:text-sm font-bold text-obsidian outline-none transition-all hover:border-slate-300 focus:border-hyperblue focus:ring-4 focus:ring-hyperblue/5 shadow-xs"
                      />
                    </label>
                  </div>
                )}

                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">
                    Project description (optional)
                  </h2>
                  <textarea
                    rows={4}
                    value={formData.details}
                    onChange={(e) => updateField("details")(e.target.value)}
                    placeholder="Tell us more about scope, goals, audiences..."
                    className="mt-3.5 w-full rounded-[20px] border border-slate-200 bg-white p-5 text-xs sm:text-sm font-semibold text-obsidian outline-none transition-all hover:border-slate-300 focus:border-hyperblue focus:ring-4 focus:ring-hyperblue/5 shadow-xs leading-relaxed"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Your details</h2>
                  <p className="mt-1 text-xs md:text-sm font-semibold text-slate-400">
                    Used only to match you with agencies. Never shared publicly.
                  </p>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                  <Input label="Full name" value={formData.name} onChange={updateField("name")} />
                  <Input label="Company" value={formData.company} onChange={updateField("company")} />
                  <div className="md:col-span-2">
                    <Input label="Work email" value={formData.email} onChange={updateField("email")} type="email" />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6 animate-fade-in">
                <h2 className="text-base md:text-lg font-black tracking-tight text-obsidian uppercase">Review your brief</h2>
                <div className="mt-4 border-t border-slate-100 divide-y divide-slate-100">
                  {/* Services Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-1">Services</span>
                    <div className="flex flex-wrap gap-2 flex-1">
                      {formData.services.map(s => s === "Other" ? formData.otherService : s).map((service) => (
                        <span key={service} className="rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-[8px] font-black uppercase tracking-widest text-obsidian shadow-xs">
                          {service}
                        </span>
                      ))}
                      {formData.services.length === 0 && <span className="text-xs text-neutral-400">—</span>}
                    </div>
                  </div>

                  {/* Budget Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Budget</span>
                    <div className="text-xs font-bold text-obsidian flex-1">
                      {BUDGET_TIERS.find((b) => b.id === formData.budget)?.label ?? "—"}
                    </div>
                  </div>

                  {/* Timeline Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Timeline</span>
                    <div className="text-xs font-bold text-obsidian flex-1">
                      {formData.timeline === "Custom Range" ? `${formData.customTimelineMonths} months` : formData.timeline}
                    </div>
                  </div>

                  {/* Market Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Market</span>
                    <div className="text-xs font-bold text-obsidian flex-1">
                      {formData.country}
                    </div>
                  </div>

                  {/* Industry Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Industry</span>
                    <div className="text-xs font-bold text-obsidian flex-1">
                      {formData.industry === "Other" ? formData.otherIndustry : formData.industry}
                    </div>
                  </div>

                  {/* Contact Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Contact</span>
                    <div className="text-xs font-bold text-obsidian flex-1 space-y-1">
                      <p className="text-obsidian">{formData.name}</p>
                      <p className="text-slate-500 font-semibold">{formData.company} · {formData.email}</p>
                    </div>
                  </div>

                  {/* Details Row */}
                  {formData.details && (
                    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-6 py-4">
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 sm:w-32 shrink-0 pt-0.5">Details</span>
                      <div className="flex-1">
                        <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 text-xs text-slate-600 leading-relaxed font-semibold">
                          {formData.details}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {!user && (
                  <div className="flex items-center gap-3 rounded-xl border border-hyperblue/20 bg-hyperblue/5 p-3 text-xs font-bold text-hyperblue mt-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-hyperblue/10">
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <span>You'll be asked to sign in before your brief is saved.</span>
                  </div>
                )}
                {submitError && (
                  <div className="flex items-center gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3 text-xs font-bold text-destructive animate-shake mt-3">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                      <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </span>
                    <span>{submitError}</span>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-5">
              <button
                type="button"
                disabled={step === 0}
                onClick={() => setStep((s) => Math.max(0, s - 1))}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-obsidian hover:border-slate-300 hover:shadow-sm active:scale-[0.97] transition-all duration-300 cursor-pointer disabled:opacity-30 disabled:hover:border-slate-200 disabled:hover:text-slate-500 disabled:active:scale-100"
              >
                <ArrowLeft className="size-3.5 stroke-[2.5]" />
                Back
              </button>
              {step < STEPS.length - 1 ? (
                <button
                  type="button"
                  disabled={!canNext}
                  onClick={() => setStep((s) => s + 1)}
                  className="inline-flex items-center gap-2 rounded-xl bg-obsidian px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-obsidian/10 hover:bg-neutral-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 cursor-pointer disabled:opacity-40 disabled:hover:scale-100 disabled:hover:bg-obsidian disabled:active:scale-100"
                >
                  Continue
                  <ArrowRight className="size-3.5 stroke-[2.5]" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submitBrief}
                  disabled={submitting}
                  className="inline-flex items-center gap-2 rounded-xl bg-obsidian px-6 py-3 text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-obsidian/10 hover:bg-neutral-800 hover:shadow-xl hover:scale-[1.02] active:scale-[0.97] transition-all duration-300 cursor-pointer disabled:opacity-60 disabled:hover:scale-100 disabled:hover:bg-obsidian disabled:active:scale-100"
                >
                  {submitting ? "Matching…" : "Submit brief & see matches"}
                  {!submitting && <ArrowRight className="size-3.5 stroke-[2.5]" />}
                </button>
              )}
            </div>
          </div>
        </div>

      </main>

      {/* Global CSS Styles for premium transitions */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />

      <SiteFooter />
    </div>
  );
}

const Input = memo(function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-black/[0.06] bg-white px-4 py-2.5 text-xs font-bold text-obsidian outline-none transition-all hover:border-black/20 focus:border-obsidian focus:ring-2 focus:ring-obsidian/5 shadow-xs"
      />
    </label>
  );
});

const ReviewRow = memo(function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-6 py-3.5 border-b border-border/30 last:border-b-0">
      <span className="text-[10px] font-bold uppercase tracking-wider text-steel-dark">{label}</span>
      <span className="text-right text-xs font-bold text-obsidian">{value}</span>
    </div>
  );
});

