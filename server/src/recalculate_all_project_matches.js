import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/techd/.gemini/antigravity/scratch/server/.env" });

import Project from "./models/Project.js";
import Agency from "./models/Agency.js";
import Lead from "./models/Lead.js";
import { calculateMatchScore, MATCH_THRESHOLD } from "./lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function runMatching({ services = [], budget, country, industry, limit = 10 } = {}) {
  const query = {
    verified: true,
    $or: [
      { country: country },
      { services: { $in: services } }
    ]
  };

  const potentialAgencies = await Agency.find(query)
    .select("_id services minBudget country industries rating plan")
    .lean();
  
  return potentialAgencies
    .map((a) => ({
      id: a._id,
      score: calculateMatchScore({ services, budget, country, industry }, a)
    }))
    .filter((s) => s.score > MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Number(limit) || 10, 20))
    .map((s) => s.id);
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  const projects = await Project.find({ status: "Matching" });
  console.log(`Recalculating matches for ${projects.length} matching projects...`);

  for (const project of projects) {
    console.log(`\nProject: "${project.title}" (${project._id})`);
    console.log(` - Services: ${JSON.stringify(project.services)}, Country: "${project.country}"`);

    const newMatches = await runMatching(project);
    const prevIds = project.matchedAgencies.map(String);
    const newIds = newMatches.map(String);

    const added = newIds.filter((id) => !prevIds.includes(id));
    const removed = prevIds.filter((id) => !newIds.includes(id));

    console.log(` - Prev matched: ${prevIds.length}`);
    console.log(` - New matched: ${newIds.length}`);
    console.log(` - Added matches: ${added.length}`);
    console.log(` - Removed matches: ${removed.length}`);

    // Update Project
    project.matchedAgencies = newMatches;
    await project.save();

    // Sync Leads
    if (added.length) {
      await Lead.insertMany(added.map((agencyId) => ({ project: project._id, agency: agencyId, status: "New", unlocked: false })));
    }
    if (removed.length) {
      await Lead.deleteMany({ project: project._id, agency: { $in: removed }, status: "New" });
    }
  }

  await mongoose.disconnect();
  console.log("\nAll project matches recalculated successfully!");
}

main().catch(console.error);
