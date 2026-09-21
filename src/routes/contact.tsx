import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { contactApi } from "@/lib/api";
import { toast } from "sonner";
import { Mail, MapPin, Phone, Send, Clock, Globe, ArrowRight, CheckCircle2, Star } from "lucide-react";

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "Contact Us — Finding Global" },
      { name: "description", content: "Get in touch with the Finding Global team. Find our headquarters, contact information, and send us a message." },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/contact/" },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      await contactApi.submit({ name, email, subject, message });
      setSuccess(true);
      toast.success("Message sent successfully!");
      // Reset form
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error(err instanceof Error ? err.message : "Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background selection:bg-hyperblue/20">
      <SiteHeader />

      {/* Hero Section */}
      <section className="bg-background border-b border-border px-6 py-20 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-hyperblue/5 rounded-full blur-[120px] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full bg-hyperblue/5 px-3 py-1 text-hyperblue mb-6">
            <span className="size-1.5 rounded-full bg-hyperblue animate-pulse" />
            <span className="text-[9px] font-bold uppercase tracking-widest">Connect With Us</span>
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-obsidian sm:text-6xl max-w-3xl mx-auto leading-[1.1]">
            We'd love to hear <span className="text-transparent bg-clip-text bg-gradient-to-r from-obsidian via-hyperblue to-obsidian">from you</span>
          </h1>
          <p className="mt-4 text-base md:text-lg font-medium text-steel-dark max-w-2xl mx-auto">
            Have questions about finding an agency, matching briefs, or premium pricing? Our Dubai-based team is here to help.
          </p>
        </div>
      </section>

      {/* Main Grid Section */}
      <section className="px-6 py-16 relative">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-stretch">
            
            {/* Left Side: Contact Information & Map */}
            <div className="lg:col-span-5 flex flex-col gap-6 h-full">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-obsidian mb-2">Our Office</h2>
                <p className="text-sm font-medium text-steel-dark leading-relaxed">
                  Drop by our headquarters or get in touch through our direct channels.
                </p>
              </div>

              {/* Location Card Info */}
              <div className="rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-obsidian/10 transition-all duration-300">
                <div className="flex gap-4">
                  <div className="size-10 rounded-xl bg-obsidian/5 flex items-center justify-center border border-obsidian/10 text-obsidian shrink-0">
                    <MapPin className="size-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-obsidian uppercase tracking-wider mb-2">Finding Global HQ</h3>
                    <p className="text-[13px] font-bold text-obsidian mb-1">The One Tower</p>
                    <p className="text-xs text-steel-dark leading-relaxed">
                      The One Tower - Sheikh Zayed Rd - Al Thanyah First - Barsha Heights - Dubai - United Arab Emirates
                    </p>
                    {/* Rating display resembling search results */}
                    <div className="mt-3 flex items-center gap-1 text-[11px] font-medium text-steel">
                      <span className="text-amber-500 font-bold">4.4</span>
                      <div className="flex text-amber-500">
                        <Star className="size-3 fill-amber-500" />
                        <Star className="size-3 fill-amber-500" />
                        <Star className="size-3 fill-amber-500" />
                        <Star className="size-3 fill-amber-500" />
                        <Star className="size-3 fill-amber-500/30" />
                      </div>
                      <span>(831 reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-border pt-4 grid grid-cols-1 gap-3.5 text-xs text-steel-dark">
                  <div className="flex items-center gap-3">
                    <Clock className="size-4 text-steel" />
                    <span>Mon - Fri, 9:00 AM - 6:00 PM (GST)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="size-4 text-steel" />
                    <span>+971 4 582 9100</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Mail className="size-4 text-steel" />
                    <span>support@findingglobal.com</span>
                  </div>
                </div>
              </div>

              {/* Custom Colored Map Iframe */}
              <div className="rounded-2xl border border-border/80 overflow-hidden shadow-md group relative flex-1 flex min-h-[260px]">
                <iframe
                  title="Finding Global Office Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3612.9806450630737!2d55.170669299999995!3d25.102521199999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3e5f6b6ebdfef2cb%3A0xa1969f69745e12f6!2sThe%20One%20Tower!5e0!3m2!1sen!2sae!4v1716100000000!5m2!1sen!2sae"
                  width="100%"
                  height="100%"
                  style={{ border: 0, minHeight: "260px" }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full contrast-105 transition-all duration-500 ease-out"
                />
                <div className="absolute bottom-3 right-3 bg-obsidian/80 backdrop-blur-md px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white border border-white/10 pointer-events-none">
                  Open Map view
                </div>
              </div>
            </div>

            {/* Right Side: Form Submission Card */}
            <div className="lg:col-span-7 h-full">
              <div className="bg-card border border-border shadow-sm rounded-2xl p-8 relative overflow-hidden h-full flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 bg-hyperblue/[0.02] rounded-full blur-xl pointer-events-none" />

                {success ? (
                  <div className="py-12 text-center max-w-md mx-auto">
                    <div className="mx-auto mb-6 flex size-16 items-center justify-center rounded-2xl bg-success/5 text-success border border-success/10">
                      <CheckCircle2 className="size-8" />
                    </div>
                    <h3 className="text-2xl font-bold tracking-tight text-obsidian">Message Sent Successfully!</h3>
                    <p className="mt-3 text-sm text-steel-dark leading-relaxed">
                      Thank you for reaching out. We have saved your request in our database. One of our regional coordinators will respond to you within 24 hours.
                    </p>
                    <button
                      onClick={() => setSuccess(false)}
                      className="mt-8 rounded-xl border border-border bg-background hover:bg-surface px-6 py-3 text-xs font-bold uppercase tracking-widest text-obsidian transition-all duration-200"
                    >
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <h3 className="text-xl font-bold tracking-tight text-obsidian mb-1">Send a Message</h3>
                      <p className="text-xs font-medium text-steel-dark">
                        We usually respond to all inquiries within 2 to 4 business hours.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-2">
                        <label htmlFor="name" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                          Full Name <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="your name"
                          required
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                          Email Address <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="your mail"
                          required
                          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="subject" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                        Subject
                      </label>
                      <input
                        type="text"
                        id="subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Agency Collaboration, Pricing, or Feature Request"
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="message" className="text-xs font-bold uppercase tracking-wider text-obsidian">
                        Your Message <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="message"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Describe your inquiry in detail here..."
                        rows={6}
                        required
                        className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm text-obsidian placeholder:text-steel-light hover:border-steel focus:border-hyperblue focus:outline-none transition-all duration-200 resize-none"
                      />
                    </div>

                    <div>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-obsidian hover:bg-hyperblue px-6 py-4 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-obsidian/10 hover:shadow-hyperblue/20 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 transition-all duration-200"
                      >
                        {submitting ? "Sending..." : "Submit Message"}
                        <Send className="size-4" />
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
