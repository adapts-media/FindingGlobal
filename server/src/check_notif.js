import "dotenv/config";
import mongoose from "mongoose";
import Notification from "./models/Notification.js";
import User from "./models/User.js";
import Agency from "./models/Agency.js";
import Lead from "./models/Lead.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  const notifications = await Notification.find({}).populate("recipient").lean();
  console.log(`Found ${notifications.length} notifications:`);
  for (const n of notifications) {
    console.log(`- Recipient: ${n.recipient?.email || n.recipient} (${n.recipient?.name})`);
    console.log(`  Title: ${n.title}`);
    console.log(`  Message: ${n.message}`);
    console.log(`  Read: ${n.read}`);
    console.log(`  Type: ${n.type}`);
  }

  const agencies = await Agency.find({}).populate("ownerUserId").lean();
  console.log(`\nFound ${agencies.length} agencies:`);
  for (const a of agencies) {
    console.log(`- Agency: ${a.name} (${a.slug})`);
    console.log(`  Owner: ${a.ownerUserId?.email || a.ownerUserId} (${a.ownerUserId?.name})`);
  }

  const leads = await Lead.find({}).populate("agency").lean();
  console.log(`\nFound ${leads.length} leads:`);
  for (const l of leads) {
    console.log(`- Lead ID: ${l._id}`);
    console.log(`  Agency: ${l.agency?.name} (${l.agency?.slug})`);
    console.log(`  Status: ${l.status}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
