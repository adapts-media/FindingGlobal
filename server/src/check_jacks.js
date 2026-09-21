import mongoose from "mongoose";
import "dotenv/config";
import Agency from "./models/Agency.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const agency = await Agency.findOne({ name: /Jack/i });
  console.log(JSON.stringify(agency, null, 2));
  process.exit(0);
}
run();
