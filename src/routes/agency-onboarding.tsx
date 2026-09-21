import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import Cropper from "react-easy-crop";
import { toast } from "sonner";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { agencyApi, type ApiAgency, getProxyUrl } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { SERVICE_CATEGORIES } from "@/lib/mock-data";
import { CountrySelect } from "@/components/country-select";
import { DropdownSelect } from "@/components/dropdown-select";

// Shadcn UI components
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

// Lucide Icons
import {
  ArrowLeft,
  ArrowRight,
  Camera,
  Image as ImageIcon,
  Sparkles,
  Link as LinkIcon,
  FileText,
  MapPin,
  Globe,
  Calendar,
  Users,
  DollarSign,
  Briefcase,
  Trash2,
  Award,
  Plus,
  Check,
  Megaphone,
  Smartphone,
  Palette,
  LineChart,
  Search,
  Layers,
  Laptop,
  TrendingUp
} from "lucide-react";

export const Route = createFileRoute("/agency-onboarding")({
  validateSearch: (search: Record<string, unknown>): { step?: number } => ({
    step: Number(search.step) || 1,
  }),
  head: () => ({
    meta: [
      { title: "Complete your profile — Finding Global" },
      { name: "description", content: "Tell us more about your agency to start receiving leads." },
    ],
    links: [
      { rel: "canonical", href: "https://findingglobal.com/agency-onboarding/" },
    ],
  }),
  component: AgencyOnboarding,
});

const SERVICE_DETAILS: Record<string, { icon: React.ReactNode; desc: string }> = {
  "Marketing": {
    icon: <Megaphone className="size-5" />,
    desc: "Campaign orchestration, advertising, & brand promotions."
  },
  "Branding": {
    icon: <Sparkles className="size-5" />,
    desc: "Identity creation, logos, typography, & style guidelines."
  },
  "Web Development": {
    icon: <Laptop className="size-5" />,
    desc: "Bespoke websites, web applications, e-commerce, & portals."
  },
  "Mobile Development": {
    icon: <Smartphone className="size-5" />,
    desc: "Native iOS & Android apps, hybrid systems, & mobile UX."
  },
  "Creative & Design": {
    icon: <Palette className="size-5" />,
    desc: "UI/UX design, illustration, motion graphics, & spatial design."
  },
  "Strategy & Consulting": {
    icon: <LineChart className="size-5" />,
    desc: "Market entry research, digital change, & corporate strategy."
  },
  "SEO & Content": {
    icon: <Search className="size-5" />,
    desc: "Organic content engines, search optimization, & copy production."
  },
  "Performance & Paid Media": {
    icon: <TrendingUp className="size-5" />,
    desc: "Paid search, programmatic ads, social marketing, & ROI growth."
  },
  "Other": {
    icon: <Layers className="size-5" />,
    desc: "Specialized offerings, localization, video, or public relations."
  }
};

function AgencyOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { step: initialStep = 1 } = Route.useSearch();
  const [step, setStep] = useState(initialStep);
  const [submitting, setSubmitting] = useState(false);
  const [agency, setAgency] = useState<ApiAgency | null>(null);

  // Scroll to top on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  // Preview tab state
  const [previewTab, setPreviewTab] = useState<"card" | "profile">("card");

  // Form states
  const [founded, setFounded] = useState("");
  const [teamSize, setTeamSize] = useState("1-10");
  const [minBudget, setMinBudget] = useState("5000");
  const [calendlyLink, setCalendlyLink] = useState("");
  const [services, setServices] = useState<string[]>([]);
  const [otherServices, setOtherServices] = useState<string[]>([""]);
  
  // Clients & Awards
  const [clients, setClients] = useState<{ name: string; industry: string }[]>([{ name: "", industry: "" }]);
  const [awards, setAwards] = useState<{ title: string; organization: string; year: string }[]>([{ title: "", organization: "", year: "" }]);

  const [portfolio, setPortfolio] = useState<{ title: string; category: string; summary: string; imageSeed: string }[]>([{ title: "", category: "", summary: "", imageSeed: "" }]);
  const [logoSeed, setLogoSeed] = useState("");
  const [coverSeed, setCoverSeed] = useState("");
  const [teamImage, setTeamImage] = useState("");
  const [teamStory, setTeamStory] = useState("");
  const [description, setDescription] = useState("");
  const [website, setWebsite] = useState("");
  const [city, setCity] = useState("");
  const [countryCode, setCountryCode] = useState("");

  // Cropper State
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [cropType, setCropType] = useState<'cover' | 'logo' | null>(null);

  const getCroppedImg = async (imageSrc: string, pixelCrop: any): Promise<string | null> => {
    try {
      const image = new Image();
      image.crossOrigin = "anonymous";
      image.src = imageSrc;
      
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = () => {
          image.removeAttribute("crossOrigin");
          image.src = imageSrc;
          image.onload = resolve;
          image.onerror = reject;
        };
      });
      
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      
      return canvas.toDataURL("image/jpeg", 0.9);
    } catch (e) {
      console.error("Canvas crop error:", e);
      throw e;
    }
  };

  const handleCropComplete = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !cropType) return;
    try {
      const croppedImage = await getCroppedImg(cropImageSrc, croppedAreaPixels);
      if (croppedImage) {
        if (cropType === "cover") setCoverSeed(croppedImage);
        else if (cropType === "logo") setLogoSeed(croppedImage);
      }
      setCropModalOpen(false);
      setCropImageSrc(null);
    } catch (e) {
      toast.error("This remote image is protected by its host server. Please download the image and use 'Upload from Gallery' instead.");
      setCropModalOpen(false);
      setCropImageSrc(null);
    }
  };

  useEffect(() => {
    if (!authLoading && (!user || user.role !== "agency")) {
      navigate({ to: "/login" });
      return;
    }
    if (user?.agencySlug) {
      agencyApi.get(user.agencySlug).then(r => {
        setAgency(r.agency);
        if (r.agency.founded) setFounded(String(r.agency.founded));
        if (r.agency.teamSize) setTeamSize(r.agency.teamSize);
        if (r.agency.minBudget) setMinBudget(String(r.agency.minBudget));
        if (r.agency.calendlyLink) setCalendlyLink(r.agency.calendlyLink);
        if (r.agency.services) {
          const official = r.agency.services.filter(s => SERVICE_CATEGORIES.includes(s as any));
          const custom = r.agency.services.filter(s => !SERVICE_CATEGORIES.includes(s as any));
          if (custom.length > 0) {
            setServices([...official, "Other"]);
            setOtherServices(custom);
          } else {
            setServices(official);
          }
        }
        if (r.agency.logoSeed) setLogoSeed(r.agency.logoSeed);
        if (r.agency.coverSeed) setCoverSeed(r.agency.coverSeed);
        if (r.agency.teamImage) setTeamImage(r.agency.teamImage);
        if (r.agency.teamStory) setTeamStory(r.agency.teamStory);
        if (r.agency.description) setDescription(r.agency.description);
        if (r.agency.website) setWebsite(r.agency.website);
        if (r.agency.city) setCity(r.agency.city);
        if (r.agency.countryCode) setCountryCode(r.agency.countryCode);
        if (r.agency.clients?.length) setClients(r.agency.clients as any);
        if (r.agency.awards?.length) setAwards(r.agency.awards as any);
        if (r.agency.portfolio?.length) setPortfolio(r.agency.portfolio as any);
      });
    }
  }, [user, authLoading]);

  async function save() {
    if (!user?.agencySlug) return;
    
    if (step === 1) {
      if (!website.trim()) {
        toast.error("Website is mandatory.");
        return;
      }
    }

    if (step === 3) {
      const validServices = Array.from(new Set(
        services.flatMap(s => s === "Other" ? otherServices : [s])
          .filter(s => s && s !== "Other" && s.trim() !== "")
      ));
      if (validServices.length === 0) {
        toast.error("Please select at least one core service.");
        return;
      }
    }

    setSubmitting(true);
    try {
      await agencyApi.update(user.agencySlug, {
        founded: parseInt(founded) || undefined,
        teamSize,
        minBudget: parseInt(minBudget) || 0,
        calendlyLink,
        services: Array.from(new Set(
          services.flatMap(s => s === "Other" ? otherServices : [s])
            .filter(s => s && s !== "Other" && s.trim() !== "")
        )),
        logoSeed,
        coverSeed,
        teamImage,
        teamStory,
        description,
        website,
        city,
        countryCode,
        country: countryCode,
        clients: clients.filter(c => c.name),
        awards: awards.filter(a => a.title),
        portfolio: portfolio.filter(p => p.title),
      });
      if (step < 4) setStep(step + 1);
      else {
        toast.success("Profile updated successfully!");
        navigate({ to: "/agency-dashboard" });
      }
    } catch (e) {
      toast.error("Failed to save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const triggerManualCrop = (type: 'logo' | 'cover') => {
    const src = type === 'logo' ? logoSeed : coverSeed;
    if (!src) return;
    const resolvedUrl = src.startsWith("http") || src.startsWith("data:") 
      ? src 
      : `https://picsum.photos/seed/${src}/${type === 'cover' ? '1650/500' : '400/400'}`;
    
    setCropImageSrc(getProxyUrl(resolvedUrl));
    setCropType(type);
    setCrop(({ x: 0, y: 0 }));
    setZoom(1);
    setCropModalOpen(true);
  };

  const handleFileUpload = (type: 'logo' | 'cover') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("File is too large. Max size is 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setCropImageSrc(reader.result as string);
      setCropType(type);
      setCrop(({ x: 0, y: 0 }));
      setZoom(1);
      setCropModalOpen(true);
      e.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const inputClasses = "h-10 px-3 bg-white border border-black/[0.08] rounded-[12px] focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/5 placeholder-[#9CA3AF] text-xs font-medium transition-all duration-200";
  const textareaClasses = "p-3 bg-white border border-black/[0.08] rounded-[12px] focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/5 placeholder-[#9CA3AF] text-xs font-medium leading-relaxed resize-none transition-all duration-200";
  const selectTriggerClasses = "h-10 bg-white border border-black/[0.08] rounded-[12px] hover:border-slate-800/20 focus:border-slate-800 focus:ring-2 focus:ring-slate-800/5 text-xs font-medium transition-all duration-200";

  return (
    <div className="relative flex min-h-screen flex-col bg-background/50 overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Muted neutral gray glows instead of bright blue radial glows */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-slate-100 rounded-full blur-[120px] pointer-events-none -z-10 animate-fade-in" />
      <div className="absolute top-[20%] right-0 w-[400px] h-[400px] bg-slate-100 rounded-full blur-[100px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: '200ms' }} />
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-slate-100 rounded-full blur-[120px] pointer-events-none -z-10 animate-fade-in" style={{ animationDelay: '400ms' }} />

      <SiteHeader />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-8 md:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8 items-start">
          
          {/* Form Side */}
          <div className="space-y-6">
            
            {/* Stepper Progress Card */}
            <div 
              className="space-y-5 bg-white p-5 md:p-6 rounded-[20px] border border-black/[0.04] shadow-[0_10px_30px_rgba(0,0,0,0.02)] animate-fade-in"
              style={{ animation: 'fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 0ms forwards', opacity: 0 }}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-800"></span>
                    </span>
                    <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-500">
                      Step {step} of 4
                    </span>
                  </div>
                  <h2 className="relative text-xl md:text-2xl font-bold tracking-[-0.02em] text-obsidian mt-0.5 leading-[1.2] inline-block">
                    {step === 1 && "Agency Essentials"}
                    {step === 2 && "Recognition & Trust"}
                    {step === 3 && "Services & Capabilities"}
                    {step === 4 && "Featured Case Studies"}
                  </h2>
                  <p className="text-xs text-[#6B7280] mt-1 max-w-lg leading-relaxed">
                    {step === 1 && "Tell us the basics so we can match you with the right projects."}
                    {step === 2 && "Showcase your expertise with awards and notable clients."}
                    {step === 3 && "Select the core services your agency excels at."}
                    {step === 4 && "Showcase your best case studies to build immediate trust."}
                  </p>
                </div>
                <div className="text-left md:text-right shrink-0">
                  <span className="text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200/50 rounded-full px-2.5 py-1">
                    {Math.round((step / 4) * 100)}% Complete
                  </span>
                </div>
              </div>

              {/* Progress track */}
              <div className="relative pt-3 pb-1">
                {/* Background Line */}
                <div className="absolute top-[28px] left-4 right-4 h-[3px] rounded-full bg-black/[0.04]" />
                
                {/* Active Line with clean dark color */}
                <div 
                  className="absolute top-[28px] left-4 h-[3px] rounded-full bg-slate-900 transition-all duration-500 ease-out" 
                  style={{ width: `calc(${((step - 1) / 3) * 100}% - ${step === 1 ? '0px' : step === 4 ? '24px' : '12px'})` }}
                />
                
                {/* Steps Row */}
                <div className="relative flex justify-between">
                  {[
                    { id: 1, label: "Essentials" },
                    { id: 2, label: "Trust" },
                    { id: 3, label: "Services" },
                    { id: 4, label: "Featured" }
                  ].map((s) => {
                    const active = step === s.id;
                    const completed = step > s.id;
                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={s.id > step && !completed}
                        onClick={() => setStep(s.id)}
                        className="flex flex-col items-center group focus:outline-none cursor-pointer disabled:cursor-not-allowed"
                      >
                        {/* Step indicator circle */}
                        <div 
                          className={`size-8 rounded-full flex items-center justify-center border transition-all duration-300 ${
                            completed
                              ? "bg-slate-950 border-slate-950 text-white"
                              : active
                                ? "bg-slate-950 border-slate-950 text-white ring-2 ring-slate-900/10"
                                : "bg-white border-black/[0.08] text-gray-400 group-hover:border-gray-450"
                          }`}
                        >
                          {completed ? (
                            <Check className="size-3 stroke-[3]" />
                          ) : (
                            <span className="text-[11px] font-bold">{s.id}</span>
                          )}
                        </div>
                        
                        {/* Label */}
                        <span className={`mt-2 text-[9px] uppercase tracking-wider transition-colors duration-200 ${
                          active 
                            ? "text-slate-950 font-bold" 
                            : completed 
                              ? "text-slate-800 font-medium" 
                              : "text-gray-400 font-medium"
                        }`}>
                          {s.label}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Step Card Wrapper */}
            <Card 
              className="border border-black/[0.04] bg-white shadow-[0_10px_35px_rgba(0,0,0,0.03)] rounded-[20px] transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.04)] overflow-hidden p-5 md:p-8 animate-fade-in"
              style={{ animation: 'fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 100ms forwards', opacity: 0 }}
            >
              
              {/* STEP 1 */}
              {step === 1 && (
                <div className="space-y-6 animate-fade-in">
                                    {/* Logo and Banner upload grid */}
                   <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 p-4 rounded-[16px] border border-black/[0.04] bg-slate-50/30">
                     
                     {/* Logo Section */}
                     <div className="flex flex-col items-center gap-3">
                       <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 text-center">Agency Logo</span>
                       <div className="relative group size-24 rounded-xl border border-dashed border-gray-300 hover:border-slate-800 bg-white hover:bg-slate-50/[0.01] transition-all duration-300 overflow-hidden flex items-center justify-center hover:shadow-xs">
                         <div className="size-18 rounded-lg bg-white shadow-xs border border-black/[0.02] p-1.5 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 group-hover:-translate-y-0.5">
                           <img
                             src={logoSeed?.startsWith("http") || logoSeed?.startsWith("data:") ? logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${logoSeed || (agency?.name ?? "placeholder")}&backgroundColor=003bb3,050505,52525B`}
                             className="h-full w-full object-contain"
                             alt="Logo Preview"
                           />
                         </div>
                         <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer">
                           <Camera className="size-4 text-white" />
                           <span className="text-[9px] font-bold text-white uppercase tracking-wider">Change</span>
                         </div>
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload('logo')} />
                       </div>
                       
                       {logoSeed && (
                         <div className="flex gap-3">
                           <button
                             type="button"
                             onClick={() => triggerManualCrop('logo')}
                             className="relative text-[9px] uppercase font-bold text-slate-800 tracking-wider py-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-slate-800 hover:after:w-full after:transition-all after:duration-200"
                           >
                             Crop
                           </button>
                           <button
                             type="button"
                             onClick={() => setLogoSeed("")}
                             className="relative text-[9px] uppercase font-bold text-gray-500 tracking-wider py-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-gray-500 hover:after:w-full after:transition-all after:duration-200"
                           >
                             Reset
                           </button>
                         </div>
                       )}
                     </div>

                     {/* Banner Section */}
                     <div className="space-y-3">
                       <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Profile Banner</span>
                       <div className="relative group aspect-[4/1] rounded-[16px] border border-black/[0.06] bg-white overflow-hidden flex items-center justify-center shadow-xs hover:shadow-xs transition-all duration-300">
                         {coverSeed ? (
                           <img
                             src={coverSeed.startsWith("http") || coverSeed.startsWith("data:") ? coverSeed : `https://picsum.photos/seed/${coverSeed}/1650/500`}
                             className="h-full w-full object-cover transition-transform duration-[750ms] ease-out group-hover:scale-105"
                             alt="Banner Preview"
                           />
                         ) : (
                           <div className="text-center p-3">
                             <ImageIcon className="size-5 text-steel mx-auto mb-0.5 opacity-60" />
                             <span className="text-[9px] font-bold text-steel uppercase tracking-wider block">No Banner</span>
                             <span className="text-[8px] text-steel block">Panoramic (3.3:1) recommended</span>
                           </div>
                         )}
                         <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-300 cursor-pointer">
                           <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-md px-3 py-1 text-white text-[9px] font-bold uppercase tracking-widest shadow-md">
                             Replace Banner
                           </div>
                         </div>
                         <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileUpload('cover')} />
                       </div>
                       
                       <div className="flex items-center justify-between gap-2">
                         <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">Or paste cover photo URL:</span>
                         {coverSeed && (
                           <div className="flex gap-3">
                             <button
                               type="button"
                               onClick={() => triggerManualCrop('cover')}
                               className="relative text-[9px] uppercase font-bold text-slate-800 tracking-wider py-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-slate-800 hover:after:w-full after:transition-all after:duration-200"
                             >
                               Crop
                             </button>
                             <button
                               type="button"
                               onClick={() => setCoverSeed("")}
                               className="relative text-[9px] uppercase font-bold text-gray-500 tracking-wider py-0.5 after:absolute after:bottom-0 after:left-0 after:h-[1.5px] after:w-0 after:bg-gray-500 hover:after:w-full after:transition-all after:duration-200"
                             >
                               Reset
                             </button>
                           </div>
                         )}
                       </div>
                       <Input
                         type="url"
                         placeholder="https://images.unsplash.com/photo-..."
                         value={coverSeed.startsWith('data:') ? '' : coverSeed}
                         onChange={(e) => setCoverSeed(e.target.value)}
                         className="h-9 text-xs border-black/[0.08] rounded-lg bg-white focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/5 placeholder-gray-400 font-medium transition-all duration-200"
                       />
                     </div>
                   </div>

                  {/* Core form grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Website */}
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <LinkIcon className="size-3.5 text-slate-450" />
                        Agency Website <span className="text-destructive font-bold">*</span>
                      </label>
                      <Input 
                        type="url" 
                        placeholder="https://youragency.com"
                        value={website}
                        onChange={e => setWebsite(e.target.value)}
                        className={inputClasses} 
                        required
                      />
                    </div>

                    {/* Description */}
                    <div className="space-y-1.5 md:col-span-2">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <FileText className="size-3.5 text-slate-450" />
                          Agency Description
                        </label>
                        <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Optional</span>
                      </div>
                      <Textarea 
                        placeholder="Tell us about your agency, your unique value proposition, and what sets you apart..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                        rows={3}
                        className={textareaClasses} 
                      />
                    </div>

                    {/* City */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <MapPin className="size-3.5 text-slate-450" />
                        City / Headquarters
                      </label>
                      <Input 
                        type="text" 
                        placeholder="Dubai"
                        value={city}
                        onChange={e => setCity(e.target.value)}
                        className={inputClasses} 
                      />
                    </div>

                    {/* Country */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Globe className="size-3.5 text-slate-450" />
                        Country
                      </label>
                      <CountrySelect 
                        value={countryCode}
                        onChange={val => setCountryCode(val)}
                        excludeAllCountries
                        placeholder="Select Country"
                        triggerClassName={selectTriggerClasses}
                      />
                    </div>

                    {/* Founded */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Calendar className="size-3.5 text-slate-450" />
                        Year Founded
                      </label>
                      <Input 
                        type="number" 
                        placeholder="2018"
                        value={founded}
                        onChange={e => setFounded(e.target.value)}
                        className={inputClasses} 
                      />
                    </div>

                    {/* Team Size */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="size-3.5 text-slate-450" />
                        Team Size
                      </label>
                      <DropdownSelect
                        value={teamSize}
                        onChange={(val) => setTeamSize(val)}
                        options={[
                          { value: "1-10", label: "1-10 people" },
                          { value: "11-50", label: "11-50 people" },
                          { value: "51-200", label: "51-200 people" },
                          { value: "200+", label: "200+ people" },
                        ]}
                        placeholder="Select Team Size"
                        triggerClassName={selectTriggerClasses}
                      />
                    </div>

                    {/* Min Budget */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <DollarSign className="size-3.5 text-slate-450" />
                        Minimum Project Budget (USD)
                      </label>
                      <Input 
                        type="number" 
                        placeholder="5000"
                        value={minBudget}
                        onChange={e => setMinBudget(e.target.value)}
                        className={inputClasses} 
                      />
                    </div>

                    {/* Calendly Booking Link */}
                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <LinkIcon className="size-3.5 text-slate-450" />
                        Calendly Booking Link
                      </label>
                      <Input 
                        type="url" 
                        placeholder="https://calendly.com/youragency"
                        value={calendlyLink}
                        onChange={e => setCalendlyLink(e.target.value)}
                        className={inputClasses} 
                      />
                    </div>
                  </div>

                  {/* Team culture photo & details */}
                  <div className="p-4 rounded-[16px] border border-black/[0.04] bg-slate-50/30 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                        <Users className="size-3.5 text-slate-450" />
                        Team & Culture Story
                      </h4>
                      <span className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">Optional</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4">
                      <div className="space-y-2">
                        <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Team Photo</span>
                        <div className="relative group aspect-square w-full rounded-xl border border-black/[0.06] bg-white overflow-hidden flex items-center justify-center shadow-xs">
                          {teamImage ? (
                            <img 
                              src={teamImage.startsWith("http") || teamImage.startsWith("data:") ? teamImage : `https://picsum.photos/seed/${teamImage}/400/400`} 
                              className="h-full w-full object-cover" 
                              alt="Team Preview" 
                            />
                          ) : (
                            <div className="text-center p-2">
                              <Users className="size-5 text-steel mx-auto mb-0.5 opacity-60" />
                              <span className="text-[9px] font-bold text-steel uppercase tracking-widest block">No Image</span>
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer">
                            <Camera className="size-4 text-white" />
                            <span className="text-[9px] font-bold text-white uppercase tracking-wider">Upload</span>
                          </div>
                          <input 
                            type="file" 
                            accept="image/*" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 2 * 1024 * 1024) {
                                toast.error("File is too large. Max size is 2MB.");
                                return;
                              }
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setTeamImage(reader.result as string);
                              };
                              reader.readAsDataURL(file);
                            }} 
                          />
                        </div>
                        {teamImage && (
                          <button 
                            type="button" 
                            onClick={() => setTeamImage("")}
                            className="text-[9px] uppercase font-bold text-destructive hover:underline w-full text-center"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Or paste team photo URL:</span>
                          <Input 
                            type="url" 
                            placeholder="Paste team image URL..."
                            value={teamImage.startsWith('data:') ? '' : teamImage}
                            onChange={(e) => setTeamImage(e.target.value)}
                            className={inputClasses}
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Our Team Story</span>
                          <Textarea
                            placeholder="Describe your team's background, culture, and expertise..."
                            value={teamStory}
                            onChange={(e) => setTeamStory(e.target.value)}
                            rows={3}
                            className={textareaClasses}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2 */}
              {step === 2 && (
                <div className="space-y-6 animate-fade-in">
                  
                  {/* Clients */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Briefcase className="size-3.5 text-slate-450" />
                          Trusted By (Clients)
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">Showcase brands you have worked with to build credibility.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setClients([...clients, { name: "", industry: "" }])} 
                        className="h-8 px-3 rounded-lg border border-black/[0.08] hover:bg-gray-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Client
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {clients.map((c, i) => (
                        <Card key={i} className="relative border border-black/[0.06] bg-white rounded-xl overflow-hidden shadow-xs hover:border-slate-350 transition-all duration-300">
                          <CardContent className="p-4 flex gap-3 items-center">
                            <div className="flex-grow space-y-3">
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  <Briefcase className="size-3.5 text-slate-400" />
                                  Client Name
                                </label>
                                <Input 
                                  placeholder="Client Name (e.g. Nike)"
                                  value={c.name}
                                  onChange={e => {
                                    const next = [...clients];
                                    next[i].name = e.target.value;
                                    setClients(next);
                                  }}
                                  className={inputClasses}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  <Globe className="size-3.5 text-slate-400" />
                                  Industry
                                </label>
                                <Input 
                                  placeholder="Industry (e.g. Retail)"
                                  value={c.industry}
                                  onChange={e => {
                                    const next = [...clients];
                                    next[i].industry = e.target.value;
                                    setClients(next);
                                  }}
                                  className={inputClasses}
                                />
                              </div>
                            </div>
                            {clients.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => setClients(clients.filter((_, idx) => idx !== i))}
                                className="h-8 w-8 shrink-0 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/20 flex items-center justify-center transition-all"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Awards */}
                  <div className="space-y-4 pt-4 border-t border-black/[0.04]">
                    <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                          <Award className="size-3.5 text-slate-450" />
                          Awards & Recognition
                        </h3>
                        <p className="text-[11px] text-slate-500 mt-0.5">List notable industry awards and accolades won by your team.</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setAwards([...awards, { title: "", organization: "", year: "" }])} 
                        className="h-8 px-3 rounded-lg border border-black/[0.08] hover:bg-gray-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                      >
                        <Plus className="size-3.5" /> Add Award
                      </button>
                    </div>

                    <div className="space-y-3">
                      {awards.map((a, i) => (
                        <Card key={i} className="relative border border-black/[0.06] bg-white rounded-xl overflow-hidden shadow-xs hover:border-slate-350 transition-all duration-300">
                          <CardContent className="p-4 flex gap-3 items-center">
                            <div className="flex-grow grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="sm:col-span-2 space-y-1">
                                <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  <Award className="size-3.5 text-slate-400" />
                                  Award Title
                                </label>
                                <Input 
                                  placeholder="Award Title (e.g. Agency of the Year)"
                                  value={a.title}
                                  onChange={e => {
                                    const next = [...awards];
                                    next[i].title = e.target.value;
                                    setAwards(next);
                                  }}
                                  className={inputClasses}
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  <Calendar className="size-3.5 text-slate-400" />
                                  Year
                                </label>
                                <Input 
                                  placeholder="Year"
                                  value={a.year}
                                  onChange={e => {
                                    const next = [...awards];
                                    next[i].year = e.target.value;
                                    setAwards(next);
                                  }}
                                  className={inputClasses}
                                />
                              </div>
                            </div>
                            {awards.length > 1 && (
                              <button 
                                type="button"
                                onClick={() => setAwards(awards.filter((_, idx) => idx !== i))}
                                className="h-8 w-8 shrink-0 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/20 flex items-center justify-center self-end mb-0.5 transition-all"
                              >
                                <Trash2 className="size-4" />
                              </button>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3 */}
              {step === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="border-b border-black/[0.04] pb-2.5">
                    <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-slate-450" />
                      Core Services
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">Select the services your agency excels at. Clients filter by these categories.</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {SERVICE_CATEGORIES.map(s => {
                      const active = services.includes(s);
                      const details = SERVICE_DETAILS[s] || { icon: <Layers className="size-4" />, desc: "Specialized offerings & agency capabilities." };
                      
                      if (s === "Other" && active) {
                        return (
                          <Card
                            key={s}
                            className="border border-slate-900 bg-slate-50/50 shadow-xs relative overflow-hidden flex flex-col justify-between rounded-xl animate-fade-in"
                          >
                            <CardContent className="p-4 space-y-3">
                              <div className="flex items-center gap-2">
                                <div className="p-2 rounded-lg bg-slate-950/10 text-slate-950">
                                  {details.icon}
                                </div>
                                <div className="flex-grow">
                                  <span className="text-[11px] font-semibold text-slate-700 block">Other Capabilities</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setOtherServices([""]);
                                    setServices(services.filter((x) => x !== "Other"));
                                  }}
                                  className="size-7 rounded-full text-gray-400 hover:text-destructive hover:bg-destructive/5 flex items-center justify-center transition-colors"
                                >
                                  <Trash2 className="size-3.5" />
                                </button>
                              </div>
                              <div className="space-y-2">
                                {otherServices.map((os, idx) => (
                                  <div key={idx} className="flex items-center gap-2">
                                    <Input
                                      type="text"
                                      autoFocus={idx === otherServices.length - 1}
                                      value={os}
                                      onChange={(e) => {
                                        const newOs = [...otherServices];
                                        newOs[idx] = e.target.value;
                                        setOtherServices(newOs);
                                      }}
                                      placeholder="Specify (e.g. Video Production, PR)"
                                      className="h-9 px-3 bg-white border border-black/[0.08] rounded-[10px] focus-visible:border-slate-800 focus-visible:ring-2 focus-visible:ring-slate-800/5 placeholder-[#9CA3AF] text-xs font-medium transition-all duration-200"
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                    {otherServices.length > 1 && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          setOtherServices(otherServices.filter((_, i) => i !== idx));
                                        }}
                                        className="size-8 shrink-0 rounded-full text-gray-400 hover:text-destructive hover:bg-destructive/5 flex items-center justify-center transition-colors"
                                      >
                                        <Trash2 className="size-3.5" />
                                      </button>
                                    )}
                                  </div>
                                ))}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setOtherServices([...otherServices, ""]);
                                  }}
                                  className="text-[10px] font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1 mt-1"
                                >
                                  <Plus className="size-3" /> Add another service
                                </button>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      }

                      return (
                        <Card
                          key={s}
                          onClick={() => {
                            if (services.includes(s)) setServices(services.filter(x => x !== s));
                            else {
                              setServices([...services, s]);
                              if (s === "Other" && otherServices.length === 0) setOtherServices([""]);
                            }
                          }}
                          className={`border cursor-pointer transition-all duration-300 relative overflow-hidden flex flex-col justify-between group hover:-translate-y-0.5 rounded-xl ${
                            active
                              ? "border border-slate-950 bg-slate-50/50 shadow-xs"
                              : "border-black/[0.08] hover:border-slate-350 bg-white"
                          }`}
                        >
                          <CardContent className="p-4 space-y-2.5">
                            <div className="flex items-start justify-between">
                              <div className={`p-2 rounded-lg transition-all duration-300 ${
                                active ? "bg-slate-950/10 text-slate-950" : "bg-gray-100 text-steel-dark group-hover:text-slate-950 group-hover:bg-slate-100"
                              }`}>
                                {details.icon}
                              </div>
                              <div className={`size-4.5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                                active ? "border-slate-950 bg-slate-950 text-white" : "border-black/[0.08]"
                              }`}>
                                {active && <Check className="size-2.5 stroke-[3] text-white" />}
                              </div>
                            </div>
                            <div>
                              <h4 className="text-xs font-semibold text-slate-800">{s}</h4>
                              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{details.desc}</p>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* STEP 4 */}
              {step === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between border-b border-black/[0.04] pb-2.5">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                        <Sparkles className="size-3.5 text-slate-450" />
                        Featured Case Studies
                      </h3>
                      <p className="text-[11px] text-slate-500 mt-0.5">Showcase your best projects to help clients understand your quality of work.</p>
                    </div>
                    <button 
                      type="button"
                      onClick={() => setPortfolio([...portfolio, { title: "", category: "", summary: "", imageSeed: "" }])} 
                      className="h-8 px-3 rounded-lg border border-black/[0.08] hover:bg-gray-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1 transition-colors"
                    >
                      <Plus className="size-3.5" /> Add Case Study
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {portfolio.map((p, i) => (
                      <Card key={i} className="relative border border-black/[0.06] bg-white rounded-xl shadow-xs hover:border-slate-350 transition-all duration-300 overflow-hidden group">
                        <CardContent className="p-4">
                          {portfolio.length > 1 && (
                            <button 
                              type="button"
                              onClick={() => setPortfolio(portfolio.filter((_, idx) => idx !== i))}
                              className="absolute right-2 top-2 size-7 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/5 border border-transparent hover:border-destructive/20 flex items-center justify-center transition-all z-10"
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          )}
                          
                          <div className="grid grid-cols-1 md:grid-cols-[130px_1fr] gap-4 relative">
                            {/* Project Image */}
                            <div className="space-y-2">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-slate-500 block">Project Thumbnail</span>
                              <div className="relative group aspect-square w-full rounded-lg border border-black/[0.08] bg-white overflow-hidden flex items-center justify-center shadow-inner hover:border-slate-400 transition-all duration-300">
                                {p.imageSeed ? (
                                  <img 
                                    src={p.imageSeed.startsWith("http") || p.imageSeed.startsWith("data:") ? p.imageSeed : `https://picsum.photos/seed/${p.imageSeed}/400/400`} 
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" 
                                    alt="Preview" 
                                  />
                                ) : (
                                  <div className="text-center p-3">
                                    <ImageIcon className="size-7 text-steel mx-auto mb-1 opacity-60" />
                                    <span className="text-[9px] font-bold text-steel uppercase tracking-widest block">No Image</span>
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center gap-1 transition-all duration-200 cursor-pointer">
                                  <Camera className="size-4 text-white" />
                                  <span className="text-[9px] font-bold text-white uppercase tracking-wider">Upload</span>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/*" 
                                  className="absolute inset-0 opacity-0 cursor-pointer" 
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    if (!file) return;
                                    if (file.size > 2 * 1024 * 1024) {
                                      toast.error("File is too large. Max size is 2MB.");
                                      return;
                                    }
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      const next = [...portfolio];
                                      next[i].imageSeed = reader.result as string;
                                      setPortfolio(next);
                                    };
                                    reader.readAsDataURL(file);
                                  }} 
                                />
                              </div>
                              {p.imageSeed && (
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const next = [...portfolio];
                                    next[i].imageSeed = "";
                                    setPortfolio(next);
                                  }}
                                  className="text-[9px] font-medium text-destructive hover:underline w-full text-center"
                                >
                                  Remove Image
                                </button>
                              )}
                            </div>

                            {/* Details fields */}
                            <div className="space-y-3">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                    <Briefcase className="size-3.5 text-slate-400" />
                                    Project Title
                                  </label>
                                  <Input 
                                    placeholder="e.g. Global Rebrand"
                                    value={p.title}
                                    onChange={e => {
                                      const next = [...portfolio];
                                      next[i].title = e.target.value;
                                      setPortfolio(next);
                                    }}
                                    className={inputClasses}
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                    <Sparkles className="size-3.5 text-slate-400" />
                                    Category / Service
                                  </label>
                                  <Input 
                                    placeholder="e.g. Web Development"
                                    value={p.category}
                                    onChange={e => {
                                      const next = [...portfolio];
                                      next[i].category = e.target.value;
                                      setPortfolio(next);
                                    }}
                                    className={inputClasses}
                                  />
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                  <LinkIcon className="size-3.5 text-slate-400" />
                                  Image URL (or upload on the left)
                                </label>
                                <Input 
                                  type="url"
                                  placeholder="https://images.unsplash.com/photo-..."
                                  value={p.imageSeed.startsWith('data:') ? '' : p.imageSeed}
                                  onChange={e => {
                                    const next = [...portfolio];
                                    next[i].imageSeed = e.target.value;
                                    setPortfolio(next);
                                  }}
                                  className={inputClasses}
                                />
                              </div>

                              <div className="space-y-1">
                                <div className="flex justify-between items-center">
                                  <label className="text-[11px] font-medium text-slate-700 flex items-center gap-1">
                                    <FileText className="size-3.5 text-slate-400" />
                                    Case Study Summary
                                  </label>
                                  <span className="text-[9px] font-medium text-slate-400">{p.summary.length}/400</span>
                                </div>
                                <Textarea 
                                  placeholder="Describe the challenge, approach, and the tangible results achieved..."
                                  value={p.summary}
                                  onChange={e => {
                                    if (e.target.value.length > 400) return;
                                    const next = [...portfolio];
                                    next[i].summary = e.target.value;
                                    setPortfolio(next);
                                  }}
                                  rows={3}
                                  className={textareaClasses}
                                />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Form Navigation Footer */}
              <div className="flex justify-between border-t border-black/[0.04] pt-5 mt-6">
                <button 
                  type="button"
                  disabled={step === 1 || submitting}
                  onClick={() => setStep(step - 1)}
                  className="inline-flex items-center gap-1.5 rounded-[10px] h-10 px-4 border border-black/[0.08] hover:bg-gray-50 text-xs font-semibold text-slate-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="size-3.5" />
                  Back
                </button>
                <button 
                  type="button"
                  disabled={submitting}
                  onClick={save}
                  className="inline-flex items-center gap-1.5 rounded-[10px] h-10 px-5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition-all duration-200 cursor-pointer"
                >
                  {submitting ? "Saving..." : step === 4 ? "Complete Profile" : "Continue"}
                  {!submitting && <ArrowRight className="size-3.5" />}
                </button>
              </div>

            </Card>
          </div>

          {/* Sticky Live Preview Sidebar */}
          <div 
            className="sticky top-24 hidden lg:block space-y-4 animate-fade-in"
            style={{ animation: 'fade-in 600ms cubic-bezier(0.16, 1, 0.3, 1) 200ms forwards', opacity: 0 }}
          >
            {/* Live Profile wrapper */}
            <div className="relative">
              
              <div className="rounded-2xl border border-black/[0.05] bg-white p-5 shadow-sm space-y-5">
                
                {/* Header Badge */}
                <div className="flex items-center justify-between border-b border-black/[0.05] pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                      ✦ LIVE PROFILE PREVIEW
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200 px-2 py-0.5 text-[9px] font-medium text-slate-700">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-slate-500"></span>
                    </span>
                    Interactive
                  </span>
                </div>

                {/* Tab Toggle: Search Card vs Profile Details */}
                <div className="flex rounded-lg bg-slate-100 p-0.5">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("card")}
                    className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-semibold transition-all cursor-pointer ${
                      previewTab === "card"
                        ? "bg-white text-slate-900 shadow-xs border border-black/[0.02]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Directory Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("profile")}
                    className={`flex-1 rounded-md py-1.5 text-center text-[11px] font-semibold transition-all cursor-pointer ${
                      previewTab === "profile"
                        ? "bg-white text-slate-900 shadow-xs border border-black/[0.02]"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Page Header
                  </button>
                </div>

                {previewTab === "card" ? (
                  /* Directory Card Preview */
                  <div className="group/preview relative flex flex-col overflow-hidden rounded-xl border border-black/[0.05] bg-white p-4 transition-all duration-300 hover:border-slate-350 hover:shadow-xs pointer-events-none">
                    {/* Center Content */}
                    <div className="relative flex flex-col items-center text-center">
                      
                      {/* Logo container */}
                      <div className="relative mb-3">
                        <div className="size-14 overflow-hidden rounded-lg border border-black/[0.04] bg-white shadow-xs flex items-center justify-center transition-all duration-300">
                          <img
                            src={logoSeed?.startsWith("data:") || logoSeed?.startsWith("http") ? logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${logoSeed || (agency?.name ?? "placeholder")}&backgroundColor=003bb3,050505,52525B`}
                            alt="Logo Preview"
                            className="h-full w-full object-contain p-1.5"
                          />
                        </div>
                      </div>

                      {/* Agency Name & Verified Badge */}
                      <h3 className="text-sm font-semibold tracking-tight text-slate-900 mb-1 flex items-center justify-center gap-1 flex-wrap">
                        <span>{agency?.name || user?.company || user?.name || "Your Agency"}</span>
                        <span className="inline-flex items-center gap-0.5 rounded-full border border-slate-900/10 bg-slate-900/[0.02] px-1.5 py-0.5 text-[8px] font-bold text-slate-800">
                          <Check className="size-2 text-slate-800 stroke-[3.5]" />
                          <span>Verified</span>
                        </span>
                      </h3>

                      {/* Rating */}
                      <div className="flex items-center gap-1 mb-2 text-xs">
                        <span className="font-semibold text-slate-800">5.0</span>
                        <span className="text-amber-500 tracking-wider">★★★★★</span>
                        <span className="text-slate-400 font-medium text-[9px]">(0 reviews)</span>
                      </div>

                      <p className="text-[11px] leading-relaxed text-slate-500 line-clamp-2 mb-3 h-8 overflow-hidden">
                        {description.trim() || "Add an agency description to tell clients about your values, history, and what sets you apart..."}
                      </p>

                      {/* Service Tags */}
                      <div className="flex flex-wrap justify-center gap-1 mb-4 min-h-[20px]">
                        {services.length > 0 ? (
                          services.flatMap(s => s === "Other" ? otherServices.filter(os => os.trim()) : [s]).slice(0, 3).map((s, idx) => (
                            <span
                              key={`${s}-${idx}`}
                              className="rounded-md border border-black/[0.06] bg-slate-50/50 px-2 py-0.5 text-[9px] font-medium text-slate-600"
                            >
                              {s}
                            </span>
                          ))
                        ) : (
                          <span className="rounded-md border border-dashed border-black/[0.08] px-2 py-0.5 text-[9px] font-medium text-slate-400">
                            No services selected
                          </span>
                        )}
                      </div>
                    </div>

                    <Separator className="my-3 border-black/[0.04]" />

                    {/* Stats List */}
                    <div className="flex flex-col text-[11px] text-slate-500 mb-4 border-t border-black/[0.04]">
                      <div className="flex items-center gap-2.5 py-2 hover:bg-slate-50/50 px-1.5 rounded-lg transition-colors border-b border-black/[0.04]">
                        <MapPin className="size-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {[city, countryCode].filter(Boolean).join(", ") || "Set location..."}
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 py-2 hover:bg-slate-50/50 px-1.5 rounded-lg transition-colors border-b border-black/[0.04]">
                        <DollarSign className="size-3.5 text-slate-400 shrink-0" />
                        <span>
                          Min. Budget: <span className="font-semibold text-slate-800">${Number(minBudget).toLocaleString() || "0"}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2.5 py-2 hover:bg-slate-50/50 px-1.5 rounded-lg transition-colors border-b border-black/[0.04]">
                        <Users className="size-3.5 text-slate-400 shrink-0" />
                        <span>
                          Team Size: <span className="font-semibold text-slate-800">{teamSize || "Select size"}</span>
                        </span>
                      </div>
                    </div>

                    <button 
                      className="group/btn mt-auto w-full flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      <span>Visit Website</span>
                      <ArrowRight className="size-3.5 transition-transform duration-300 group-hover/btn:translate-x-0.5" />
                    </button>
                  </div>
                ) : (
                  /* Page Header Preview */
                  <div className="rounded-xl border border-black/[0.05] bg-white overflow-hidden shadow-xs pointer-events-none">
                    {/* Banner */}
                    <div className="relative aspect-[3/1] bg-slate-50 overflow-hidden flex items-center justify-center">
                      {coverSeed ? (
                        <img
                          src={coverSeed.startsWith("http") || coverSeed.startsWith("data:") ? coverSeed : `https://picsum.photos/seed/${coverSeed}/1650/500`}
                          alt="Banner Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-center p-3">
                          <ImageIcon className="size-6 text-slate-450 mx-auto mb-0.5 opacity-55" />
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">No Banner</span>
                        </div>
                      )}
                    </div>

                    {/* Info Block */}
                    <div className="p-3 space-y-3">
                      {/* Logo Overlapping */}
                      <div className="flex gap-2.5 items-end -mt-8">
                        <div className="size-11 overflow-hidden rounded-lg border border-white bg-white shadow-sm flex items-center justify-center z-10 shrink-0">
                          <img
                            src={logoSeed?.startsWith("data:") || logoSeed?.startsWith("http") ? logoSeed : `https://api.dicebear.com/7.x/shapes/svg?seed=${logoSeed || (agency?.name ?? "placeholder")}&backgroundColor=003bb3,050505,52525B`}
                            alt="Logo Preview"
                            className="h-full w-full object-contain p-1"
                          />
                        </div>
                        <div className="pb-0.5 min-w-0">
                          <h4 className="text-xs font-semibold text-slate-800 truncate">{agency?.name || user?.company || user?.name || "Your Agency"}</h4>
                          <p className="text-[10px] text-slate-400 truncate">{website || "youragency.com"}</p>
                        </div>
                      </div>

                      {/* Short details */}
                      <div className="grid grid-cols-2 gap-2 pt-2 text-[10px] border-t border-black/[0.04]">
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">HQ Location</span>
                          <span className="font-semibold text-slate-700 truncate block">{[city, countryCode].filter(Boolean).join(", ") || "Not set"}</span>
                        </div>
                        <div className="space-y-0.5">
                          <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-400">Founded</span>
                          <span className="font-semibold text-slate-700 block">{founded || "Not set"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Info Box */}
                <div 
                  className="relative group overflow-hidden rounded-xl bg-slate-50 border border-slate-200 p-4 flex items-start gap-3 transition-all duration-300"
                >
                  <Sparkles className="size-4 text-slate-500 shrink-0 mt-0.5" />
                  <div className="text-[11px] font-medium text-slate-600 leading-relaxed">
                    This is how your agency will look to potential clients in the Finding Global directory. Complete all onboarding steps to rank higher.
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
      
      <SiteFooter />

      {/* React Easy Crop Modal */}
      {cropModalOpen && cropImageSrc && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-obsidian/90 backdrop-blur-xs p-6">
          <div className="bg-background rounded-[24px] w-full max-w-4xl overflow-hidden shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between bg-surface">
              <div>
                <h3 className="text-xl font-bold tracking-tight text-obsidian">Crop your {cropType === 'cover' ? 'Banner' : 'Logo'}</h3>
                <p className="text-sm font-medium text-steel">Drag and zoom to position your image perfectly.</p>
              </div>
              <Button 
                onClick={() => setCropModalOpen(false)}
                variant="outline"
                size="icon"
                className="size-10 rounded-full border border-border bg-white text-steel hover:text-destructive hover:border-destructive transition-colors"
              >
                <svg className="size-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
              </Button>
            </div>
            
            <div className="relative w-full h-[450px] bg-obsidian/5">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropType === 'cover' ? 3.3 / 1 : 1 / 1}
                onCropChange={setCrop}
                onCropComplete={(croppedArea, croppedAreaPixels) => setCroppedAreaPixels(croppedAreaPixels)}
                onZoomChange={setZoom}
              />
            </div>
            
            <div className="p-6 bg-surface border-t border-border flex items-center justify-between">
               <div className="flex items-center gap-4 flex-1 max-w-xs">
                 <span className="text-[10px] font-bold uppercase tracking-widest text-steel">Zoom</span>
                 <input
                   type="range"
                   value={zoom}
                   min={1}
                   max={3}
                   step={0.1}
                   aria-labelledby="Zoom"
                   onChange={(e) => setZoom(Number(e.target.value))}
                   className="flex-1 accent-hyperblue"
                 />
               </div>
               <div className="flex gap-3">
                 <Button 
                   onClick={() => setCropModalOpen(false)}
                   variant="outline"
                   className="px-6 py-2.5 rounded-xl border border-border text-xs font-bold uppercase tracking-widest text-steel-dark hover:border-obsidian hover:text-obsidian transition-colors"
                 >
                   Cancel
                 </Button>
                 <Button 
                   onClick={handleCropComplete}
                   className="px-6 py-2.5 rounded-xl bg-hyperblue hover:bg-blue-700 text-xs font-bold uppercase tracking-widest text-white shadow-lg shadow-hyperblue/20 transition-all"
                 >
                   Crop & Save
                 </Button>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
