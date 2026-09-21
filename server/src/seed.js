import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import Agency from "./models/Agency.js";
import User from "./models/User.js";
import { AGENCIES } from "./seed-data.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

const DELIVERABLE_BANK = {
  "Strategy & Consulting": [
    "Market sizing & competitive landscape",
    "Operating model & org design",
    "90-day execution roadmap",
    "Board-ready strategy deck",
  ],
  Marketing: [
    "Quarterly campaign calendar",
    "Channel mix & media plan",
    "Creative asset production",
    "Performance dashboard",
  ],
  Branding: [
    "Brand strategy & narrative",
    "Visual identity system",
    "Brand guidelines (60+ pages)",
    "Launch toolkit",
  ],
  "Web Development": [
    "Technical architecture",
    "Design system & component library",
    "Production web build",
    "Analytics & SEO setup",
  ],
  "Mobile Development": [
    "iOS & Android native apps",
    "Backend APIs & infrastructure",
    "Release pipeline & QA",
    "Post-launch support runbook",
  ],
  "Creative & Design": [
    "Concept development",
    "Photography & art direction",
    "Production-ready assets",
    "Localization across 3 languages",
  ],
  "SEO & Content": [
    "Keyword & topic strategy",
    "Editorial calendar",
    "Long-form content production",
    "Technical SEO audit & fixes",
  ],
  "Performance & Paid Media": [
    "Account structure & tracking setup",
    "Creative testing framework",
    "Weekly optimization cadence",
    "Attribution & LTV reporting",
  ],
};

const RESULTS_BANK = [
  "+38% qualified pipeline in the first quarter",
  "Time-to-launch reduced from 9 months to 14 weeks",
  "CAC down 27% with stable conversion rate",
  "Brand recall lifted from 12% to 31% in target segment",
  "Net Promoter Score improved by 22 points",
  "Organic traffic doubled within two quarters",
];

function enrich(agency) {
  return {
    ...agency,
    portfolio: (agency.portfolio || []).map((p, i) => {
      const cat = p.category || agency.services?.[0] || "Strategy & Consulting";
      const deliverables =
        DELIVERABLE_BANK[cat] || DELIVERABLE_BANK["Strategy & Consulting"];
      const industry = agency.industries?.[i % (agency.industries?.length || 1)] || "Technology & SaaS";
      const year = 2023 + (i % 3);
      const timelineWeeks = 8 + ((i * 5) % 18);
      return {
        ...p,
        industry,
        year,
        timeline: `${timelineWeeks} weeks`,
        role: i % 2 === 0 ? "Lead agency" : "Strategic partner",
        description:
          `${agency.name} partnered with ${p.client} to deliver a ${cat.toLowerCase()} engagement focused on ${industry.toLowerCase()}. ` +
          `The team embedded with ${p.client}'s leadership for ${timelineWeeks} weeks, running discovery workshops, shaping the solution, and shipping into production. ` +
          `${p.summary}`,
        deliverables,
        results: [
          RESULTS_BANK[(i * 2) % RESULTS_BANK.length],
          RESULTS_BANK[(i * 2 + 1) % RESULTS_BANK.length],
        ],
        liveUrl: `https://example.com/case-studies/${agency.slug}-${i + 1}`,
      };
    }),
  };
}

async function run() {
  await mongoose.connect(MONGODB_URI);
  console.log("[seed] connected");

  await Agency.deleteMany({});
  await Agency.insertMany(AGENCIES.map(enrich));
  console.log(`[seed] inserted ${AGENCIES.length} agencies`);

  const adminEmail = "admin@findingglobal.com";
  const exists = await User.findOne({ email: adminEmail });
  if (!exists) {
    await User.create({
      email: adminEmail,
      passwordHash: await bcrypt.hash("admin12345", 10),
      name: "Admin",
      role: "admin",
    });
    console.log(`[seed] admin created — ${adminEmail} / admin12345`);
  } else {
    console.log("[seed] admin already exists");
  }

  await mongoose.disconnect();
  console.log("[seed] done");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});