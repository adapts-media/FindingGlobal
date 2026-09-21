import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("[reset] Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("[reset] Connected to DB:", MONGODB_URI);

  console.log("[reset] Resetting reviews, awards, rating, and reviewCount for all agencies...");
  const result = await Agency.updateMany(
    {},
    {
      $set: {
        reviews: [],
        awards: [],
        rating: 0,
        reviewCount: 0
      }
    }
  );

  console.log(`[reset] Successfully updated ${result.matchedCount} agencies.`);
  await mongoose.disconnect();
}

run().catch(err => {
  console.error("[reset] Fatal error:", err);
  process.exit(1);
});
