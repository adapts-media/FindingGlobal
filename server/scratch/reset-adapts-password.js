import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  
  const email = "adapts@media.com";
  const user = await User.findOne({ email });
  if (user) {
    user.passwordHash = await bcrypt.hash("password123", 10);
    await user.save();
    console.log(`Password reset successfully for ${email}`);
  } else {
    console.log(`User ${email} not found.`);
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
