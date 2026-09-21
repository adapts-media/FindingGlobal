import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./src/models/Agency.js";
import User from "./src/models/User.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
  await mongoose.connect(MONGODB_URI);
  
  const agency = await Agency.findOne({ slug: "adapts-media" });
  if (agency) {
    console.log("Agency:", agency.name);
    console.log("OwnerUserId:", agency.ownerUserId);
    const user = await User.findById(agency.ownerUserId);
    if (user) {
      console.log("User Email:", user.email);
      console.log("User Role:", user.role);
    } else {
      console.log("Owner user not found in User collection!");
    }
  } else {
    console.log("Adapts Media agency not found.");
  }
  
  const allUsers = await User.find({});
  console.log("All Users in database:");
  allUsers.forEach(u => console.log(`- ${u.email} (${u.role})`));

  await mongoose.disconnect();
}

main().catch(console.error);
