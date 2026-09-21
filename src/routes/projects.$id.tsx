import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AgencyCard } from "@/components/agency-card";
import { BUDGET_TIERS, SERVICE_CATEGORIES, COUNTRIES, INDUSTRIES, type Agency } from "@/lib/mock-data";
import { projectApi, leadApi, agencyApi, meetingsApi, type ApiProject, type ApiAgency, type ApiLead, type ApiMeeting } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { Wallet, MapPin, Building2, LayoutGrid, ChevronLeft, ChevronDown, Calendar, User, Briefcase, Clock, ShieldCheck, Mail, Loader2, Check, Video } from "lucide-react";
import { ProjectLoader } from "@/components/project-loader";
import { CountrySelect } from "@/components/country-select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { DropdownSelect } from "@/components/dropdown-select";
import { ScheduleMeetingModal } from "@/components/schedule-meeting-modal";

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

export const Route = createFileRoute("/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: "Project details — Finding Global" },
    ],
    links: [
      { rel: "canonical", href: `https://findingglobal.com/projects/${params.id}/` },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [project, setProject] = useState<ApiProject | null>(null);
  const [leads, setLeads] = useState<ApiLead[]>([]);
  const [meetings, setMeetings] = useState<ApiMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [selectedAgencyId, setSelectedAgencyId] = useState("");
  const [closeSuccess, setCloseSuccess] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [bookingLeadId, setBookingLeadId] = useState<string | null>(null);
  const [scheduleModal, setScheduleModal] = useState<{
    isOpen: boolean;
    agencySlug: string;
    agencyName: string;
  }>({
    isOpen: false,
    agencySlug: "",
    agencyName: ""
  });

  // States for rating inside modal
  const [showReviewFormInModal, setShowReviewFormInModal] = useState(false);
  const [reviewSuccessInModal, setReviewSuccessInModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHover, setReviewHover] = useState(0);
  const [reviewExcerpt, setReviewExcerpt] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const handleSubmitModalReview = async () => {
    if (reviewRating === 0) {
      setReviewError("Please select a rating.");
      return;
    }
    if (reviewExcerpt.length < 10) {
      setReviewError("Review must be at least 10 characters.");
      return;
    }

    setSubmittingReview(true);
    setReviewError(null);
    try {
      await agencyApi.submitReview(selectedAgencyId, {
        rating: reviewRating,
        excerpt: reviewExcerpt,
        projectId: project?._id || id
      });
      setReviewSuccessInModal(true);
      if (project) {
        setProject({
          ...project,
          status: "Closed",
          hiredAgency: selectedAgencyId
        });
      }
      setTimeout(() => {
        setShowCloseModal(false);
        setShowReviewFormInModal(false);
        setReviewSuccessInModal(false);
      }, 2000);
    } catch (e) {
      setReviewError(e instanceof Error ? e.message : "Failed to submit review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleCloseProject = async () => {
    if (!selectedAgencyId) return;
    setClosing(true);
    try {
      const { project: updated } = await projectApi.update(id, {
        status: "Closed",
        hiredAgency: selectedAgencyId === "none" ? null : selectedAgencyId
      } as any);
      setProject(updated);
      setCloseSuccess(true);

      setReviewRating(0);
      setReviewExcerpt("");
      setReviewError(null);

      setTimeout(() => {
        if (selectedAgencyId !== "none") {
          setCloseSuccess(false);
          setShowReviewFormInModal(true);
        } else {
          setShowCloseModal(false);
          setCloseSuccess(false);
        }
      }, 1500);
    } catch (err) {
      toast.error("Failed to close project.");
    } finally {
      setClosing(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/login" });
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    setLoading(true);
    projectApi
      .get(id)
      .then((r) => {
        if (!cancel) {
          setProject(r.project);
          setLeads(r.leads || []);
        }
      })
      .catch((e) => { if (!cancel) setError(e instanceof Error ? e.message : "Failed to load project."); })
      .finally(() => { if (!cancel) setLoading(false); });
    meetingsApi
      .list()
      .then((r) => !cancel && setMeetings(r.meetings))
      .catch((e) => console.error("Error loading meetings:", e));

    return () => { cancel = true; };
  }, [id, user]);

  if (loading || authLoading) {
    return <ProjectLoader />;
  }

  if (error || !project) {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <SiteHeader />
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-2xl font-extrabold">Project not found</h1>
          <p className="text-sm text-steel-dark">{error ?? "This project doesn't exist or you don't have access."}</p>
          <Link to="/dashboard/" className="rounded-sm bg-obsidian px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue">
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const matched = project.matchedAgencies ?? [];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />

      {/* HEADER */}
      <section className="border-b border-border bg-card py-5 md:py-6">
        <div className="mx-auto max-w-7xl px-4 md:px-6">
          <Link to="/dashboard/" className="group flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.2em] text-steel-dark hover:text-hyperblue transition-colors">
            <svg className="size-3 transition-transform group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
            Back to dashboard
          </Link>

          <div className="mt-4 sm:mt-5 flex flex-col md:flex-row md:items-start justify-between gap-4 md:gap-5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-mono text-[9px] font-bold tracking-widest text-steel uppercase bg-surface px-2 py-1 rounded border border-border/50">
                  #{project._id.slice(-6)}
                </span>
                <StatusBadge status={project.status} />
              </div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-obsidian leading-[1.05]">{project.title}</h1>
            </div>
            {user?.role === "client" && project.status !== "Closed" && (
              <button
                onClick={() => setShowCloseModal(true)}
                className="rounded-xl border border-border bg-white px-4.5 py-2.5 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface hover:border-obsidian transition-all shadow-sm active:scale-95 w-full sm:w-auto text-center justify-center flex items-center"
              >
                Close Project
              </button>
            )}
          </div>

          <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
            {[
              {
                l: "Budget",
                v: BUDGET_TIERS.find((b) => b.id === project.budget)?.label ?? project.budget,
                i: <Wallet className="size-3.5 text-obsidian" strokeWidth={1.5} />
              },
              {
                l: "Market",
                v: project.country,
                i: <MapPin className="size-3.5 text-obsidian" strokeWidth={1.5} />
              },
              {
                l: "Industry",
                v: project.industry,
                i: <Building2 className="size-3.5 text-obsidian" strokeWidth={1.5} />
              },
              {
                l: "Services",
                v: project.services[0],
                i: <LayoutGrid className="size-3.5 text-obsidian" strokeWidth={1.5} />
              }
            ].map((item) => (
              <div key={item.l} className="group rounded-2xl border border-border bg-white p-3 sm:p-4 shadow-sm hover:border-obsidian/30 transition-all active:scale-95">
                <div className="flex items-center gap-2.5 mb-2.5">
                  <div className="size-7.5 rounded-xl bg-obsidian/5 flex items-center justify-center border border-obsidian/10 group-hover:scale-110 transition-transform">
                    {item.i}
                  </div>
                  <div className="text-[8px] sm:text-[9px] font-bold uppercase tracking-wider sm:tracking-widest text-steel">{item.l}</div>
                </div>
                <div className="text-xs sm:text-sm font-bold text-obsidian tracking-tight leading-snug">{item.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BODY */}
      <section className="py-6 md:py-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-[1fr_340px] px-4 md:px-6">
          <div>
            {/* Meeting Requests Section */}
            {user?.role === "client" && leads.some(l => l.meetingRequested) && (
              <div className="mb-10">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">Meeting Requests</h2>
                  <div className="flex size-6 items-center justify-center rounded-full bg-hyperblue/5 text-hyperblue text-[10px] font-bold border border-hyperblue/10 animate-pulse">!</div>
                </div>
                <div className="space-y-3">
                  {leads.filter(l => l.meetingRequested).map(l => {
                    const meeting = meetings.find(
                      (m) => m.agencySlug === l.agency?.slug && m.status !== "cancelled" && m.status !== "declined"
                    );
                    return (
                      <div key={l._id} className="group flex flex-col lg:flex-row lg:items-center rounded-2xl border border-border bg-white p-4 sm:p-4.5 transition-all hover:border-hyperblue/30 hover:shadow-elevated gap-4">
                        <div className="flex items-center gap-4 mb-3 lg:mb-0 w-full lg:w-[280px] xl:w-[340px] shrink-0">
                          <div className="size-12 overflow-hidden rounded-2xl bg-surface border border-border group-hover:border-hyperblue transition-colors">
                            <img
                              src={l.agency?.logoSeed?.startsWith("data:") || l.agency?.logoSeed?.startsWith("http") ? l.agency.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${l.agency?.logoSeed || l.agency?.slug || "global"}&backgroundColor=0038ff,050505,52525B`}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-base font-bold text-obsidian tracking-tight group-hover:text-hyperblue transition-colors truncate">{l.agency?.name}</div>
                            <div className="flex items-center gap-2 mt-1 min-w-0">
                              <span className="relative flex size-2 shrink-0">
                                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${l.meetingBooked ? 'bg-emerald-500' : 'bg-hyperblue'} opacity-75`}></span>
                                <span className={`relative inline-flex rounded-full size-2 ${l.meetingBooked ? 'bg-emerald-500' : 'bg-hyperblue'}`}></span>
                              </span>
                              <span className={`text-[9px] font-bold uppercase tracking-[0.1em] shrink-0 ${l.meetingBooked ? 'text-emerald-600' : 'text-hyperblue'}`}>
                                {l.meetingBooked ? 'Call Scheduled' : 'Requested a meeting'}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 flex flex-wrap lg:flex-nowrap items-center gap-3 lg:gap-4 w-full lg:w-auto lg:min-w-0">
                          {l.meetingBooked ? (
                            meeting ? (
                              <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <button className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer">
                                      Details
                                      <ChevronDown className="size-3 text-steel-dark" />
                                    </button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-80 p-5 rounded-2xl border border-border bg-white shadow-elevated" align="end">
                                    <div className="space-y-3">
                                      <h4 className="font-bold text-obsidian text-sm tracking-tight border-b border-border/60 pb-2 text-left">Scheduled Call Details</h4>
                                      <div className="grid grid-cols-2 gap-4 text-left">
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-steel">Date</span>
                                          <span className="text-xs font-black text-obsidian">{meeting.date}</span>
                                        </div>
                                        <div className="flex flex-col gap-0.5">
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-steel">Time</span>
                                          <span className="text-xs font-black text-obsidian">
                                            {meeting.time} <span className="text-[10px] font-medium text-steel">({meeting.timezone?.split(" ")[0] || "GST"})</span>
                                          </span>
                                        </div>
                                      </div>
                                      {meeting.meetingLink && (
                                        <div className="pt-3 border-t border-border/60">
                                          <span className="text-[9px] font-bold uppercase tracking-wider text-steel block mb-2 text-left">Meeting Link</span>
                                          <a
                                            href={meeting.meetingLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-hyperblue hover:bg-obsidian px-4 py-2.5 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-hyperblue/20 active:scale-95 transition-all"
                                          >
                                            <Video className="size-3.5" />
                                            Join Meeting Room
                                          </a>
                                        </div>
                                      )}
                                    </div>
                                  </PopoverContent>
                                </Popover>

                                {meeting.meetingLink && (
                                  <a
                                    href={meeting.meetingLink}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 rounded-xl bg-hyperblue hover:bg-obsidian px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white shadow-lg shadow-hyperblue/20 active:scale-95 transition-all shrink-0"
                                  >
                                    <Video className="size-3.5" />
                                    Join Call
                                  </a>
                                )}
                                <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                                <button
                                  onClick={() => setScheduleModal({
                                    isOpen: true,
                                    agencySlug: l.agency?.slug || "",
                                    agencyName: l.agency?.name || ""
                                  })}
                                  className="rounded-xl bg-obsidian px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue shadow-lg shadow-obsidian/10 active:scale-95 transition-all shrink-0"
                                >
                                  Schedule Call
                                </button>
                                <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                              </div>
                            )
                          ) : (
                            <div className="flex items-center gap-2 lg:ml-auto ml-0 w-full lg:w-auto justify-end shrink-0">
                              <button
                                disabled={bookingLeadId === l._id}
                                onClick={async () => {
                                  setBookingLeadId(l._id);
                                  try {
                                    const { lead: updated } = await leadApi.update(l._id, { meetingBooked: true });
                                    const updatedLeads = leads.map(item => item._id === l._id ? updated : item);
                                    setLeads(updatedLeads);
                                    toast.success("Meeting successfully booked!");
                                  } catch (e) {
                                    toast.error("Failed to book meeting");
                                  } finally {
                                    setBookingLeadId(null);
                                  }
                                }}
                                className="rounded-xl bg-obsidian px-6 py-2 text-[9px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue shadow-lg shadow-obsidian/10 active:scale-95 transition-all flex items-center justify-center gap-2 min-w-[130px] disabled:opacity-70 disabled:cursor-not-allowed shrink-0"
                              >
                                {bookingLeadId === l._id ? (
                                  <>
                                    <Loader2 className="size-3.5 animate-spin" />
                                    Confirming...
                                  </>
                                ) : (
                                  "Confirm Booking"
                                )}
                              </button>
                              <Link to="/agencies/$slug" params={{ slug: l.agency?.slug || "" }} className="rounded-xl border border-border bg-white px-4.5 py-2 text-[9px] font-bold uppercase tracking-widest text-obsidian hover:bg-surface active:scale-95 transition-all shrink-0">Profile</Link>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold tracking-tight text-obsidian">Matched Agencies</h2>
              <div className="text-[9px] font-bold uppercase tracking-widest text-steel bg-surface px-2.5 py-1 rounded-lg border border-border">{matched.length} FOUND</div>
            </div>
            {matched.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
                <p className="font-bold text-base">No matches yet.</p>
                <p className="mt-1 text-xs text-steel-dark">Our engine is still scanning the directory.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {matched.map((a) => <AgencyCard key={a._id} agency={adaptAgency(a)} />)}
              </div>
            )}

            {/* REVIEW SECTION */}
            {project.status === "Closed" && project.hiredAgency && (
              <div className="mt-12 border-t border-border pt-12">
                <ReviewSection
                  project={project}
                  onReviewSubmitted={() => {
                    setReviewSubmitted(true);
                    setShowReviewForm(false);
                  }}
                />
              </div>
            )}
          </div>

          {/* Brief sidebar */}
          {user?.role === "client" && (
            <aside>
              <ProjectBriefCard project={project} onSave={(updated) => setProject(updated)} />
            </aside>
          )}
        </div>
      </section>

      {/* Close Project Modal */}
      {/* Close Project Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-obsidian/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-xl">
            {closeSuccess ? (
              <div className="text-center py-6">
                <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-hyperblue-soft text-hyperblue mb-4">✓</div>
                <h3 className="text-lg font-bold">Thanks!</h3>
                <p className="text-xs text-steel-dark mt-2">Your project has been closed.</p>
              </div>
            ) : showReviewFormInModal ? (
              reviewSuccessInModal ? (
                <div className="text-center py-6">
                  <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-success/15 text-success mb-4 animate-in zoom-in-50 duration-300">✓</div>
                  <h3 className="text-lg font-bold">Review Submitted!</h3>
                  <p className="text-xs text-steel-dark mt-2">Thank you for rating the agency.</p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold tracking-tight">Rate your experience</h3>
                  <p className="mt-1.5 text-xs text-steel-dark">
                    How was it working with <span className="text-obsidian font-bold">{project.matchedAgencies.find(a => a._id === selectedAgencyId)?.name}</span>?
                  </p>

                  <div className="mt-5 space-y-5 animate-in fade-in duration-300">
                    {/* Stars */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-steel mb-2">Overall Rating</div>
                      <div className="flex items-center gap-1.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className="group relative focus:outline-none transition-transform active:scale-90"
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHover(star)}
                            onMouseLeave={() => setReviewHover(0)}
                          >
                            <svg
                              className={`size-8 transition-colors ${(reviewHover || reviewRating) >= star ? "text-warning fill-warning" : "text-border fill-transparent group-hover:text-warning/50"}`}
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth="1.5"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                            </svg>
                          </button>
                        ))}
                        <span className="ml-3 text-xs font-bold text-steel">
                          {reviewRating > 0 ? ["Poor", "Fair", "Good", "Great", "Exceptional"][reviewRating - 1] : ""}
                        </span>
                      </div>
                    </div>

                    {/* Textarea */}
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-steel mb-2">Your Review</div>
                      <textarea
                        value={reviewExcerpt}
                        onChange={(e) => setReviewExcerpt(e.target.value)}
                        rows={4}
                        placeholder="Tell us about the project outcome, communication, and overall quality of work..."
                        className="w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-xs font-bold outline-none focus:border-hyperblue transition-colors resize-none"
                      />
                      <div className="mt-1 flex items-center justify-between">
                        <span className="text-[9px] text-steel">Min 10 characters</span>
                        <span className={`text-[9px] font-bold uppercase tracking-widest ${reviewExcerpt.length < 10 ? "text-steel" : "text-success"}`}>
                          {reviewExcerpt.length} characters
                        </span>
                      </div>
                    </div>

                    {reviewError && (
                      <div className="rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs font-bold text-destructive">
                        {reviewError}
                      </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2 border-t border-border">
                      <button
                        onClick={() => {
                          setShowCloseModal(false);
                          setShowReviewFormInModal(false);
                        }}
                        className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-steel hover:text-obsidian"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleSubmitModalReview}
                        disabled={submittingReview}
                        className="rounded-xl bg-obsidian px-5 py-2.5 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue disabled:opacity-50 transition-colors"
                      >
                        {submittingReview ? "Submitting..." : "Submit Review"}
                      </button>
                    </div>
                  </div>
                </>
              )
            ) : (
              <>
                <h3 className="text-lg font-bold tracking-tight">Close Project</h3>
                <p className="mt-2 text-xs text-steel-dark">
                  Which agency did you choose to work with? This helps us improve our matching.
                </p>
                <div className="mt-4 max-h-[260px] overflow-y-auto pr-1 space-y-2.5 custom-scrollbar">
                  {project.matchedAgencies.map((a) => {
                    const isSelected = selectedAgencyId === a._id;
                    return (
                      <button
                        key={a._id}
                        onClick={() => setSelectedAgencyId(a._id)}
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${isSelected
                          ? "border-hyperblue bg-hyperblue/5 shadow-[0_2px_8px_rgba(0,56,255,0.06)]"
                          : "border-border bg-white hover:border-obsidian/30 hover:bg-surface-muted/30"
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="size-8 overflow-hidden rounded-lg border border-border bg-surface shrink-0">
                            <img
                              src={a.logoSeed?.startsWith("data:") || a.logoSeed?.startsWith("http") ? a.logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${a.logoSeed || a.slug || "global"}&backgroundColor=0038ff,050505,52525B`}
                              alt={a.name}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <span className="text-xs font-bold text-obsidian">{a.name}</span>
                        </div>
                        {isSelected && (
                          <span className="flex size-5 items-center justify-center rounded-full bg-hyperblue text-white animate-in zoom-in-50 duration-200">
                            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </span>
                        )}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setSelectedAgencyId("none")}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${selectedAgencyId === "none"
                      ? "border-hyperblue bg-hyperblue/5 shadow-[0_2px_8px_rgba(0,56,255,0.06)]"
                      : "border-border bg-white hover:border-obsidian/30 hover:bg-surface-muted/30"
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-surface border border-dashed border-border flex items-center justify-center shrink-0">
                        <svg className="size-4 text-steel-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </div>
                      <span className="text-xs font-bold text-steel-dark">I didn't choose any of these</span>
                    </div>
                    {selectedAgencyId === "none" && (
                      <span className="flex size-5 items-center justify-center rounded-full bg-hyperblue text-white animate-in zoom-in-50 duration-200">
                        <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </button>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => setShowCloseModal(false)}
                    className="px-4 py-2 text-xs font-bold uppercase tracking-widest text-steel-dark hover:text-obsidian"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCloseProject}
                    disabled={!selectedAgencyId || closing}
                    className="rounded-xl bg-obsidian px-4.5 py-2 text-[10px] font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue disabled:opacity-50"
                  >
                    {closing ? "Closing..." : "Close Project"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ScheduleMeetingModal
        isOpen={scheduleModal.isOpen}
        onClose={() => setScheduleModal((prev) => ({ ...prev, isOpen: false }))}
        agencySlug={scheduleModal.agencySlug}
        agencyName={scheduleModal.agencyName}
        onSuccess={() => {
          meetingsApi
            .list()
            .then((r) => setMeetings(r.meetings))
            .catch((e) => console.error("Error refreshing meetings:", e));
        }}
      />

      <SiteFooter />
    </div>
  );
}

/* ─── Project Brief Card ─────────────────────────────────── */
function ProjectBriefCard({ project, onSave }: { project: ApiProject; onSave: (p: ApiProject) => void }) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: project.title,
    description: project.description ?? "",
    services: [...project.services],
    budget: project.budget,
    country: project.country,
    industry: project.industry,
  });

  function resetForm() {
    setForm({ title: project.title, description: project.description ?? "", services: [...project.services], budget: project.budget, country: project.country, industry: project.industry });
    setError(null);
  }

  function toggleService(s: string) {
    setForm((f) => ({ ...f, services: f.services.includes(s) ? f.services.filter((x) => x !== s) : [...f.services, s] }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { project: updated } = await projectApi.update(project._id, {
        title: form.title,
        description: form.description || undefined,
        services: form.services,
        budget: form.budget as ApiProject["budget"],
        country: form.country,
        industry: form.industry,
      });
      onSave(updated);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="sticky top-20 rounded-2xl border border-border bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between bg-surface/50 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-xl bg-hyperblue/5 text-hyperblue border border-hyperblue/10">
            <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="text-sm sm:text-base font-bold tracking-tight text-obsidian">Project Brief</span>
        </div>
        {!editing ? (
          <button type="button" onClick={() => { resetForm(); setEditing(true); }} className="flex items-center gap-1.5 rounded-xl border border-border bg-white px-3 py-1.5 text-[9px] font-bold uppercase tracking-widest text-obsidian transition-all hover:bg-surface hover:border-obsidian active:scale-95">
            <svg className="size-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
            Edit
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => { resetForm(); setEditing(false); }} className="text-[9px] font-bold uppercase tracking-widest text-steel hover:text-obsidian transition-colors">Cancel</button>
            <button type="button" onClick={handleSave} disabled={saving} className="rounded-xl bg-obsidian px-4 py-1.5 text-[9px] font-bold uppercase tracking-widest text-white hover:bg-hyperblue disabled:opacity-50 transition-all">{saving ? "Saving…" : "Save"}</button>
          </div>
        )}
      </div>

      {error && <div className="mx-5 mt-4 rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-2.5 text-xs font-bold text-destructive">{error}</div>}

      <div className="p-5 space-y-8">
        {/* Context */}
        <section>
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-steel mb-2">Strategic Context</div>
          {editing ? (
            <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={4} maxLength={5000} placeholder="Describe your project, goals, and expectations…" className="w-full rounded-2xl border border-border bg-surface p-4 text-xs font-medium outline-none focus:border-hyperblue transition-colors resize-none" />
          ) : (
            <p className="text-xs leading-relaxed text-steel-dark font-medium">{project.description || <span className="italic opacity-50">No description provided.</span>}</p>
          )}
        </section>

        {/* Scope Grid */}
        <section className="space-y-5">
          <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-steel mb-3">Technical Scope</div>

          <div className="space-y-4">
            {/* Services */}
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian border border-obsidian/10">
                <LayoutGrid className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-steel mb-1">Services</div>
                {editing ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(SERVICE_CATEGORIES as string[]).map((s) => (
                      <button key={s} type="button" onClick={() => toggleService(s)} className={`rounded-lg px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest transition-all ${form.services.includes(s) ? "bg-hyperblue text-white shadow-md shadow-hyperblue/20" : "border border-border bg-white text-steel-dark hover:border-hyperblue"}`}>{s}</button>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {project.services.map((s) => <span key={s} className="rounded-lg border border-border bg-surface px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-obsidian">{s}</span>)}
                  </div>
                )}
              </div>
            </div>

            {/* Budget */}
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian border border-obsidian/10">
                <Wallet className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-steel mb-1">Investment</div>
                {editing ? (
                  <DropdownSelect
                    value={form.budget}
                    onChange={(val) => setForm((f) => ({ ...f, budget: val }))}
                    options={BUDGET_TIERS.map((b) => ({ value: b.id, label: b.label }))}
                    placeholder="Select Investment"
                  />
                ) : (
                  <div className="font-bold text-obsidian text-xs tracking-tight">{BUDGET_TIERS.find((b) => b.id === project.budget)?.label ?? project.budget}</div>
                )}
              </div>
            </div>

            {/* Market */}
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian border border-obsidian/10">
                <MapPin className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-steel mb-1">Target Market</div>
                {editing ? (
                  <CountrySelect
                    value={form.country}
                    onChange={(val) => setForm((f) => ({ ...f, country: val }))}
                    excludeAllCountries
                  />
                ) : (
                  <div className="font-bold text-obsidian text-xs tracking-tight">{project.country}</div>
                )}
              </div>
            </div>

            {/* Industry */}
            <div className="flex gap-3">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-obsidian/5 text-obsidian border border-obsidian/10">
                <Building2 className="size-4" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-steel mb-1">Industry Segment</div>
                {editing ? (
                  <DropdownSelect
                    value={form.industry}
                    onChange={(val) => setForm((f) => ({ ...f, industry: val }))}
                    options={INDUSTRIES as unknown as string[]}
                    placeholder="Select Industry"
                  />
                ) : (
                  <div className="font-bold text-obsidian text-xs tracking-tight">{project.industry}</div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Project title (edit only) */}
        {editing && (
          <section className="pt-6 border-t border-border">
            <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-steel mb-2">Project Title</div>
            <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} maxLength={200} className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-xs font-bold outline-none focus:border-hyperblue" />
          </section>
        )}
      </div>
    </div>
  );
}



function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Matching: "bg-hyperblue/5 text-hyperblue border-hyperblue/10",
    "In Review": "bg-warning/10 text-warning border-warning/20",
    Active: "bg-success/10 text-success border-success/20",
    Closed: "bg-surface text-steel border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[9px] font-bold uppercase tracking-widest ${styles[status] ?? ""}`}>
      {status === "Matching" && <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />}
      {status}
    </span>
  );
}

/* ─── Review Section ─────────────────────────────────────── */
function ReviewSection({ project, onReviewSubmitted }: { project: ApiProject; onReviewSubmitted: () => void }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [excerpt, setExcerpt] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const hiredAgency = typeof project.hiredAgency === "string"
    ? project.matchedAgencies.find(a => a._id === project.hiredAgency)
    : project.hiredAgency;

  if (!hiredAgency) return null;

  async function handleSubmit() {
    if (rating === 0) {
      setError("Please select a rating.");
      return;
    }
    if (excerpt.length < 10) {
      setError("Review must be at least 10 characters.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const targetAgencyId = typeof hiredAgency === 'string' ? hiredAgency : hiredAgency?._id;
      if (!targetAgencyId) throw new Error("Hired agency details could not be resolved.");
      await agencyApi.submitReview(targetAgencyId, {
        rating,
        excerpt,
        projectId: project._id
      });
      setSuccess(true);
      onReviewSubmitted();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit review.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-sm border border-success/30 bg-success/5 p-8 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-success/10 text-success mb-4">✓</div>
        <h3 className="text-xl font-extrabold">Review Submitted!</h3>
        <p className="text-sm text-steel-dark mt-2">Thank you for your feedback. It helps the community and the agency.</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <h2 className="text-2xl font-extrabold tracking-tight">Rate your experience</h2>
      <p className="mt-2 text-steel-dark">How was it working with <span className="text-obsidian font-bold">{hiredAgency.name}</span>?</p>

      <div className="mt-8 space-y-8">
        {/* Stars */}
        <div>
          <div className="eyebrow text-steel-dark mb-4">Overall Rating</div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                className="group relative focus:outline-none"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
              >
                <svg
                  className={`size-10 transition-colors ${(hover || rating) >= star ? "text-warning fill-warning" : "text-border fill-transparent group-hover:text-warning/50"}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
                </svg>
              </button>
            ))}
            <span className="ml-4 text-sm font-bold text-steel-dark">
              {rating > 0 ? ["Poor", "Fair", "Good", "Great", "Exceptional"][rating - 1] : ""}
            </span>
          </div>
        </div>

        {/* Text */}
        <div>
          <div className="eyebrow text-steel-dark mb-4">Your Review</div>
          <textarea
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            rows={5}
            placeholder="Tell us about the project outcome, communication, and overall quality of work..."
            className="input-base w-full resize-none text-sm leading-relaxed"
          />
          <div className="mt-2 text-right">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${excerpt.length < 10 ? "text-steel-dark" : "text-success"}`}>
              {excerpt.length} characters
            </span>
          </div>
        </div>

        {error && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-4 py-3 text-xs font-bold text-destructive">
            {error}
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="rounded-sm bg-obsidian px-8 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground hover:bg-hyperblue disabled:opacity-50 transition-colors"
        >
          {submitting ? "Submitting..." : "Submit Review"}
        </button>
      </div>
    </div>
  );
}
