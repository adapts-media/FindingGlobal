import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const agencies = await Agency.find({}).sort({ createdAt: 1 });
  console.log(`Total agencies: ${agencies.length}`);
  
  // Group by source: fetched vs original
  const original = agencies.filter(a => a.createdAt < new Date("2026-05-01"));
  const fetched = agencies.filter(a => a.createdAt >= new Date("2026-05-01"));
  
  console.log(`\n--- ORIGINAL/CREATED AGENCIES (${original.length}) ---`);
  original.slice(0, 15).forEach(a => {
    console.log(`- Slug: "${a.slug}" | Name: "${a.name}" | Founded: ${a.founded} | Team: "${a.teamSize}" | Rating: ${a.rating}`);
  });
  
  console.log(`\n--- FETCHED AGENCIES (${fetched.length}) (Showing 15) ---`);
  fetched.slice(0, 15).forEach(a => {
    console.log(`- Slug: "${a.slug}" | Name: "${a.name}" | Founded: ${a.founded} | Team: "${a.teamSize}" | Rating: ${a.rating}`);
  });
  
  await mongoose.disconnect();
}

run();
