import mongoose from "mongoose";
import "dotenv/config";
import Project from "../src/models/Project.js";
import Agency from "../src/models/Agency.js";
import { calculateMatchScore, MATCH_THRESHOLD } from "../src/lib/matching.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  try {
    const totalAgencies = await Agency.countDocuments({});
    const verifiedAgencies = await Agency.countDocuments({ verified: true });
    console.log("Total agencies in DB:", totalAgencies);
    console.log("Verified agencies in DB:", verifiedAgencies);

    // Mocking project details
    const project = {
      services: ["Web Development"],
      budget: "500k+",
      country: "All Countries",
      industry: "Technology & SaaS"
    };

    // basic query
    const query = {
      verified: true,
      $or: [
        { country: project.country },
        { services: { $in: project.services } }
      ]
    };
    const potentialAgencies = await Agency.find(query)
      .select("_id name services minBudget country industries verified")
      .lean();

    console.log("Potential agencies matching basic query:", potentialAgencies.length);

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

    const matchingAgencies = scored.filter(s => s.score > MATCH_THRESHOLD);
    console.log("Agencies with score > MATCH_THRESHOLD:", matchingAgencies.length);

    console.log("\nTop 15 scored agencies:");
    scored.sort((a, b) => b.score - a.score);
    scored.slice(0, 15).forEach((s, idx) => {
      console.log(`${idx + 1}. ${s.name} (Score: ${s.score}) | Country: ${s.country} | MinBudget: ${s.minBudget} | Services: [${s.services.join(", ")}]`);
    });

  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
