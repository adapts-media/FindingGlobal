import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function countLeads() {
  await mongoose.connect(MONGODB_URI);
  const Lead = mongoose.model("Lead", new mongoose.Schema({
    agency: mongoose.Schema.Types.ObjectId,
    status: String
  }));
  const Agency = mongoose.model("Agency", new mongoose.Schema({
    slug: String
  }));

  const agency = await Agency.findOne({ slug: "ishant-sharma" });
  if (!agency) {
    console.log("Agency not found");
    process.exit(1);
  }

  const count = await Lead.countDocuments({ agency: agency._id });
  console.log(`Lead count for ishant-sharma: ${count}`);

  await mongoose.connection.close();
}

countLeads().catch(console.error);
