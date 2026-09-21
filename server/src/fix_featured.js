import "dotenv/config";
import mongoose from "mongoose";
import Agency from "./models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

mongoose.connect(MONGODB_URI)
  .then(async () => {
    const allowedSlugs = ["adapts-media", "thegenxmedia", "billionwebs"];
    const res1 = await Agency.updateMany(
      { slug: { $in: allowedSlugs } },
      { featured: true }
    );
    const res2 = await Agency.updateMany(
      { slug: { $nin: allowedSlugs } },
      { featured: false }
    );
    console.log("Featured updated successfully:", { 
      featuredTrue: res1.modifiedCount, 
      featuredFalse: res2.modifiedCount 
    });
    process.exit(0);
  })
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  });
