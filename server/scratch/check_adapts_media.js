import mongoose from "mongoose";
import "dotenv/config";
import Project from "../src/models/Project.js";
import Agency from "../src/models/Agency.js";
import { calculateMatchScore } from "../src/lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  try {
    // 1. Find the project
    const project = await Project.findOne({ title: /Helio AI/i }).populate("matchedAgencies");
    if (!project) {
      console.log("Project not found!");
      return;
    }
    console.log("Project Details:");
    console.log("- ID:", project._id);
    console.log("- Title:", project.title);
    console.log("- Services:", project.services);
    console.log("- Budget:", project.budget);
    console.log("- Country/Market:", project.country);
    console.log("- Industry:", project.industry);
    console.log("- Matched Agencies:", project.matchedAgencies.map(a => a.name));

    // 2. Find Adapts Media
    const adaptsMedia = await Agency.findOne({ name: /Adapts Media/i });
    if (!adaptsMedia) {
      console.log("Adapts Media not found!");
      return;
    }
    console.log("\nAdapts Media Details:");
    console.log("- ID:", adaptsMedia._id);
    console.log("- Name:", adaptsMedia.name);
    console.log("- Verified:", adaptsMedia.verified);
    console.log("- Services:", adaptsMedia.services);
    console.log("- MinBudget:", adaptsMedia.minBudget);
    console.log("- Country:", adaptsMedia.country);
    console.log("- Owner ID:", adaptsMedia.ownerUserId);

    // Calculate score
    const score = calculateMatchScore(project, adaptsMedia);
    console.log("- Calculated Match Score for this project:", score);

    // Is it in the matchedAgencies list?
    const isMatched = project.matchedAgencies.some(a => String(a._id) === String(adaptsMedia._id));
    console.log("- Is currently matched to project:", isMatched);

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
