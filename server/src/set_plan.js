import mongoose from "mongoose";
import Agency from "./models/Agency.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function setPlan(slug, plan) {
  if (!["Starter", "Growth"].includes(plan)) {
    console.error("Invalid plan. Use: Starter or Growth");
    process.exit(1);
  }

  await mongoose.connect(MONGODB_URI);
  console.log(`Connecting to ${MONGODB_URI}...`);

  const agency = await Agency.findOneAndUpdate(
    { slug },
    { 
      plan, 
      leadsLimit: plan === "Starter" ? 3 : 9999,
      verified: plan !== "Starter" // Auto-verify if upgraded
    },
    { new: true }
  );

  if (agency) {
    console.log(`✅ Success! ${agency.name} is now on the ${plan} plan.`);
    console.log(`   Leads limit: ${agency.leadsLimit}`);
    console.log(`   Verified: ${agency.verified}`);
  } else {
    console.error(`❌ Agency with slug "${slug}" not found.`);
  }

  await mongoose.connection.close();
}

const [,, slug, plan] = process.argv;

if (!slug || !plan) {
  console.log("Usage: node src/set_plan.js <agency-slug> <PlanName>");
  console.log("Example: node src/set_plan.js ishant-sharma-agency Growth");
  process.exit(1);
}

setPlan(slug, plan);
