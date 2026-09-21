import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // 1. Find user adapts@media.com
  const adaptsUser = await User.findOne({ email: "adapts@media.com" });
  if (!adaptsUser) {
    console.error("User adapts@media.com not found!");
    await mongoose.disconnect();
    process.exit(1);
  }

  const adaptsUserId = adaptsUser._id;
  console.log(`Found adapts@media.com user (ID: ${adaptsUserId})`);

  // 2. Ensure adapts-media agency exists and is featured
  let adaptsAgency = await Agency.findOne({ slug: "adapts-media" });
  if (!adaptsAgency) {
    console.log("Recreating adapts-media agency profile...");
    adaptsAgency = await Agency.create({
      slug: "adapts-media",
      name: "Adapts Media",
      tagline: "Adapts Media is a results-driven digital marketing agency.",
      city: "Dubai",
      country: "United Arab Emirates",
      countryCode: "AE",
      minBudget: 5000,
      rating: 0,
      reviewCount: 0,
      services: ["Marketing", "Branding", "SEO & Content", "Performance & Paid Media"],
      industries: ["Technology & SaaS", "Healthcare", "Finance"],
      logoSeed: "adapts-media",
      featured: true,
      verified: true,
      ownerUserId: adaptsUserId,
    });
    console.log("Created adapts-media agency.");
  } else {
    console.log("Adapts Media agency exists. Updating it to be featured & verified...");
    adaptsAgency.set("featured", true);
    adaptsAgency.set("verified", true);
    adaptsAgency.set("ownerUserId", adaptsUserId);
    await adaptsAgency.save();
    console.log("Updated adapts-media agency.");
  }

  // Ensure adaptsUser is linked to adapts-media
  adaptsUser.set("agencySlug", "adapts-media");
  adaptsUser.set("role", "agency");
  await adaptsUser.save();
  console.log("Linked adapts@media.com user to adapts-media.");

  // 3. Ensure genxmedia agency is featured
  const genxAgency = await Agency.findOne({ slug: "genxmedia" });
  if (genxAgency) {
    genxAgency.set("featured", true);
    genxAgency.set("verified", true);
    await genxAgency.save();
    console.log("Set genxmedia agency as featured & verified.");
  } else {
    console.warn("genxmedia agency not found!");
  }

  // 4. Remove featured status from all other agencies
  const updateOthers = await Agency.updateMany(
    { slug: { $nin: ["adapts-media", "genxmedia"] } },
    { $set: { featured: false } }
  );
  console.log(`Removed featured status from ${updateOthers.modifiedCount} other agencies.`);

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch(console.error);
