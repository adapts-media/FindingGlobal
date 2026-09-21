import mongoose from "mongoose";
import "dotenv/config";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function checkAgency() {
  await mongoose.connect(MONGODB_URI);
  const agency = await Agency.findOne({ slug: "newagency" });
  if (!agency) {
    console.log("Agency not found");
  } else {
    console.log(`Agency: ${agency.name}`);
    console.log(`Verified: ${agency.verified}`);
    console.log(`Services: ${agency.services.join(", ")}`);
    console.log(`Country: ${agency.country}`);
    console.log(`Min Budget: ${agency.minBudget}`);
  }
  await mongoose.connection.close();
}

checkAgency().catch(console.error);
