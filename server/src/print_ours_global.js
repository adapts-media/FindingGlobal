import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const a = await Agency.findOne({ slug: "ours-global" });
  console.log("ours-global details:", JSON.stringify(a, null, 2));
  await mongoose.disconnect();
}

run();
