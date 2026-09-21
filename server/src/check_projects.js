import mongoose from "mongoose";
import "dotenv/config";
import Project from "./models/Project.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function checkProjects() {
  await mongoose.connect(MONGODB_URI);
  const projects = await Project.find({});
  console.log(`Total projects: ${projects.length}`);
  projects.forEach(p => {
    console.log(`- ${p.title} [${p.status}]: ${p.services.join(", ")}`);
  });
  await mongoose.connection.close();
}

checkProjects().catch(console.error);
