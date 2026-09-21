import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

const AUTHORS = [
  "Sarah Jenkins", "Ahmed Al-Mansoor", "Mariam Yasin", "David Smith", "Elena Rostova",
  "Sophia Patel", "Carlos Gomez", "Chloe Laurent", "Tariq Mahmood", "Fatima Al-Harbi"
];
const COMPANIES = [
  "TechCorp", "Innovate LLC", "E-Store", "Al-Futtaim", "Qatar Airways",
  "BioHealth", "SaaSify", "Luxe Fashion"
];
const EXCERPTS = [
  "Exceptional service! They delivered the project on time and exceeded our expectations.",
  "Very professional team. Great communication throughout the campaign.",
  "Highly recommended for digital marketing and branding. They know the MENA market well.",
  "They helped us scale our organic traffic by 150% in just 6 months. Fantastic SEO results!",
  "Great design work. The UI/UX was clean, modern, and exactly what we wanted."
];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026];

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function distributeRatings(count, targetAverage) {
  const targetSum = Math.round(targetAverage * count);
  const ratings = Array(count).fill(5);
  let currentSum = 5 * count;
  
  let attempts = 0;
  while (currentSum > targetSum && attempts < 10000) {
    attempts++;
    const idx = Math.floor(Math.random() * count);
    if (ratings[idx] > 3) {
      ratings[idx]--;
      currentSum--;
    }
  }
  return ratings;
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // 1. Align and clean up Billion Webs first
  const billionUser = await User.findOne({ email: "billion@webs.com" });
  if (billionUser) {
    const currentSlug = billionUser.get("agencySlug") || "billion-webs";
    let billionAgency = await Agency.findOne({
      slug: { $in: [currentSlug, "billion-webs", "billlion-webs"] }
    });

    if (!billionAgency) {
      console.log("Billion Webs agency profile not found. Recreating it...");
      billionAgency = await Agency.create({
        slug: "billion-webs",
        name: "Billion Webs",
        tagline: "Billion Webs is a premium digital agency.",
        city: "Dubai",
        country: "United Arab Emirates",
        countryCode: "AE",
        minBudget: 5000,
        rating: 0,
        reviewCount: 0,
        services: ["Web Development", "Marketing", "SEO & Content"],
        industries: ["Technology & SaaS", "Finance"],
        logoSeed: "billion-webs",
        featured: false,
        verified: true,
        ownerUserId: billionUser._id,
      });
    } else {
      billionAgency.set("slug", "billion-webs");
      billionAgency.set("ownerUserId", billionUser._id);
      billionAgency.set("verified", true);
      await billionAgency.save();
    }
    
    billionUser.set("agencySlug", "billion-webs");
    billionUser.set("role", "agency");
    await billionUser.save();
    console.log("Aligned billion@webs.com user and agency profiles to slug 'billion-webs'.");
  }

  // 2. Define targets
  const targets = [
    { slug: "adapts-media", rating: 4.9 },
    { slug: "genxmedia", rating: 4.7 },
    { slug: "billion-webs", rating: 4.6 }
  ];

  for (const t of targets) {
    const agency = await Agency.findOne({ slug: t.slug });
    if (!agency) {
      console.warn(`Agency not found for slug: ${t.slug}`);
      continue;
    }

    const reviews = agency.get("reviews") || [];
    // Ensure review count is between 25 and 50
    const count = (reviews.length >= 25 && reviews.length <= 50) 
      ? reviews.length 
      : Math.floor(Math.random() * (50 - 25 + 1)) + 25;

    const distributedRatings = distributeRatings(count, t.rating);
    const newReviews = [];

    for (let i = 0; i < count; i++) {
      const rating = distributedRatings[i];
      const existing = reviews[i] || {};
      newReviews.push({
        author: existing.author || getRandom(AUTHORS),
        company: existing.company || getRandom(COMPANIES),
        rating: rating,
        date: existing.date || `${getRandom(MONTHS)} ${getRandom(YEARS)}`,
        excerpt: existing.excerpt || getRandom(EXCERPTS)
      });
    }

    const actualSum = newReviews.reduce((sum, r) => sum + r.rating, 0);
    const actualAverage = Math.round((actualSum / count) * 10) / 10;

    agency.set("reviews", newReviews);
    agency.set("reviewCount", count);
    agency.set("rating", actualAverage);
    await agency.save();

    console.log(`Updated '${agency.get("name")}' (Slug: ${t.slug}):`);
    console.log(` - Review Count: ${count}`);
    console.log(` - Target Rating: ${t.rating}, Actual Average: ${actualAverage}`);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
