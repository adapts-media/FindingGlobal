import mongoose from "mongoose";
import "dotenv/config";
import Project from "./models/Project.js";
import Agency from "./models/Agency.js";
// I will deliberately not import User, to see if it fails
// import User from "./models/User.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  try {
    const projects = await Project.find({}).sort({ createdAt: -1 }).populate("matchedAgencies").populate("clientUserId", "name company email");
    console.log("Success", projects.length);
  } catch (err) {
    console.error("Error:", err);
  }
  process.exit(0);
}
run();
