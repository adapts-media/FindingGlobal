import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/techd/.gemini/antigravity/scratch/server/.env" });

import Project from "./models/Project.js";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const projects = await Project.find({}).populate("matchedAgencies");
  console.log(`\nFound ${projects.length} projects:`);
  projects.forEach((p, idx) => {
    console.log(`\nProject #${idx + 1}:`);
    console.log({
      _id: p._id,
      title: p.title,
      services: p.services,
      budget: p.budget,
      country: p.country,
      industry: p.industry,
      status: p.status
    });
    console.log("Matched agencies:");
    p.matchedAgencies.forEach(a => {
      console.log(`  - Name: ${a.name}, Slug: ${a.slug}, Services: ${JSON.stringify(a.services)}, Country: "${a.country}"`);
    });
  });

  await mongoose.disconnect();
}

check().catch(console.error);
