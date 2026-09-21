import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const agencies = await Agency.find({ "awards.0": { $exists: true } });
  console.log(`Found ${agencies.length} agencies with awards:`);
  for (const a of agencies) {
    console.log(`- ${a.name} (${a.slug}): ${a.awards.length} awards`);
  }
  await mongoose.disconnect();
}

run();
