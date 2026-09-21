import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("MONGODB_URI not found in environment");
  process.exit(1);
}

const FEATURED_SLUGS = ["adapts-media", "thegenxmedia"];

async function cleanup() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB");

    // 1. Update target agencies to be featured
    const updateResult = await Agency.updateMany(
      { slug: { $in: FEATURED_SLUGS } },
      { $set: { featured: true, verified: true, plan: "Growth" } }
    );
    console.log(`Updated ${updateResult.modifiedCount} agencies to Featured.`);

    // 2. Delete all other agencies
    const deleteResult = await Agency.deleteMany({
      slug: { $nin: FEATURED_SLUGS }
    });
    console.log(`Deleted ${deleteResult.deletedCount} seed agencies.`);

    // 3. List remaining agencies to confirm
    const remaining = await Agency.find({}, "name slug featured");
    console.log("\nRemaining Agencies:");
    remaining.forEach(a => console.log(`- ${a.name} (${a.slug}) [Featured: ${a.featured}]`));

  } catch (error) {
    console.error("Cleanup failed:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

cleanup();
