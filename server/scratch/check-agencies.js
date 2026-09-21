import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";
import User from "../src/models/User.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  
  const agencies = await Agency.find({}, "name slug ownerUserId plan verified");
  console.log("Agencies with Owners:");
  for (const agency of agencies) {
    if (agency.ownerUserId) {
      const user = await User.findById(agency.ownerUserId);
      const ownerEmail = user ? user.email : "Not Found In User Collection";
      console.log(`- ${agency.name} (${agency.slug}): OwnerId: ${agency.ownerUserId}, Email: ${ownerEmail}, Plan: ${agency.plan}, Verified: ${agency.verified}`);
    }
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
