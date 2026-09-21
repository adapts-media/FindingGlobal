import mongoose from "mongoose";
import Agency from "./models/Agency.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function check() {
  await mongoose.connect(MONGODB_URI);
  const agencies = await Agency.find({}, { name: 1, verified: 1, tagline: 1, slug: 1 });
  console.log(JSON.stringify(agencies, null, 2));
  process.exit(0);
}

check();
