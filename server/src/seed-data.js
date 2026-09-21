// Plain-JS seed agencies. Mirrors src/lib/mock-data.ts on the frontend.
export const AGENCIES = [
  {
    slug: "altaris-consulting",
    name: "Altaris Consulting",
    tagline: "Corporate strategy for MENA institutions",
    description:
      "Altaris partners with banks, sovereign funds, and listed corporates on market entry, restructuring, and post-merger integration.",
    city: "Dubai", country: "United Arab Emirates", countryCode: "AE",
    founded: 2014, teamSize: "50–100", minBudget: 150000, rating: 4.9, reviewCount: 47,
    services: ["Strategy & Consulting", "Marketing"],
    industries: ["Finance & Banking", "Real Estate", "Energy"],
    logoSeed: "altaris", coverSeed: "altaris-c", featured: true, verified: true,
    portfolio: [
          {
                "title": "Market Entry Blueprint",
                "client": "Emirates Capital Group",
                "category": "Strategy & Consulting",
                "imageSeed": "altaris-consulting-0",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Always-On Content System",
                "client": "Damac Heights",
                "category": "Marketing",
                "imageSeed": "altaris-consulting-1",
                "summary": "A multi-market rollout that aligned regional stakeholders on a single playbook and unlocked double-digit growth in the first quarter."
          },
          {
                "title": "Operating Model Redesign",
                "client": "Masdar",
                "category": "Strategy & Consulting",
                "imageSeed": "altaris-consulting-2",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "vanguard-digital",
    name: "Vanguard Digital",
    tagline: "Enterprise engineering for the public sector",
    description: "Vanguard builds secure, scalable digital products for governments and large enterprises across the Gulf.",
    city: "Riyadh", country: "Saudi Arabia", countryCode: "SA",
    founded: 2017, teamSize: "100–250", minBudget: 75000, rating: 4.8, reviewCount: 63,
    services: ["Web Development", "Mobile Development", "Strategy & Consulting"],
    industries: ["Government", "Finance & Banking", "Healthcare"],
    logoSeed: "vanguard", coverSeed: "vanguard-c", featured: true, verified: true,
    portfolio: [
          {
                "title": "Customer Portal Rebuild",
                "client": "Ministry of Investment",
                "category": "Web Development",
                "imageSeed": "vanguard-digital-0",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Loyalty Mobile App",
                "client": "Gulf Wealth Bank",
                "category": "Mobile Development",
                "imageSeed": "vanguard-digital-1",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          },
          {
                "title": "Operating Model Redesign",
                "client": "Saudi German Hospitals",
                "category": "Strategy & Consulting",
                "imageSeed": "vanguard-digital-2",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "oasis-performance",
    name: "Oasis Performance",
    tagline: "Performance marketing for D2C scale-ups",
    description: "Aggressive paid media, lifecycle, and CRO programs for venture-backed e-commerce brands.",
    city: "Cairo", country: "Egypt", countryCode: "EG",
    founded: 2019, teamSize: "20–50", minBudget: 25000, rating: 4.7, reviewCount: 89,
    services: ["Performance & Paid Media", "Marketing", "SEO & Content"],
    industries: ["Retail & E-commerce", "Technology & SaaS", "Hospitality & Travel"],
    logoSeed: "oasis", coverSeed: "oasis-c", featured: true, verified: true,
    portfolio: [
          {
                "title": "Paid Media Scale-Up",
                "client": "Noon Marketplace",
                "category": "Performance & Paid Media",
                "imageSeed": "oasis-performance-0",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          },
          {
                "title": "Always-On Content System",
                "client": "Careem Tech",
                "category": "Marketing",
                "imageSeed": "oasis-performance-1",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Topical Authority Build",
                "client": "Atlantis Royal",
                "category": "SEO & Content",
                "imageSeed": "oasis-performance-2",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "majlis-brand-studio",
    name: "Majlis Brand Studio",
    tagline: "Identity systems rooted in regional craft",
    description: "A boutique branding studio building identities for cultural institutions and hospitality brands.",
    city: "Doha", country: "Qatar", countryCode: "QA",
    founded: 2016, teamSize: "10–20", minBudget: 50000, rating: 4.9, reviewCount: 34,
    services: ["Branding", "Creative & Design"],
    industries: ["Hospitality & Travel", "Real Estate", "Media & Entertainment"],
    logoSeed: "majlis", coverSeed: "majlis-c", featured: true, verified: true,
    portfolio: [
          {
                "title": "Identity System Refresh",
                "client": "Jumeirah Collection",
                "category": "Branding",
                "imageSeed": "majlis-brand-studio-0",
                "summary": "A multi-market rollout that aligned regional stakeholders on a single playbook and unlocked double-digit growth in the first quarter."
          },
          {
                "title": "Cultural Activation",
                "client": "Damac Heights",
                "category": "Creative & Design",
                "imageSeed": "majlis-brand-studio-1",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Naming & Visual Identity",
                "client": "Rotana Media",
                "category": "Branding",
                "imageSeed": "majlis-brand-studio-2",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "nexus-ventures-studio",
    name: "Nexus Ventures Studio",
    tagline: "Product studio for fintech and SaaS",
    description: "We design and ship venture-grade products for early and growth-stage tech companies.",
    city: "Dubai", country: "United Arab Emirates", countryCode: "AE",
    founded: 2020, teamSize: "20–50", minBudget: 60000, rating: 4.8, reviewCount: 52,
    services: ["Web Development", "Mobile Development", "Creative & Design"],
    industries: ["Technology & SaaS", "Finance & Banking"],
    logoSeed: "nexus", coverSeed: "nexus-c", featured: false, verified: true,
    portfolio: [
          {
                "title": "Customer Portal Rebuild",
                "client": "Tabby Pay",
                "category": "Web Development",
                "imageSeed": "nexus-ventures-studio-0",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Loyalty Mobile App",
                "client": "Gulf Wealth Bank",
                "category": "Mobile Development",
                "imageSeed": "nexus-ventures-studio-1",
                "summary": "A multi-market rollout that aligned regional stakeholders on a single playbook and unlocked double-digit growth in the first quarter."
          },
          {
                "title": "Multi-Channel Art Direction",
                "client": "Tamara Labs",
                "category": "Creative & Design",
                "imageSeed": "nexus-ventures-studio-2",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "sahara-content-co",
    name: "Sahara Content Co.",
    tagline: "Bilingual content & SEO at scale",
    description: "Bilingual editorial team producing high-intent SEO content and PR for AR/EN audiences.",
    city: "Amman", country: "Jordan", countryCode: "JO",
    founded: 2018, teamSize: "10–20", minBudget: 15000, rating: 4.6, reviewCount: 71,
    services: ["SEO & Content", "Marketing"],
    industries: ["Technology & SaaS", "Healthcare", "Education"],
    logoSeed: "sahara", coverSeed: "sahara-c", featured: false, verified: true,
    portfolio: [
          {
                "title": "Organic Growth Engine",
                "client": "Tabby Pay",
                "category": "SEO & Content",
                "imageSeed": "sahara-content-co-0",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          },
          {
                "title": "Always-On Content System",
                "client": "Cairo Health Network",
                "category": "Marketing",
                "imageSeed": "sahara-content-co-1",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          },
          {
                "title": "Topical Authority Build",
                "client": "GEMS Education",
                "category": "SEO & Content",
                "imageSeed": "sahara-content-co-2",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "atlas-creative-house",
    name: "Atlas Creative House",
    tagline: "Campaigns that travel the region",
    description: "Integrated creative agency producing campaigns, films, and brand experiences across MENA.",
    city: "Casablanca", country: "Morocco", countryCode: "MA",
    founded: 2012, teamSize: "50–100", minBudget: 40000, rating: 4.7, reviewCount: 58,
    services: ["Creative & Design", "Branding", "Marketing"],
    industries: ["Retail & E-commerce", "Hospitality & Travel", "Government"],
    logoSeed: "atlas", coverSeed: "atlas-c", featured: false, verified: true,
    portfolio: [
          {
                "title": "Flagship Campaign Creative",
                "client": "Noon Marketplace",
                "category": "Creative & Design",
                "imageSeed": "atlas-creative-house-0",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          },
          {
                "title": "Master Brand Architecture",
                "client": "Almosafer",
                "category": "Branding",
                "imageSeed": "atlas-creative-house-1",
                "summary": "A multi-market rollout that aligned regional stakeholders on a single playbook and unlocked double-digit growth in the first quarter."
          },
          {
                "title": "Integrated Launch Plan",
                "client": "ITIDA",
                "category": "Marketing",
                "imageSeed": "atlas-creative-house-2",
                "summary": "End-to-end delivery from research and concept through production, with a regional creative team operating in three languages."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "phoenix-growth-labs",
    name: "Phoenix Growth Labs",
    tagline: "Growth engineering for ambitious founders",
    description: "We embed product, growth, and analytics talent into early-stage teams.",
    city: "Manama", country: "Bahrain", countryCode: "BH",
    founded: 2021, teamSize: "10–20", minBudget: 20000, rating: 4.8, reviewCount: 29,
    services: ["Performance & Paid Media", "Strategy & Consulting", "Web Development"],
    industries: ["Technology & SaaS", "Retail & E-commerce"],
    logoSeed: "phoenix", coverSeed: "phoenix-c", featured: false, verified: true,
    portfolio: [
          {
                "title": "Paid Media Scale-Up",
                "client": "Tabby Pay",
                "category": "Performance & Paid Media",
                "imageSeed": "phoenix-growth-labs-0",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          },
          {
                "title": "Post-Merger Integration",
                "client": "Anghami Retail",
                "category": "Strategy & Consulting",
                "imageSeed": "phoenix-growth-labs-1",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Marketing Site Redesign",
                "client": "Tamara Labs",
                "category": "Web Development",
                "imageSeed": "phoenix-growth-labs-2",
                "summary": "Replaced a fragmented set of vendors with one accountable team — reducing time-to-launch and lifting brand quality scores."
          }
    ], team: [], reviews: [],
  },
  {
    slug: "cedar-strategy-partners",
    name: "Cedar Strategy Partners",
    tagline: "Boutique consulting for family business",
    description: "Cedar advises family conglomerates on governance, succession, and growth strategy.",
    city: "Beirut", country: "Lebanon", countryCode: "LB",
    founded: 2010, teamSize: "20–50", minBudget: 90000, rating: 4.9, reviewCount: 41,
    services: ["Strategy & Consulting"],
    industries: ["Real Estate", "Retail & E-commerce", "Energy"],
    logoSeed: "cedar", coverSeed: "cedar-c", featured: false, verified: true,
    portfolio: [
          {
                "title": "Market Entry Blueprint",
                "client": "Aldar Developments",
                "category": "Strategy & Consulting",
                "imageSeed": "cedar-strategy-partners-0",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          },
          {
                "title": "Post-Merger Integration",
                "client": "Anghami Retail",
                "category": "Strategy & Consulting",
                "imageSeed": "cedar-strategy-partners-1",
                "summary": "A multi-market rollout that aligned regional stakeholders on a single playbook and unlocked double-digit growth in the first quarter."
          },
          {
                "title": "Operating Model Redesign",
                "client": "Masdar",
                "category": "Strategy & Consulting",
                "imageSeed": "cedar-strategy-partners-2",
                "summary": "Built and shipped in 14 weeks, the program delivered measurable lift across the priority KPIs and now runs as a standing engagement."
          }
    ], team: [], reviews: [],
  },
];