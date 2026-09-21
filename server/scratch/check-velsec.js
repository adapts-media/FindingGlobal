import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);

  const agency = await Agency.findOne({ slug: "velsec" });
  if (!agency) {
    console.error("Velsec agency not found!");
  } else {
    console.log("Agency Name:", agency.name);
    console.log("Slug:", agency.slug);
    console.log("Plan:", agency.plan);
    console.log("Billing Period:", agency.planBillingPeriod);
    console.log("Expires At:", agency.planExpiresAt);
    console.log("Leads Limit:", agency.leadsLimit);
    console.log("Leads Used:", agency.leadsUsed);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
