import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config({ path: "c:/Users/techd/.gemini/antigravity/scratch/server/.env" });

import Project from "./models/Project.js";
import Agency from "./models/Agency.js";
import { calculateMatchScore } from "./lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

const BUDGET_MAX = {
  "<25k": 25000,
  "25k-75k": 75000,
  "75k-150k": 150000,
  "150k-500k": 500000,
  "500k+": Infinity,
};

function explainScore(project, agency) {
  const projectServices = project.services || [];
  const agencyServices = agency.services || [];
  
  const overlap = agencyServices.filter((s) => projectServices.includes(s)).length;
  
  let details = [];
  let score = 0;

  if (projectServices.length > 0 && overlap === 0) {
    return { score: 0, details: ["Disqualified: No service overlap"] };
  }

  if (projectServices.length > 0) {
    const serviceScore = (overlap / projectServices.length) * 50;
    score += serviceScore;
    details.push(`Services overlap: ${overlap}/${projectServices.length} (+${serviceScore.toFixed(1)} pts)`);
  }

  const cap = BUDGET_MAX[project.budget] ?? Infinity;
  if ((agency.minBudget ?? 0) <= cap) {
    score += 25;
    details.push(`Budget match: agency minBudget ${agency.minBudget} <= project cap ${cap} (+25.0 pts)`);
  } else {
    details.push(`Budget mismatch: agency minBudget ${agency.minBudget} > project cap ${cap} (+0.0 pts)`);
  }

  if (agency.country === project.country) {
    score += 15;
    details.push(`Country match: "${agency.country}" (+15.0 pts)`);
  } else {
    score += 5;
    details.push(`Country mismatch: "${agency.country}" vs "${project.country}" (+5.0 pts)`);
  }

  if (project.industry && (agency.industries || []).includes(project.industry)) {
    score += 10;
    details.push(`Industry match: "${project.industry}" (+10.0 pts)`);
  } else {
    details.push(`Industry mismatch: "${project.industry}" not in ${JSON.stringify(agency.industries)} (+0.0 pts)`);
  }

  // Quality boost: Add up to 10 points based on rating (e.g., 5.0 rating = 10 pts)
  if (agency.rating) {
    const ratingScore = agency.rating * 2;
    score += ratingScore;
    details.push(`Rating boost: rating ${agency.rating} (+${ratingScore.toFixed(1)} pts)`);
  } else {
    details.push(`Rating boost: no rating (+0.0 pts)`);
  }

  // Plan tier boost: Growth (paid) gets +15, Starter (free) +0
  if (agency.plan === "Growth") {
    score += 15;
    details.push(`Plan boost: Growth (+15.0 pts)`);
  } else {
    details.push(`Plan boost: None (+0.0 pts)`);
  }

  // Service match density boost: extra points if the agency matches more of the requested services
  if (projectServices.length > 0) {
    const densityScore = (overlap / projectServices.length) * 10;
    score += densityScore;
    details.push(`Service density boost: +${densityScore.toFixed(1)} pts`);
  }

  return { score: Math.round(score * 10) / 10, details };
}

async function check() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB Atlas");

  // Find project ending in 861ef0 or title matching and budget 500k+
  const project = await Project.findOne({ 
    $or: [
      { _id: new mongoose.Types.ObjectId("6a3b6a007efe1e38886a81ef") },
      { title: /Velsec/, budget: "500k+" }
    ]
  }).populate("matchedAgencies");

  if (!project) {
    console.log("Project not found!");
    // List all Velsec projects to be sure
    const velsecProjects = await Project.find({ title: /Velsec/ });
    console.log("Available Velsec projects in DB:");
    velsecProjects.forEach(p => console.log(` - ID: ${p._id}, Title: "${p.title}", Budget: "${p.budget}"`));
    await mongoose.disconnect();
    return;
  }

  console.log("\nFound Project:", {
    _id: project._id,
    title: project.title,
    services: project.services,
    budget: project.budget,
    country: project.country,
    industry: project.industry
  });

  const matched = project.matchedAgencies;
  console.log(`\nMatched Agencies (${matched.length}):`);
  
  const explanations = [];
  for (const a of matched) {
    const { score, details } = explainScore(project, a);
    explanations.push({
      name: a.name,
      slug: a.slug,
      rating: a.rating,
      plan: a.plan,
      score,
      details
    });
  }

  // Sort by score desc, then by rating desc
  explanations.sort((a, b) => b.score - a.score || b.rating - a.rating);

  explanations.forEach((exp, idx) => {
    console.log(`\n[#${idx + 1}] ${exp.name} (${exp.slug}) - Calculated Score: ${exp.score}`);
    console.log(`  - Rating: ${exp.rating}, Plan: ${exp.plan}`);
    exp.details.forEach(d => console.log(`    * ${d}`));
  });

  await mongoose.disconnect();
}

check().catch(console.error);
