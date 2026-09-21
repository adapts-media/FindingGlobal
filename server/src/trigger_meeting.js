import mongoose from "mongoose";
import "dotenv/config";
import Lead from "./models/Lead.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  // Find the latest lead
  const latestLead = await Lead.findOne().sort({ createdAt: -1 });
  if (latestLead) {
    console.log("Setting meetingRequested for lead:", latestLead._id);
    latestLead.meetingRequested = true;
    latestLead.meetingBooked = false; // reset booking for testing
    await latestLead.save();
    console.log("Updated successfully!");
  } else {
    console.log("No leads found!");
  }
  process.exit(0);
}
run();
