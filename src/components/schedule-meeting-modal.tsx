import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { meetingsApi } from "@/lib/api";
import { Link } from "@tanstack/react-router";
import { Calendar, Clock, Video, FileText, CheckCircle2, X, ChevronDown, Check } from "lucide-react";
import { toast } from "sonner";


interface ScheduleMeetingModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencySlug: string;
  agencyName: string;
  leadId?: string;
  onSuccess?: () => void;
}

const COMMON_TOPICS = [
  "Discovery Call",
  "Project Proposal & Pricing",
  "Marketing & Strategy Audit",
  "Design & Creative Consultation",
  "Technical & Development Briefing",
  "Other"
];

const TZ_IANA_MAP: Record<string, string> = {
  "GST (Dubai Time, UTC+4)": "Asia/Dubai",
  "IST (India Time, UTC+5:30)": "Asia/Kolkata",
  "AST (Riyadh Time, UTC+3)": "Asia/Riyadh",
  "GMT (London Time, UTC+0)": "Europe/London",
  "EST (New York Time, UTC-5)": "America/New_York",
  "PST (Pacific Time, UTC-8)": "America/Los_Angeles"
};

export function ScheduleMeetingModal({ isOpen, onClose, agencySlug, agencyName, leadId, onSuccess }: ScheduleMeetingModalProps) {
  const { user } = useAuth();
  const [topic, setTopic] = useState(COMMON_TOPICS[0]);
  const [customTopic, setCustomTopic] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [timezone, setTimezone] = useState("GST (Dubai Time, UTC+4)");
  const [detectedTz, setDetectedTz] = useState("");
  const [detectedIanaTz, setDetectedIanaTz] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [bookedMeeting, setBookedMeeting] = useState<any>(null);
  const [meetingLink, setMeetingLink] = useState("");

  // Dropdown open states
  const [isTopicOpen, setIsTopicOpen] = useState(false);
  const [isTimezoneOpen, setIsTimezoneOpen] = useState(false);

  // Helper to update date/time for a specific timezone
  const updateDateTimeForTimezone = (tzLabel: string, baseIanaTz?: string) => {
    const ianaTz = TZ_IANA_MAP[tzLabel] || baseIanaTz || detectedIanaTz || Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      const now = new Date();
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: ianaTz,
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: false
      });
      const parts = formatter.formatToParts(now);

      const year = parts.find((p) => p.type === "year")?.value || "";
      const month = (parts.find((p) => p.type === "month")?.value || "").padStart(2, "0");
      const day = (parts.find((p) => p.type === "day")?.value || "").padStart(2, "0");
      let hour = parts.find((p) => p.type === "hour")?.value || "";
      const minute = (parts.find((p) => p.type === "minute")?.value || "").padStart(2, "0");

      if (hour === "24") hour = "00";
      hour = hour.padStart(2, "0");

      setDate(`${year}-${month}-${day}`);
      setTime(`${hour}:${minute}`);
    } catch (e) {
      console.error("Failed to fetch date/time for timezone:", ianaTz, e);
    }
  };

  // Prevent body scroll when modal is open, detect timezone, set current date/time, and reset form states
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";

      updateDateTimeForTimezone(timezone);

      // Reset form states so booking a new meeting starts fresh
      setSuccess(false);
      setBookedMeeting(null);
      setNotes("");
      setMeetingLink("");
      setTopic(COMMON_TOPICS[0]);
      setCustomTopic("");
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      setDetectedIanaTz(tz);
      const offsetMinutes = new Date().getTimezoneOffset();
      const offsetHours = -offsetMinutes / 60;
      const sign = offsetHours >= 0 ? "+" : "-";
      const hours = Math.floor(Math.abs(offsetHours));
      const mins = Math.abs(offsetMinutes) % 60;
      const formattedMins = mins > 0 ? `:${mins.toString().padStart(2, "0")}` : "";
      
      // If client timezone is Dubai or India, name them explicitly
      let label = `UTC${sign}${hours}${formattedMins}`;
      if (tz.includes("Dubai")) label = "GST (Dubai Time, UTC+4)";
      else if (tz.includes("Calcutta") || tz.includes("Kolkata")) label = "IST (India Time, UTC+5:30)";
      else label = `${tz.split("/").pop()?.replace("_", " ") || tz} (UTC${sign}${hours}${formattedMins})`;

      setDetectedTz(label);
      setTimezone(label);
    } catch (e) {
      setTimezone("GST (Dubai Time, UTC+4)");
    }
  }, []);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please log in to schedule a meeting.");
      return;
    }

    if (!date || !time) {
      toast.error("Please select both a date and a time.");
      return;
    }

    if (!meetingLink.trim()) {
      toast.error("Please paste a meeting link.");
      return;
    }

    const selectedTopic = topic === "Other" ? customTopic : topic;
    if (!selectedTopic.trim()) {
      toast.error("Please specify a topic for the meeting.");
      return;
    }

    setLoading(true);
    try {
      const res = await meetingsApi.book({
        agencySlug,
        date,
        time,
        timezone,
        topic: selectedTopic,
        notes: notes || undefined,
        meetingLink: meetingLink.trim() || undefined,
        leadId: leadId || undefined
      });
      setBookedMeeting(res.meeting);
      setSuccess(true);
      onSuccess?.();
      toast.success("Call scheduled successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to schedule meeting.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-obsidian/40 backdrop-blur-md transition-all duration-500"
        onClick={onClose}
      />

      {/* Content Container */}
      <div className="relative flex flex-col w-full max-w-lg overflow-hidden bg-white rounded-3xl shadow-2xl animate-in fade-in zoom-in-95 duration-300">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-20 size-8 flex items-center justify-center rounded-full bg-neutral-100 text-obsidian hover:bg-obsidian hover:text-white transition-all active:scale-95"
        >
          <X className="size-4" />
        </button>

        {/* Success View */}
        {success ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="size-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500 mb-6 animate-bounce">
              <CheckCircle2 className="size-10" />
            </div>
            <h3 className="text-2xl font-black text-obsidian tracking-tight mb-2">Call Scheduled!</h3>
            <p className="text-sm font-medium text-steel-dark mb-6 leading-relaxed max-w-sm">
              Your call with <span className="font-extrabold text-obsidian">{agencyName}</span> has been successfully scheduled.
            </p>

            {bookedMeeting && (
              <div className="w-full bg-neutral-50 rounded-2xl p-5 text-left border border-border/60 mb-6 space-y-3">
                <div className="flex items-center gap-3 text-xs font-bold text-steel-dark">
                  <Calendar className="size-4 text-hyperblue" />
                  <span>{bookedMeeting.date}</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-steel-dark">
                  <Clock className="size-4 text-hyperblue" />
                  <span>{bookedMeeting.time} ({bookedMeeting.timezone || 'GST (UTC+4)'}) · 30 mins</span>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-steel-dark">
                  <Video className="size-4 text-hyperblue" />
                  {bookedMeeting.meetingLink ? (
                    <a
                      href={bookedMeeting.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate max-w-xs text-hyperblue hover:underline"
                    >
                      {bookedMeeting.meetingLink}
                    </a>
                  ) : (
                    <span className="text-steel italic">No meeting link provided</span>
                  )}
                </div>
                <div className="flex items-start gap-3 text-xs font-bold text-steel-dark border-t border-border/40 pt-3 mt-2">
                  <FileText className="size-4 text-hyperblue mt-0.5" />
                  <div>
                    <span className="block text-[10px] uppercase tracking-wider opacity-60">Topic</span>
                    <span className="text-obsidian text-sm font-black">{bookedMeeting.topic}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3 w-full">
              <Link
                to="/dashboard"
                onClick={onClose}
                className="flex-1 rounded-xl bg-obsidian text-white py-3.5 text-center text-xs font-bold uppercase tracking-widest hover:bg-hyperblue transition-all"
              >
                Go to Dashboard
              </Link>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-border bg-white text-obsidian py-3.5 text-center text-xs font-bold uppercase tracking-widest hover:bg-neutral-50 transition-all"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="p-8">
            <h3 className="text-2xl font-black text-obsidian tracking-tight mb-1">Schedule a Meeting</h3>
            <p className="text-xs font-bold text-steel-dark mb-6">
              Book a direct video consultation with <span className="text-hyperblue">{agencyName}</span> on Finding Global.
            </p>

            {!user ? (
              <div className="py-8 text-center bg-neutral-50 rounded-2xl border border-dashed border-border flex flex-col items-center p-6">
                <p className="text-sm font-bold text-steel-dark mb-4">
                  You must be signed in as a client to schedule a meeting directly.
                </p>
                <Link
                  to="/login"
                  onClick={onClose}
                  className="rounded-xl bg-hyperblue px-8 py-3 text-xs font-bold uppercase tracking-widest text-white hover:bg-obsidian transition-all shadow-md"
                >
                  Sign In
                </Link>
              </div>
            ) : user.role === "agency" ? (
              <div className="py-8 text-center bg-amber-50/50 rounded-2xl border border-dashed border-amber-200 p-6">
                <p className="text-sm font-bold text-amber-800">
                  Agencies cannot schedule meetings with other agencies.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Topic Selector */}
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                    Meeting Topic
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTopicOpen(!isTopicOpen);
                      setIsTimezoneOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200 hover:border-steel cursor-pointer text-left shadow-xs"
                  >
                    <span>{topic}</span>
                    <ChevronDown className={`size-4 text-steel transition-transform duration-200 ${isTopicOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isTopicOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsTopicOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-xl border border-border bg-white py-1.5 shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                        {COMMON_TOPICS.map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => {
                              setTopic(t);
                              setIsTopicOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              topic === t
                                ? "bg-hyperblue/5 text-hyperblue font-black"
                                : "text-obsidian hover:bg-neutral-50"
                            }`}
                          >
                            <span>{t}</span>
                            {topic === t && <Check className="size-4 text-hyperblue animate-in zoom-in-50 duration-200" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Custom Topic Input */}
                {topic === "Other" && (
                  <div className="animate-in slide-in-from-top-2 duration-200">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                      Specify Topic
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Discuss campaign brief"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200"
                    />
                  </div>
                )}

                {/* Timezone Selector */}
                <div className="relative">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                    Select Timezone
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsTimezoneOpen(!isTimezoneOpen);
                      setIsTopicOpen(false);
                    }}
                    className="w-full flex items-center justify-between rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200 hover:border-steel cursor-pointer text-left shadow-xs"
                  >
                    <span className="truncate pr-2">{timezone}</span>
                    <ChevronDown className={`size-4 text-steel transition-transform duration-200 ${isTimezoneOpen ? "rotate-180" : ""}`} />
                  </button>

                  {isTimezoneOpen && (
                    <>
                      <div className="fixed inset-0 z-30" onClick={() => setIsTimezoneOpen(false)} />
                      <div className="absolute left-0 right-0 mt-1.5 z-40 rounded-xl border border-border bg-white py-1.5 shadow-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-200">
                        {detectedTz && ![
                          "GST (Dubai Time, UTC+4)",
                          "IST (India Time, UTC+5:30)",
                          "AST (Riyadh Time, UTC+3)",
                          "GMT (London Time, UTC+0)",
                          "EST (New York Time, UTC-5)",
                          "PST (Pacific Time, UTC-8)"
                        ].includes(detectedTz) && (
                          <button
                            type="button"
                            onClick={() => {
                              setTimezone(detectedTz);
                              updateDateTimeForTimezone(detectedTz, detectedIanaTz);
                              setIsTimezoneOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              timezone === detectedTz
                                ? "bg-hyperblue/5 text-hyperblue font-black"
                                : "text-obsidian hover:bg-neutral-50"
                            }`}
                          >
                            <span>{detectedTz}</span>
                            {timezone === detectedTz && <Check className="size-4 text-hyperblue animate-in zoom-in-50 duration-200" />}
                          </button>
                        )}
                        {[
                          "GST (Dubai Time, UTC+4)",
                          "IST (India Time, UTC+5:30)",
                          "AST (Riyadh Time, UTC+3)",
                          "GMT (London Time, UTC+0)",
                          "EST (New York Time, UTC-5)",
                          "PST (Pacific Time, UTC-8)"
                        ].map((tzOpt) => (
                          <button
                            key={tzOpt}
                            type="button"
                            onClick={() => {
                              setTimezone(tzOpt);
                              updateDateTimeForTimezone(tzOpt);
                              setIsTimezoneOpen(false);
                            }}
                            className={`w-full px-4 py-2.5 text-left text-sm font-semibold transition-colors flex items-center justify-between ${
                              timezone === tzOpt
                                ? "bg-hyperblue/5 text-hyperblue font-black"
                                : "text-obsidian hover:bg-neutral-50"
                            }`}
                          >
                            <span>{tzOpt}</span>
                            {timezone === tzOpt && <Check className="size-4 text-hyperblue animate-in zoom-in-50 duration-200" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Date and Time Group */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                      Select Date
                    </label>
                    <input
                      type="date"
                      required
                      min={new Date().toISOString().split("T")[0]}
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200 hover:border-steel cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                      Select Time
                    </label>
                    <input
                      type="time"
                      required
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-bold text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200 hover:border-steel cursor-pointer"
                    />
                  </div>
                </div>

                {/* Meeting Link */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                    Meeting Link <span className="text-destructive">*</span>
                  </label>
                  <div className="relative">
                    <Video className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-steel pointer-events-none" />
                    <input
                      type="url"
                      required
                      placeholder="Paste Google Meet, Zoom, or Teams link..."
                      value={meetingLink}
                      onChange={(e) => setMeetingLink(e.target.value)}
                      className="w-full rounded-xl border border-border bg-white pl-10 pr-4 py-3 text-sm font-medium text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none transition-all duration-200 hover:border-steel placeholder:text-steel/50"
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-steel-dark">
                    Share a Google Meet, Zoom, or any video call link with the agency. Required to confirm the meeting.
                  </p>
                </div>

                {/* Notes/Brief */}
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-steel mb-1.5">
                    Consultation Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Briefly describe what you'd like to discuss during this session..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full rounded-xl border border-border bg-white px-4 py-3 text-sm font-medium text-obsidian focus:border-hyperblue focus:ring-2 focus:ring-hyperblue/10 focus:outline-none resize-none transition-all duration-200 hover:border-steel"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-hyperblue hover:bg-obsidian text-white py-3.5 text-center text-xs font-bold uppercase tracking-widest transition-all duration-300 shadow-lg shadow-hyperblue/20 active:scale-98 disabled:opacity-50 disabled:pointer-events-none mt-2"
                >
                  {loading ? "Scheduling..." : "Schedule Meeting"}
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
