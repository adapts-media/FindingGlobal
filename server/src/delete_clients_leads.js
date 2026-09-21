import mongoose from "mongoose";
import "dotenv/config";
import Lead from "./models/Lead.js";
import User from "./models/User.js";
import Project from "./models/Project.js";

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
    
    const userResult = await User.deleteMany({ role: "client" });
    console.log(`Deleted ${userResult.deletedCount} client accounts.`);

    const leadResult = await Lead.deleteMany({});
    console.log(`Deleted ${leadResult.deletedCount} leads.`);

    const projectResult = await Project.deleteMany({});
    console.log(`Deleted ${projectResult.deletedCount} projects.`);

    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

run();
