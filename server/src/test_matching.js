import mongoose from "mongoose";
import "dotenv/config";
import Project from "./models/Project.js";
import Agency from "./models/Agency.js";
import { calculateMatchScore } from "./lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function test() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const project = await Project.findOne({ title: "Velsec — Web Development", budget: "150k-500k" });
  if (!project) {
    console.log("Project not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("Testing matches for Project:", {
    title: project.title,
    services: project.services,
    budget: project.budget,
    country: project.country,
    industry: project.industry
  });

  const agencies = await Agency.find({});
  console.log(`\nScores for all ${agencies.length} agencies:`);
  agencies.forEach(a => {
    const score = calculateMatchScore(project, a);
    console.log(`- ${a.name} (${a.slug}): Score = ${score}`);
    console.log(`  - Country: "${a.country}", Services: ${JSON.stringify(a.services)}, MinBudget: ${a.minBudget}`);
  });

  await mongoose.disconnect();
}

test().catch(console.error);
