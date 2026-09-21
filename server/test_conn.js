import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function main() {
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    
    const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));
    
    const agency = await Agency.findOne({ slug: "adapts-media" });
    if (agency) {
      console.log(`Exact coverSeed for adapts-media: ${agency.get("coverSeed")}`);
    } else {
      console.log("Agency adapts-media not found!");
    }
  } catch (err) {
    console.error("Error:", err);
  } finally {
    await mongoose.disconnect();
  }
}

main();
