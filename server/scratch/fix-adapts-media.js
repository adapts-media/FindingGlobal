import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function fix() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await Agency.updateOne(
    { slug: "adapts-media" },
    { 
      $set: { 
        city: "Dubai",
        country: "United Arab Emirates",
        countryCode: "AE"
      } 
    }
  );
  
  if (result.modifiedCount > 0) {
    console.log("Successfully updated Adapts Media location to Dubai, United Arab Emirates");
  } else {
    console.log("No changes made. Agency might already have these values or slug is incorrect.");
  }

  await mongoose.disconnect();
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});
