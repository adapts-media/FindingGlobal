import mongoose from "mongoose";
import Agency from "./models/Agency.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log("Fixing agencies with 'Pending verification' tagline but 'verified: true'...");
  
  const result = await Agency.updateMany(
    { verified: true, tagline: "Pending verification" },
    { tagline: "Growth-focused agency" } // Give them a better default tagline
  );

  console.log(`✅ Fixed ${result.modifiedCount} agencies.`);
  process.exit(0);
}

fix();
