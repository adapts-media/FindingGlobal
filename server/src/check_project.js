import mongoose from "mongoose";
import "dotenv/config";
import Agency from "./models/Agency.js";
import Project from "./models/Project.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const projects = await Project.find().sort({ createdAt: -1 }).limit(1).populate("matchedAgencies");
  console.log(JSON.stringify(projects, null, 2));
  process.exit(0);
}
run();
