import "dotenv/config";
import mongoose from "mongoose";
import Project from "./models/Project.js";
import Lead from "./models/Lead.js";
import Agency from "./models/Agency.js";
import { notifyAgencyForNewLead } from "./utils/notifications.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB.");

  // Get Adapts Media
  const adapts = await Agency.findOne({ slug: "adapts-media" });
  if (!adapts) {
    console.error("Adapts Media not found!");
    await mongoose.disconnect();
    return;
  }

  // Create "Kekz v2" matching project
  const projectData = {
    title: "Kekz v2 - Web Development",
    description: "Web development requirements for Kekz v2 project.",
    services: ["Web Development"],
    budget: "25k-75k",
    country: "United Arab Emirates",
    industry: "Technology & SaaS",
    clientUserId: "69f34e15948592c62757b839",
  };

  const project = await Project.create({
    ...projectData,
    matchedAgencies: [adapts._id],
  });

  // Create lead
  const lead = await Lead.create({
    project: project._id,
    agency: adapts._id,
    status: "New",
  });
  console.log(`Created Lead ID: ${lead._id} for Project: ${project.title}`);

  // Trigger Notification!
  await notifyAgencyForNewLead(adapts._id, project.title, project.budget, "Matched Project");
  console.log("Notification triggered successfully.");

  await mongoose.disconnect();
}

main().catch(console.error);
