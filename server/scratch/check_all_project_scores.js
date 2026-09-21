import mongoose from "mongoose";
import "dotenv/config";
import Project from "../src/models/Project.js";
import Agency from "../src/models/Agency.js";
import { calculateMatchScore } from "../src/lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  try {
    const project = await Project.findOne({ title: /Helio AI/i });
    if (!project) {
      console.log("Project not found!");
      return;
    }

    const potentialAgencies = await Agency.find({ verified: true })
      .select("_id name services minBudget country industries verified")
      .lean();

    const scored = potentialAgencies.map((a) => {
      const score = calculateMatchScore(project, a);
      return {
        name: a.name,
        country: a.country,
        services: a.services,
        minBudget: a.minBudget,
        score
      };
    });

    console.log("Top 15 scored agencies for this project:");
    scored.sort((a, b) => b.score - a.score);
    scored.slice(0, 15).forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.name} (Score: ${s.score.toFixed(2)}) | Country: ${s.country} | Services: [${s.services.join(", ")}]`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
