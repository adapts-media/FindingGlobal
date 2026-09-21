import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // 1. Find user genx@media.com
  const user = await User.findOne({ email: "genx@media.com" });
  if (!user) {
    console.error("User genx@media.com not found in the database!");
    await mongoose.disconnect();
    process.exit(1);
  }

  console.log(`Found user: ${user.email} (ID: ${user._id})`);
  console.log(`Current role: ${user.get("role")}, agencySlug: ${user.get("agencySlug")}`);

  // Force role to be "agency"
  user.set("role", "agency");

  // Determine target slug
  const targetSlug = "genxmedia";

  // Check if an agency with slug "genxmedia" or "thegenxmedia" exists
  let agency = await Agency.findOne({ 
    $or: [
      { slug: targetSlug },
      { slug: "thegenxmedia" }
    ]
  });

  if (agency) {
    console.log(`Found existing agency profile: ${agency.get("name")} (Slug: ${agency.get("slug")})`);
    
    // Ensure slug is exactly targetSlug
    agency.set("slug", targetSlug);
    agency.set("ownerUserId", user._id);
    agency.set("verified", true);
    await agency.save();
    console.log(`Updated existing agency: ownerUserId set to ${user._id}, slug set to ${targetSlug}`);
  } else {
    console.log(`No existing agency profile found for GenXMedia. Creating a new one...`);
    agency = await Agency.create({
      slug: targetSlug,
      name: "TheGenXMedia",
      tagline: "",
      city: "",
      country: "",
      countryCode: "",
      minBudget: 0,
      rating: 0,
      reviewCount: 0,
      services: [],
      industries: [],
      logoSeed: targetSlug,
      featured: false,
      verified: true,
      ownerUserId: user._id,
    });
    console.log(`Created new agency profile with slug: ${targetSlug}`);
  }

  // Update user's agencySlug
  user.set("agencySlug", targetSlug);
  await user.save();
  console.log(`Updated user's agencySlug to ${targetSlug}`);

  await mongoose.disconnect();
  console.log("Database connection closed. Done!");
}

run().catch(console.error);
