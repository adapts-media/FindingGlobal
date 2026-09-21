// Centralized mock data for the Finding MENA MVP frontend.
// Replace with real Lovable Cloud queries once backend is enabled.

export type ServiceCategory =
  | "Marketing"
  | "Branding"
  | "Web Development"
  | "Mobile Development"
  | "Creative & Design"
  | "Strategy & Consulting"
  | "SEO & Content"
  | "Performance & Paid Media"
  | "Other";

export const SERVICE_CATEGORIES: ServiceCategory[] = [
  "Marketing",
  "Branding",
  "Web Development",
  "Mobile Development",
  "Creative & Design",
  "Strategy & Consulting",
  "SEO & Content",
  "Performance & Paid Media",
  "Other",
];

export const COUNTRIES = [
  "All Countries",
  "Afghanistan",
  "Albania",
  "Algeria",
  "American Samoa",
  "Andorra",
  "Angola",
  "Anguilla",
  "Antarctica",
  "Antigua and Barbuda",
  "Argentina",
  "Armenia",
  "Aruba",
  "Australia",
  "Austria",
  "Azerbaijan",
  "Bahamas",
  "Bahrain",
  "Bangladesh",
  "Barbados",
  "Belarus",
  "Belgium",
  "Belize",
  "Benin",
  "Bermuda",
  "Bhutan",
  "Bolivia",
  "Bosnia and Herzegovina",
  "Botswana",
  "Bouvet Island",
  "Brazil",
  "British Indian Ocean Territory",
  "British Virgin Islands",
  "Brunei",
  "Bulgaria",
  "Burkina Faso",
  "Burundi",
  "Cambodia",
  "Cameroon",
  "Canada",
  "Cape Verde",
  "Caribbean Netherlands",
  "Cayman Islands",
  "Central African Republic",
  "Chad",
  "Chile",
  "China",
  "Christmas Island",
  "Cocos (Keeling) Islands",
  "Colombia",
  "Comoros",
  "Cook Islands",
  "Costa Rica",
  "Croatia",
  "Cuba",
  "Curaçao",
  "Cyprus",
  "Czechia",
  "DR Congo",
  "Denmark",
  "Djibouti",
  "Dominica",
  "Dominican Republic",
  "Ecuador",
  "Egypt",
  "El Salvador",
  "Equatorial Guinea",
  "Eritrea",
  "Estonia",
  "Eswatini",
  "Ethiopia",
  "Falkland Islands",
  "Faroe Islands",
  "Fiji",
  "Finland",
  "France",
  "French Guiana",
  "French Polynesia",
  "French Southern and Antarctic Lands",
  "Gabon",
  "Gambia",
  "Georgia",
  "Germany",
  "Ghana",
  "Gibraltar",
  "Greece",
  "Greenland",
  "Grenada",
  "Guadeloupe",
  "Guam",
  "Guatemala",
  "Guernsey",
  "Guinea",
  "Guinea-Bissau",
  "Guyana",
  "Haiti",
  "Heard Island and McDonald Islands",
  "Honduras",
  "Hong Kong",
  "Hungary",
  "Iceland",
  "India",
  "Indonesia",
  "Iran",
  "Iraq",
  "Ireland",
  "Isle of Man",
  "Israel",
  "Italy",
  "Ivory Coast",
  "Jamaica",
  "Japan",
  "Jersey",
  "Jordan",
  "Kazakhstan",
  "Kenya",
  "Kiribati",
  "Kosovo",
  "Kuwait",
  "Kyrgyzstan",
  "Laos",
  "Latvia",
  "Lebanon",
  "Lesotho",
  "Liberia",
  "Libya",
  "Liechtenstein",
  "Lithuania",
  "Luxembourg",
  "Macau",
  "Madagascar",
  "Malawi",
  "Malaysia",
  "Maldives",
  "Mali",
  "Malta",
  "Marshall Islands",
  "Martinique",
  "Mauritania",
  "Mauritius",
  "Mayotte",
  "Mexico",
  "Micronesia",
  "Moldova",
  "Monaco",
  "Mongolia",
  "Montenegro",
  "Montserrat",
  "Morocco",
  "Mozambique",
  "Myanmar",
  "Namibia",
  "Nauru",
  "Nepal",
  "Netherlands",
  "New Caledonia",
  "New Zealand",
  "Nicaragua",
  "Niger",
  "Nigeria",
  "Niue",
  "Norfolk Island",
  "North Korea",
  "North Macedonia",
  "Northern Mariana Islands",
  "Norway",
  "Oman",
  "Pakistan",
  "Palau",
  "Palestine",
  "Panama",
  "Papua New Guinea",
  "Paraguay",
  "Peru",
  "Philippines",
  "Pitcairn Islands",
  "Poland",
  "Portugal",
  "Puerto Rico",
  "Qatar",
  "Republic of the Congo",
  "Romania",
  "Russia",
  "Rwanda",
  "Réunion",
  "Saint Barthélemy",
  "Saint Helena, Ascension and Tristan da Cunha",
  "Saint Kitts and Nevis",
  "Saint Lucia",
  "Saint Martin",
  "Saint Pierre and Miquelon",
  "Saint Vincent and the Grenadines",
  "Samoa",
  "San Marino",
  "Saudi Arabia",
  "Senegal",
  "Serbia",
  "Seychelles",
  "Sierra Leone",
  "Singapore",
  "Sint Maarten",
  "Slovakia",
  "Slovenia",
  "Solomon Islands",
  "Somalia",
  "South Africa",
  "South Georgia",
  "South Korea",
  "South Sudan",
  "Spain",
  "Sri Lanka",
  "Sudan",
  "Suriname",
  "Svalbard and Jan Mayen",
  "Sweden",
  "Switzerland",
  "Syria",
  "São Tomé and Príncipe",
  "Taiwan",
  "Tajikistan",
  "Tanzania",
  "Thailand",
  "Timor-Leste",
  "Togo",
  "Tokelau",
  "Tonga",
  "Trinidad and Tobago",
  "Tunisia",
  "Turkey",
  "Turkmenistan",
  "Turks and Caicos Islands",
  "Tuvalu",
  "Uganda",
  "Ukraine",
  "United Arab Emirates",
  "United Kingdom",
  "United States",
  "United States Minor Outlying Islands",
  "United States Virgin Islands",
  "Uruguay",
  "Uzbekistan",
  "Vanuatu",
  "Vatican City",
  "Venezuela",
  "Vietnam",
  "Wallis and Futuna",
  "Western Sahara",
  "Yemen",
  "Zambia",
  "Zimbabwe",
  "Åland Islands"
] as const;

export type Country = (typeof COUNTRIES)[number];

export const INDUSTRIES = [
  "Finance & Banking",
  "Real Estate",
  "Retail & E-commerce",
  "Hospitality & Travel",
  "Technology & SaaS",
  "Healthcare",
  "Government",
  "Energy",
  "Education",
  "Media & Entertainment",
  "Other",
] as const;

export type Industry = (typeof INDUSTRIES)[number];

export type BudgetTier = "<25k" | "25k-75k" | "75k-150k" | "150k-500k" | "500k+";

export const BUDGET_TIERS: { id: BudgetTier; label: string; min: number; max: number }[] = [
  { id: "<25k", label: "Under $25,000", min: 0, max: 25_000 },
  { id: "25k-75k", label: "$25,000 – $75,000", min: 25_000, max: 75_000 },
  { id: "75k-150k", label: "$75,000 – $150,000", min: 75_000, max: 150_000 },
  { id: "150k-500k", label: "$150,000 – $500,000", min: 150_000, max: 500_000 },
  { id: "500k+", label: "$500,000+", min: 500_000, max: Infinity },
];

export interface Agency {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  city: string;
  country: Country;
  countryCode: string;
  founded: number;
  teamSize: string;
  minBudget: number;
  rating: number;
  reviewCount: number;
  services: ServiceCategory[];
  industries: Industry[];
  logoSeed: string;
  coverSeed: string;
  featured: boolean;
  verified: boolean;
  plan?: "Starter" | "Growth";
  portfolio: PortfolioItem[];
  team: TeamMember[];
  reviews: Review[];
  awards?: Award[];
  clients?: Client[];
  messages?: {
    name: string;
    email: string;
    company?: string;
    budget?: string;
    message: string;
    createdAt?: string;
  }[];
  website?: string;
  teamImage?: string;
  teamStory?: string;
  calendlyLink?: string;
}

export interface PortfolioItem {
  title: string;
  client: string;
  category: ServiceCategory;
  imageSeed: string;
  summary: string;
  description?: string;
  deliverables?: string[];
  timeline?: string;
  year?: number;
  role?: string;
  results?: string[];
  liveUrl?: string;
  industry?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  initials: string;
}

export interface Review {
  author: string;
  company: string;
  rating: number;
  date: string;
  excerpt: string;
  projectId?: string;
  userId?: string;
}

export interface Award {
  title: string;
  organization: string;
  year: number;
  category?: string;
}

export interface Client {
  name: string;
  industry?: string;
  logoSeed?: string;
}

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  content: string;
  imageSeed?: string;
  author?: {
    name: string;
    role: string;
    avatarSeed: string;
  };
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "choosing-an-agency-in-the-gcc",
    title: "How to choose an agency in the GCC: a procurement playbook",
    excerpt:
      "Five criteria CMOs and procurement teams are using to shortlist regional agencies in 2025.",
    category: "Procurement",
    date: "Apr 2025",
    content: `Choosing the right agency partner in the GCC is more complex than ever. With the rapid expansion of markets like Saudi Arabia and the continued sophistication of Dubai's creative scene, procurement teams need a robust framework to evaluate partners.

### 1. Regional Experience vs. Global Name
While global network agencies bring prestige, regional independent shops often possess deeper boots-on-the-ground knowledge. The best partners often sit at the intersection of both.

### 2. Bilingual Content Capabilities
In MENA, "bilingual" shouldn't mean "translated." Look for agencies that have native Arabic creative teams who can conceptualize in Arabic first, rather than treating it as a secondary output.

### 3. Local Connectivity
Does the agency understand the nuances between Riyadh, Jeddah, Dubai, and Abu Dhabi? Each city has its own cultural heartbeat and consumer behavior patterns.

### 4. Technical Resilience
As digital transformation accelerates, agencies must demonstrate high standards in data security, cloud infrastructure, and localized UX/UI.

### 5. Procurement Transparency
Modern CMOs demand clear pricing models. Ensure your agency uses standardized rate cards and has clear policies on third-party markups.`,
    author: {
      name: "Layla Hassan",
      role: "Managing Partner",
      avatarSeed: "layla"
    }
  },
  {
    slug: "saudi-vision-2030-marketing",
    title: "Marketing under Vision 2030: what's changing in Saudi Arabia",
    excerpt:
      "From Riyadh Season to giga-projects, here's what brands need to know about activating in KSA.",
    category: "Saudi Arabia",
    date: "Apr 2025",
    content: `Saudi Arabia's marketing landscape is undergoing a generational shift. Under Vision 2030, the Kingdom has transformed into one of the world's most dynamic markets for creative and tech agencies.

### The Rise of Giga-Projects
Projects like NEOM, Qiddiya, and Red Sea Global aren't just construction feats; they are massive brand-building exercises that require world-class storytelling and technological innovation.

### A Young, Digital-First Population
With 70% of the population under 35, marketing in KSA requires a mobile-first, socially-driven approach. Snap, TikTok, and YouTube remain the dominant arenas for consumer attention.

### Cultural Evolution
The opening up of the entertainment and tourism sectors has created entirely new categories for brand activation. Agencies must be sensitive to the cultural heritage of the Kingdom while embracing its future-forward aspirations.`,
    author: {
      name: "Omar Khalil",
      role: "Strategy Director",
      avatarSeed: "omar"
    }
  },
  {
    slug: "bilingual-content-strategy",
    title: "Bilingual content strategy that actually performs in Arabic",
    excerpt:
      "Translation isn't enough. A practical framework for AR/EN content engines built for organic growth.",
    category: "Content",
    date: "Mar 2025",
    content: `Many brands in the MENA region treat Arabic content as a "check-the-box" exercise. They write in English, send it to a translator, and wonder why the engagement is low.

### Think Arabic First
The most successful bilingual strategies start with Arabic cultural insights. This ensures that the metaphors, humor, and tone resonate with the target audience from the outset.

### SEO for the Arabic Web
Arabic SEO is a major growth opportunity. Long-tail keywords in Arabic are often less competitive than their English counterparts, allowing brands to dominate niche categories with high-quality content.

### Video is King
Arabic-speaking audiences consume video at some of the highest rates globally. Short-form video with high-quality Arabic scripting and subtitling is essential for any modern content engine.`,
    author: {
      name: "Yasmin Farouk",
      role: "Head of Design",
      avatarSeed: "yasmin"
    }
  },
  {
    slug: "mena-agency-pricing-2025",
    title: "What MENA agencies actually charge in 2025 — benchmark report",
    excerpt:
      "Median fees by service line, country, and project size based on briefs submitted on Finding MENA.",
    category: "Benchmark",
    date: "Mar 2025",
    content: `Transparency in agency pricing has historically been a challenge in the MENA region. Based on data from over 500 briefs submitted on Finding MENA, we've compiled this 2025 benchmark report.

### Key Findings
- **Strategy & Consulting:** Senior-led strategic projects have seen a 15% increase in day rates as brands seek more specialized regional advice.
- **Digital Production:** Automation and AI have stabilized pricing for standard web and mobile builds, though high-end custom engineering still commands a premium.
- **Creative Services:** Branding and identity remains a high-value category, with boutique studios often outperforming larger networks on price-to-quality ratios.

### Geographic Variations
Dubai remains the most expensive market for talent, but Riyadh is closing the gap as the demand for local expertise skyrockets. Cairo continues to offer the best value for high-quality production and content teams.`,
    author: {
      name: "Karim Saad",
      role: "Engineering Lead",
      avatarSeed: "karim"
    }
  },
];

const baseTeam: TeamMember[] = [
  { name: "Layla Hassan", role: "Managing Partner", initials: "LH" },
  { name: "Omar Khalil", role: "Strategy Director", initials: "OK" },
  { name: "Yasmin Farouk", role: "Head of Design", initials: "YF" },
  { name: "Karim Saad", role: "Engineering Lead", initials: "KS" },
];

const baseReviews = (agency: string): Review[] => [
  {
    author: "Mohammed Al-Rashid",
    company: "Emirates Capital Group",
    rating: 5,
    date: "2024-09",
    excerpt: `${agency} delivered a strategy that completely reframed our regional positioning. Senior team stayed engaged throughout.`,
  },
  {
    author: "Sara Mansour",
    company: "Cairo Health Network",
    rating: 5,
    date: "2024-07",
    excerpt:
      "Exceptional craft and operational discipline. Milestones were hit consistently and the work is performing in-market.",
  },
  {
    author: "Nasser Al-Thani",
    company: "Doha Sports Authority",
    rating: 4,
    date: "2024-05",
    excerpt:
      "Strong regional expertise. Bilingual deliverables were on point. Onboarding could have been a touch faster.",
  },
];

export const AGENCIES: Agency[] = [
  {
    slug: "altaris-consulting",
    name: "Altaris Consulting",
    tagline: "Corporate strategy for MENA institutions",
    description:
      "Altaris partners with banks, sovereign funds, and listed corporates on market entry, restructuring, and post-merger integration. Senior-led teams across Dubai and Riyadh.",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    founded: 2014,
    teamSize: "50–100",
    minBudget: 150_000,
    rating: 4.9,
    reviewCount: 47,
    services: ["Strategy & Consulting", "Marketing"],
    industries: ["Finance & Banking", "Real Estate", "Energy"],
    logoSeed: "altaris",
    coverSeed: "altaris-c",
    featured: true,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "GCC Market Entry Framework",
        client: "European Asset Manager",
        category: "Strategy & Consulting",
        imageSeed: "alt-p1",
        summary: "Multi-jurisdiction entry plan covering UAE, KSA, and Qatar.",
      },
      {
        title: "Post-Merger Integration",
        client: "Regional Bank",
        category: "Strategy & Consulting",
        imageSeed: "alt-p2",
        summary: "Operating model redesign across 1,200 staff.",
      },
      {
        title: "Sovereign Fund Positioning",
        client: "Confidential",
        category: "Marketing",
        imageSeed: "alt-p3",
        summary: "Global investor narrative and IR collateral.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Altaris"),
  },
  {
    slug: "vanguard-digital",
    name: "Vanguard Digital",
    tagline: "Enterprise engineering for the public sector",
    description:
      "Vanguard builds secure, scalable digital products for governments and large enterprises across the Gulf, with deep expertise in cloud architecture and bilingual UX.",
    city: "Riyadh",
    country: "Saudi Arabia",
    countryCode: "SA",
    founded: 2017,
    teamSize: "100–250",
    minBudget: 75_000,
    rating: 4.8,
    reviewCount: 63,
    services: ["Web Development", "Mobile Development", "Strategy & Consulting"],
    industries: ["Government", "Finance & Banking", "Healthcare"],
    logoSeed: "vanguard",
    coverSeed: "vanguard-c",
    featured: true,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "National Health Portal",
        client: "Ministry of Health",
        category: "Web Development",
        imageSeed: "van-p1",
        summary: "Citizen-facing portal serving 8M monthly users.",
      },
      {
        title: "Banking Mobile Suite",
        client: "Tier-1 KSA Bank",
        category: "Mobile Development",
        imageSeed: "van-p2",
        summary: "Native iOS and Android apps with biometric onboarding.",
      },
      {
        title: "Cloud Migration Program",
        client: "Logistics Authority",
        category: "Strategy & Consulting",
        imageSeed: "van-p3",
        summary: "Migration of 140 legacy systems to a sovereign cloud.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Vanguard"),
  },
  {
    slug: "oasis-performance",
    name: "Oasis Performance",
    tagline: "Performance marketing for D2C scale-ups",
    description:
      "Oasis runs aggressive paid media, lifecycle, and CRO programs for venture-backed e-commerce and consumer brands across Egypt, the UAE, and KSA.",
    city: "Cairo",
    country: "Egypt",
    countryCode: "EG",
    founded: 2019,
    teamSize: "20–50",
    minBudget: 25_000,
    rating: 4.7,
    reviewCount: 89,
    services: ["Performance & Paid Media", "Marketing", "SEO & Content"],
    industries: ["Retail & E-commerce", "Technology & SaaS", "Hospitality & Travel"],
    logoSeed: "oasis",
    coverSeed: "oasis-c",
    featured: true,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Series-B Acquisition Engine",
        client: "Regional Marketplace",
        category: "Performance & Paid Media",
        imageSeed: "oas-p1",
        summary: "3.2x ROAS lift over 9 months, $14M ad spend managed.",
      },
      {
        title: "Lifecycle & Retention",
        client: "Beauty D2C",
        category: "Marketing",
        imageSeed: "oas-p2",
        summary: "+38% repeat purchase rate via email + WhatsApp flows.",
      },
      {
        title: "Bilingual SEO Program",
        client: "Travel OTA",
        category: "SEO & Content",
        imageSeed: "oas-p3",
        summary: "AR/EN content engine producing 200+ articles per quarter.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Oasis"),
  },
  {
    slug: "majlis-brand-studio",
    name: "Majlis Brand Studio",
    tagline: "Identity systems rooted in regional craft",
    description:
      "A boutique branding studio building identities for cultural institutions, hospitality brands, and family offices across the GCC and Levant.",
    city: "Doha",
    country: "Qatar",
    countryCode: "QA",
    founded: 2016,
    teamSize: "10–20",
    minBudget: 50_000,
    rating: 4.9,
    reviewCount: 34,
    services: ["Branding", "Creative & Design"],
    industries: ["Hospitality & Travel", "Real Estate", "Media & Entertainment"],
    logoSeed: "majlis",
    coverSeed: "majlis-c",
    featured: true,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Museum Identity System",
        client: "National Museum",
        category: "Branding",
        imageSeed: "maj-p1",
        summary: "Bilingual identity, signage, and editorial system.",
      },
      {
        title: "Boutique Hotel Group",
        client: "Confidential",
        category: "Branding",
        imageSeed: "maj-p2",
        summary: "Master brand and 4 sub-brand identities across the GCC.",
      },
      {
        title: "Cultural Festival",
        client: "Doha Cultural Authority",
        category: "Creative & Design",
        imageSeed: "maj-p3",
        summary: "Campaign system spanning OOH, digital, and spatial.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Majlis"),
  },
  {
    slug: "nexus-ventures-studio",
    name: "Nexus Ventures Studio",
    tagline: "Product studio for fintech and SaaS",
    description:
      "We design and ship venture-grade products for early and growth-stage tech companies. Embedded squads of designers, engineers, and PMs.",
    city: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    founded: 2020,
    teamSize: "20–50",
    minBudget: 60_000,
    rating: 4.8,
    reviewCount: 52,
    services: ["Web Development", "Mobile Development", "Creative & Design"],
    industries: ["Technology & SaaS", "Finance & Banking"],
    logoSeed: "nexus",
    coverSeed: "nexus-c",
    featured: false,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Fintech MVP in 12 weeks",
        client: "Series-A Startup",
        category: "Web Development",
        imageSeed: "nex-p1",
        summary: "0 to 1 platform launch with embedded engineering squad.",
      },
      {
        title: "B2B SaaS Redesign",
        client: "HR Tech Company",
        category: "Creative & Design",
        imageSeed: "nex-p2",
        summary: "End-to-end redesign that lifted activation by 41%.",
      },
      {
        title: "Mobile Wallet",
        client: "Confidential",
        category: "Mobile Development",
        imageSeed: "nex-p3",
        summary: "Cross-platform wallet with KYC and instant transfers.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Nexus"),
  },
  {
    slug: "sahara-content-co",
    name: "Sahara Content Co.",
    tagline: "Bilingual content & SEO at scale",
    description:
      "Bilingual editorial team producing high-intent SEO content, thought leadership, and PR for brands targeting Arabic and English audiences.",
    city: "Amman",
    country: "Jordan",
    countryCode: "JO",
    founded: 2018,
    teamSize: "10–20",
    minBudget: 15_000,
    rating: 4.6,
    reviewCount: 71,
    services: ["SEO & Content", "Marketing"],
    industries: ["Technology & SaaS", "Healthcare", "Education"],
    logoSeed: "sahara",
    coverSeed: "sahara-c",
    featured: false,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Arabic SEO Engine",
        client: "Regional EdTech",
        category: "SEO & Content",
        imageSeed: "sah-p1",
        summary: "+312% organic sessions in 11 months across AR/EN.",
      },
      {
        title: "Thought Leadership Program",
        client: "Healthtech Scale-up",
        category: "Marketing",
        imageSeed: "sah-p2",
        summary: "Weekly long-form content driving inbound enterprise leads.",
      },
      {
        title: "PR & Earned Media",
        client: "Series-B SaaS",
        category: "Marketing",
        imageSeed: "sah-p3",
        summary: "Top-tier coverage in 14 regional and global outlets.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Sahara"),
  },
  {
    slug: "atlas-creative-house",
    name: "Atlas Creative House",
    tagline: "Campaigns that travel the region",
    description:
      "Integrated creative agency producing campaigns, films, and brand experiences for retail, hospitality, and government clients across MENA.",
    city: "Casablanca",
    country: "Morocco",
    countryCode: "MA",
    founded: 2012,
    teamSize: "50–100",
    minBudget: 40_000,
    rating: 4.7,
    reviewCount: 58,
    services: ["Creative & Design", "Branding", "Marketing"],
    industries: ["Retail & E-commerce", "Hospitality & Travel", "Government"],
    logoSeed: "atlas",
    coverSeed: "atlas-c",
    featured: false,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Pan-MENA Retail Campaign",
        client: "Global FMCG",
        category: "Creative & Design",
        imageSeed: "atl-p1",
        summary: "Localized creative across 9 markets, OOH and digital.",
      },
      {
        title: "Tourism Board Repositioning",
        client: "National Tourism",
        category: "Branding",
        imageSeed: "atl-p2",
        summary: "New visual system and global launch film.",
      },
      {
        title: "Loyalty Program Launch",
        client: "Hotel Group",
        category: "Marketing",
        imageSeed: "atl-p3",
        summary: "End-to-end launch program across 12 properties.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Atlas"),
  },
  {
    slug: "phoenix-growth-labs",
    name: "Phoenix Growth Labs",
    tagline: "Growth engineering for ambitious founders",
    description:
      "We embed product, growth, and analytics talent into early-stage teams to accelerate activation, retention, and revenue.",
    city: "Manama",
    country: "Bahrain",
    countryCode: "BH",
    founded: 2021,
    teamSize: "10–20",
    minBudget: 20_000,
    rating: 4.8,
    reviewCount: 29,
    services: ["Performance & Paid Media", "Strategy & Consulting", "Web Development"],
    industries: ["Technology & SaaS", "Retail & E-commerce"],
    logoSeed: "phoenix",
    coverSeed: "phoenix-c",
    featured: false,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Activation Overhaul",
        client: "Seed-stage SaaS",
        category: "Strategy & Consulting",
        imageSeed: "phx-p1",
        summary: "Activation rate from 18% to 47% in 6 weeks.",
      },
      {
        title: "Paid Acquisition Sprint",
        client: "DTC Brand",
        category: "Performance & Paid Media",
        imageSeed: "phx-p2",
        summary: "CAC reduced 38% while scaling spend 4x.",
      },
      {
        title: "Pricing Experiments",
        client: "B2B SaaS",
        category: "Strategy & Consulting",
        imageSeed: "phx-p3",
        summary: "Tiered pricing redesign lifted ARPU by 22%.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Phoenix"),
  },
  {
    slug: "cedar-strategy-partners",
    name: "Cedar Strategy Partners",
    tagline: "Boutique consulting for family business",
    description:
      "Cedar advises family conglomerates and mid-market enterprises on governance, succession, and growth strategy across the Levant and GCC.",
    city: "Beirut",
    country: "Lebanon",
    countryCode: "LB",
    founded: 2010,
    teamSize: "20–50",
    minBudget: 90_000,
    rating: 4.9,
    reviewCount: 41,
    services: ["Strategy & Consulting"],
    industries: ["Real Estate", "Retail & E-commerce", "Energy"],
    logoSeed: "cedar",
    coverSeed: "cedar-c",
    featured: false,
    verified: true,
    plan: "Growth",
    portfolio: [
      {
        title: "Family Governance Charter",
        client: "Tier-1 Family Office",
        category: "Strategy & Consulting",
        imageSeed: "ced-p1",
        summary: "Multi-generational governance framework.",
      },
      {
        title: "5-Year Growth Plan",
        client: "Regional Conglomerate",
        category: "Strategy & Consulting",
        imageSeed: "ced-p2",
        summary: "Portfolio rationalization and capital reallocation.",
      },
      {
        title: "Succession Roadmap",
        client: "Confidential",
        category: "Strategy & Consulting",
        imageSeed: "ced-p3",
        summary: "Leadership transition over a 36-month horizon.",
      },
    ],
    team: baseTeam,
    reviews: baseReviews("Cedar"),
  },
];

export function getAgencyBySlug(slug: string): Agency | undefined {
  return AGENCIES.find((a) => a.slug === slug);
}

// Mock client + projects for dashboards
export interface ClientProject {
  id: string;
  title: string;
  status: "Matching" | "In Review" | "Active" | "Closed";
  services: ServiceCategory[];
  budget: BudgetTier;
  country: Country;
  industry: Industry;
  createdAt: string;
  matchedAgencies: string[]; // slugs
}

export const MOCK_PROJECTS: ClientProject[] = [
  {
    id: "PRJ-2049",
    title: "Rebrand for hospitality group",
    status: "Matching",
    services: ["Branding", "Creative & Design"],
    budget: "75k-150k",
    country: "United Arab Emirates",
    industry: "Hospitality & Travel",
    createdAt: "2025-04-12",
    matchedAgencies: ["majlis-brand-studio", "atlas-creative-house", "altaris-consulting"],
  },
  {
    id: "PRJ-2048",
    title: "Fintech mobile app — KSA market",
    status: "In Review",
    services: ["Mobile Development", "Web Development"],
    budget: "150k-500k",
    country: "Saudi Arabia",
    industry: "Finance & Banking",
    createdAt: "2025-04-08",
    matchedAgencies: ["vanguard-digital", "nexus-ventures-studio"],
  },
  {
    id: "PRJ-2047",
    title: "Performance marketing scale-up",
    status: "Active",
    services: ["Performance & Paid Media"],
    budget: "25k-75k",
    country: "Egypt",
    industry: "Retail & E-commerce",
    createdAt: "2025-03-20",
    matchedAgencies: ["oasis-performance", "phoenix-growth-labs"],
  },
];

export interface AgencyLead {
  id: string;
  projectTitle: string;
  client: string;
  budget: BudgetTier;
  services: ServiceCategory[];
  country: Country;
  status: "New" | "Quoted" | "In Conversation" | "Won" | "Lost";
  receivedAt: string;
}

export const MOCK_LEADS: AgencyLead[] = [
  {
    id: "LD-7782",
    projectTitle: "Series-B fintech rebrand",
    client: "Confidential",
    budget: "75k-150k",
    services: ["Branding", "Creative & Design"],
    country: "United Arab Emirates",
    status: "New",
    receivedAt: "2025-04-15",
  },
  {
    id: "LD-7781",
    projectTitle: "E-commerce site rebuild",
    client: "Regional FMCG",
    budget: "150k-500k",
    services: ["Web Development"],
    country: "Saudi Arabia",
    status: "Quoted",
    receivedAt: "2025-04-13",
  },
  {
    id: "LD-7780",
    projectTitle: "GCC market entry strategy",
    client: "European SaaS",
    budget: "150k-500k",
    services: ["Strategy & Consulting"],
    country: "United Arab Emirates",
    status: "In Conversation",
    receivedAt: "2025-04-10",
  },
];

// Simple rules-based matching
export interface BriefInput {
  services: ServiceCategory[];
  budget: BudgetTier;
  country: Country;
  industry: Industry;
}

export function matchAgencies(brief: BriefInput, limit = 6): { agency: Agency; score: number }[] {
  const tier = BUDGET_TIERS.find((b) => b.id === brief.budget)!;
  const scored = AGENCIES.map((agency) => {
    let score = 0;
    // Service overlap (50%)
    const serviceOverlap = agency.services.filter((s) => brief.services.includes(s)).length;
    if (brief.services.length > 0) {
      score += (serviceOverlap / brief.services.length) * 50;
    }
    // Budget compatibility (25%) — agency min must be <= upper budget
    if (agency.minBudget <= tier.max) score += 25;
    // Country priority (15%)
    if (agency.country === brief.country) score += 15;
    else score += 5; // any MENA still gets partial
    // Industry experience (10%)
    if (agency.industries.includes(brief.industry)) score += 10;
    return { agency, score };
  });
  return scored
    .filter((s) => s.score > 20)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
