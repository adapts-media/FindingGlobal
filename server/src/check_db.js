import mongoose from "mongoose";
import "dotenv/config";
import Lead from "./models/Lead.js";
import Project from "./models/Project.js";
import Agency from "./models/Agency.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const leads = await Lead.find().populate("project").populate("agency");
  console.log("Leads:");
  leads.forEach(l => console.log(`  Lead: ${l._id}, Status: ${l.status}, ProjectStatus: ${l.project?.status}, Project: ${l.project?.title}, Agency: ${l.agency?.name}`));
  
  const projects = await Project.find();
  console.log("Projects:");
  projects.forEach(p => console.log(`  Project: ${p._id}, Title: ${p.title}, Status: ${p.status}, HiredAgency: ${p.hiredAgency}`));
  process.exit(0);
}
run();
