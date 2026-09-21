import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));

  const users = await User.find({
    agencySlug: { $in: ["adapts-media", "adapts-media-1"] }
  });

  console.log(`Found ${users.length} users with deleted agencySlug:`);
  for (const u of users) {
    console.log(`- Email: ${u.get("email")}, agencySlug: ${u.get("agencySlug")}`);
  }

  const updateResult = await User.updateMany(
    { agencySlug: { $in: ["adapts-media", "adapts-media-1"] } },
    { $unset: { agencySlug: "" } }
  );

  console.log(`Cleared agencySlug for ${updateResult.modifiedCount} users.`);

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
