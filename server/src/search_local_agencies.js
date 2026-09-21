import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  await mongoose.connect(MONGODB_URI);
  const results = await Agency.find({
    $or: [
      { name: /genx/i },
      { slug: /genx/i },
      { name: /influence/i },
      { slug: /influence/i }
    ]
  });
  console.log(`Found ${results.length} matching agencies:`);
  for (const a of results) {
    console.log(JSON.stringify(a, null, 2));
  }
  await mongoose.disconnect();
}

run();
