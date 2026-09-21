import "dotenv/config";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  await mongoose.connect(MONGODB_URI);
  
  const email = "adapts@media.com";
  const user = await User.findOne({ email });
  if (!user) {
    console.error("User not found!");
    await mongoose.disconnect();
    return;
  }
  
  const token = jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  
  console.log("Simulating upgrade request for user:", email);
  console.log("Token:", token);
  
  try {
    const res = await fetch("http://localhost:4000/api/agencies/upgrade", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify({
        plan: "Growth",
        billingPeriod: "monthly"
      })
    });
    
    console.log("Response Status:", res.status);
    const data = await res.json();
    console.log("Response Body:", data);
  } catch (err) {
    console.error("Request failed:", err);
  }
  
  await mongoose.disconnect();
}

main().catch(console.error);
