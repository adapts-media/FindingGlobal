import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // Find all agencies matching adapts-media
  const matches = await Agency.find({
    $or: [
      { name: /adapts/i },
      { slug: /adapts/i }
    ]
  });

  console.log(`Found ${matches.length} matching agencies to delete:`);
  for (const a of matches) {
    console.log(`- Name: ${a.get("name")}, Slug: ${a.get("slug")}, ID: ${a._id}`);
  }

  const deleteResult = await Agency.deleteMany({
    $or: [
      { name: /adapts/i },
      { slug: /adapts/i }
    ]
  });

  console.log(`Deleted ${deleteResult.deletedCount} agencies.`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
