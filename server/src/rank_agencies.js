import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/techd/.gemini/antigravity/scratch/server/.env" });

import Project from "./models/Project.js";
import Agency from "./models/Agency.js";
import { calculateMatchScore } from "./lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const project = await Project.findOne({ title: "Velsec — Web Development", budget: "75k-150k" });
  if (!project) {
    console.log("Project not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("Project Details:", {
    title: project.title,
    services: project.services,
    budget: project.budget,
    country: project.country,
    industry: project.industry
  });

  const agencies = await Agency.find({ verified: true });
  const scored = agencies.map(a => {
    const score = calculateMatchScore(project, a);
    return {
      name: a.name,
      slug: a.slug,
      services: a.services,
      rating: a.rating,
      reviewCount: a.reviewCount,
      plan: a.plan,
      score: score
    };
  });

  // Sort by score desc
  scored.sort((a, b) => b.score - a.score);

  console.log("\nTop 15 Matched Agencies under current logic:");
  scored.slice(0, 15).forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.name} (${s.slug}) - Score: ${s.score}, Rating: ${s.rating}, Plan: ${s.plan}, Services: ${JSON.stringify(s.services)}`);
  });

  // Calculate new score with rating and plan boosts
  const scoredNew = agencies.map(a => {
    let score = calculateMatchScore(project, a);
    if (score > 0) {
      // Add rating boost: up to 10 points for a 5.0 rating
      score += (a.rating || 0) * 2;
      // Add plan boost: Growth (paid) gets +15, Starter (free) +0
      if (a.plan === "Growth") score += 15;
      
      // Let's also check service match density: if the project asks for 2 services,
      // and the agency supports both, they get a boost over an agency that only supports one!
      const overlap = (a.services || []).filter(s => project.services.includes(s)).length;
      if (project.services.length > 0) {
        score += (overlap / project.services.length) * 10;
      }
    }
    return {
      name: a.name,
      slug: a.slug,
      services: a.services,
      rating: a.rating,
      reviewCount: a.reviewCount,
      plan: a.plan,
      score: Math.round(score * 10) / 10
    };
  });

  scoredNew.sort((a, b) => b.score - a.score);

  console.log("\nTop 15 Matched Agencies under proposed logic:");
  scoredNew.slice(0, 15).forEach((s, idx) => {
    console.log(`[${idx + 1}] ${s.name} (${s.slug}) - Score: ${s.score}, Rating: ${s.rating}, Plan: ${s.plan}, Services: ${JSON.stringify(s.services)}`);
  });

  await mongoose.disconnect();
}

check().catch(console.error);
