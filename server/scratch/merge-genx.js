import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");
  
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // 1. Find the owner user
  const user = await User.findOne({ email: "genx@media.com" });
  if (!user) {
    console.error("User genx@media.com not found!");
    await mongoose.disconnect();
    process.exit(1);
  }

  // 2. Find both agencies
  const targetAgency = await Agency.findOne({ slug: "genxmedia" });
  const sourceAgency = await Agency.findOne({ slug: "genxmedia-1" });

  if (!sourceAgency) {
    console.log("No duplicate 'genxmedia-1' found to merge from.");
    await mongoose.disconnect();
    return;
  }

  console.log(`Found source agency 'genxmedia-1' (ID: ${sourceAgency._id}) with coverSeed: ${sourceAgency.get("coverSeed")}`);

  if (!targetAgency) {
    console.log("Target agency 'genxmedia' does not exist. Creating it using source data...");
    const sourceData = sourceAgency.toObject();
    delete sourceData._id;
    sourceData.slug = "genxmedia";
    sourceData.ownerUserId = user._id;
    sourceData.verified = true;
    
    await Agency.create(sourceData);
    console.log("Created target agency 'genxmedia' with source data.");
  } else {
    console.log(`Target agency 'genxmedia' exists (ID: ${targetAgency._id}). Merging data...`);
    const sourceData = sourceAgency.toObject();
    
    // Fields to exclude from copy
    const exclude = ["_id", "slug", "ownerUserId", "createdAt", "updatedAt"];
    
    const updateFields = {};
    for (const [key, val] of Object.entries(sourceData)) {
      if (!exclude.includes(key) && val !== undefined && val !== null) {
        updateFields[key] = val;
      }
    }
    
    // Ensure ownerUserId is set to the user
    updateFields.ownerUserId = user._id;
    updateFields.verified = true;
    
    await Agency.updateOne({ _id: targetAgency._id }, { $set: updateFields });
    console.log("Merged source data into target 'genxmedia' agency.");
  }

  // 3. Delete the duplicate source agency
  const deleteResult = await Agency.deleteOne({ _id: sourceAgency._id });
  console.log(`Deleted duplicate source agency 'genxmedia-1' (${deleteResult.deletedCount} document deleted).`);

  // 4. Update user's agencySlug
  user.set("agencySlug", "genxmedia");
  user.set("role", "agency");
  await user.save();
  console.log(`Updated user ${user.email} agencySlug to 'genxmedia' and role to 'agency'.`);

  await mongoose.disconnect();
  console.log("Done!");
}

run().catch(console.error);
