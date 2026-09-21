import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function fix() {
  await mongoose.connect(MONGODB_URI);
  await Agency.updateOne(
    { slug: "adapts-media" },
    { 
      $set: { 
        country: "Qatar", 
        countries: ["Qatar", "UAE", "Saudi Arabia"], 
        industries: ["Technology & SaaS", "Healthcare", "Finance"] 
      } 
    }
  );
  console.log("Updated Adapts Media");

  await Agency.updateOne(
    { slug: "thegenxmedia" },
    { 
      $set: { 
        country: "Qatar", 
        countries: ["Qatar", "UAE", "Saudi Arabia"], 
        industries: ["Technology & SaaS", "Healthcare", "Finance"] 
      } 
    }
  );
  console.log("Updated TheGenXMedia");

  await mongoose.disconnect();
}
fix();
