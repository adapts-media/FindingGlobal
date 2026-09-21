import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  
  const users = await User.find({ role: "agency" });
  console.log("Agency Users:");
  for (const user of users) {
    console.log(`- ID: ${user._id}, Email: ${user.email}, Name: ${user.name}, AgencySlug: ${user.agencySlug}`);
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
