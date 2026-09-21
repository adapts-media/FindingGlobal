import "dotenv/config";
import mongoose from "mongoose";
import { notifyAgencyForNewLead } from "./utils/notifications.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Test notifying Adapts Media
  const agencyId = "66a018a840352c3d5b198c55"; // Adapts Media ID ? Let's find it.
  const Agency = (await import("./models/Agency.js")).default;
  const adapts = await Agency.findOne({ slug: "adapts-media" });
  if (adapts) {
    console.log(`Found Adapts Media Agency ID: ${adapts._id}`);
    console.log(`Owner User ID: ${adapts.ownerUserId}`);
    await notifyAgencyForNewLead(adapts._id, "Test Project", "10k-25k", "Matched Project");
    console.log("Successfully ran notifyAgencyForNewLead");
  } else {
    console.log("Adapts Media not found.");
  }

  await mongoose.disconnect();
}

main().catch(console.error);
