import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // Find all agencies currently in DB
  const allAgenciesBefore = await Agency.find({}).select("name slug featured");
  console.log("Current agencies in database:");
  for (const a of allAgenciesBefore) {
    console.log(`- Name: ${a.get("name")}, Slug: ${a.get("slug")}, Featured: ${a.get("featured")}`);
  }

  // Set featured: true for genxmedia and adapts-media
  const featuredResult = await Agency.updateMany(
    { slug: { $in: ["genxmedia", "adapts-media"] } },
    { $set: { featured: true } }
  );
  console.log(`Set featured to true for ${featuredResult.modifiedCount} agencies.`);

  // Set featured: false for all other agencies
  const unfeaturedResult = await Agency.updateMany(
    { slug: { $nin: ["genxmedia", "adapts-media"] } },
    { $set: { featured: false } }
  );
  console.log(`Set featured to false for ${unfeaturedResult.modifiedCount} other agencies.`);

  // Print updated list
  const allAgenciesAfter = await Agency.find({}).select("name slug featured");
  console.log("\nUpdated agencies list:");
  for (const a of allAgenciesAfter) {
    console.log(`- Name: ${a.get("name")}, Slug: ${a.get("slug")}, Featured: ${a.get("featured")}`);
  }

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch(console.error);
