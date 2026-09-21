import mongoose from "mongoose";

const PortfolioItem = new mongoose.Schema(
  {
    title: String,
    client: String,
    category: String,
    imageSeed: String,
    summary: String,
    description: String,
    deliverables: [String],
    timeline: String,
    year: Number,
    role: String,
    results: [String],
    liveUrl: String,
    industry: String,
  },
  { _id: false }
);
const TeamMember = new mongoose.Schema(
  { name: String, role: String, initials: String },
  { _id: false }
);
const Review = new mongoose.Schema(
  { 
    author: String, 
    company: String, 
    rating: Number, 
    date: String, 
    excerpt: String,
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { _id: false }
);
const Award = new mongoose.Schema(
  { title: String, organization: String, year: Number, category: String },
  { _id: false }
);
const Client = new mongoose.Schema(
  { name: String, industry: String, logoSeed: String },
  { _id: false }
);
const ContactMessage = new mongoose.Schema(
  {
    name: String,
    email: String,
    company: String,
    budget: String,
    message: String,
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AgencySchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    tagline: String,
    description: String,
    website: String,
    city: String,
    country: { type: String, index: true },
    countryCode: String,
    founded: Number,
    teamSize: String,
    minBudget: { type: Number, index: true },
    rating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    services: { type: [String], index: true },
    industries: { type: [String], index: true },
    logoSeed: String,
    coverSeed: String,
    featured: { type: Boolean, default: false, index: true },
    verified: { type: Boolean, default: false },
    // Two plans only: "Starter" (free) and "Growth" (paid, displayed as "FindingGlobal+").
    plan: { type: String, enum: ["Starter", "Growth"], default: "Starter" },
    planExpiresAt: { type: Date },
    planPurchasedAt: { type: Date },
    planBillingPeriod: { type: String, enum: ["monthly", "annual", "none"], default: "none" },
    leadsUsed: { type: Number, default: 0 },
    leadsLimit: { type: Number, default: 3 },
    leadsLastResetDate: { type: Date, default: Date.now },
    portfolio: [PortfolioItem],
    team: [TeamMember],
    teamImage: String,
    teamStory: String,
    reviews: [Review],
    awards: [Award],
    clients: [Client],
    messages: [ContactMessage],
    calendlyLink: String,
    ownerUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model("Agency", AgencySchema);