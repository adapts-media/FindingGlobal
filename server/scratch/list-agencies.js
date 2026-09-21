import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function list() {
  await mongoose.connect(MONGODB_URI);
  const all = await Agency.find({ slug: "adapts-media" }, "name slug logoSeed portfolio");
  console.log(JSON.stringify(all, null, 2));
  await mongoose.disconnect();
}
list();
