import "dotenv/config";
import mongoose from "mongoose";
import Project from "./models/Project.js";
import Lead from "./models/Lead.js";
import Agency from "./models/Agency.js";
import { notifyAgencyForNewLead } from "./utils/notifications.js";
import { calculateMatchScore } from "./lib/matching.js";

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
  console.log(`Adapts Media MinBudget: ${adapts.minBudget}, Services: ${adapts.services}, Country: ${adapts.country}`);

  // Create a project that definitely matches Adapts Media
  const service = adapts.services[0] || "Web Development";
  const projectData = {
    title: "Vibrant E-Commerce Redesign",
    description: "Sleek and premium redesign of our corporate e-commerce platform.",
    services: [service],
    budget: "25k-75k",
    country: adapts.country || "United Arab Emirates",
    industry: "E-Commerce",
    clientUserId: "69f34e15948592c62757b839", // Use a valid client user ID or same owner just to have it pass validation
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
