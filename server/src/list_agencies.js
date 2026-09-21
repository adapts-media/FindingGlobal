import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function listAgencies() {
  await mongoose.connect(MONGODB_URI);
  const Agency = mongoose.model("Agency", new mongoose.Schema({
    name: String,
    slug: String,
    services: [String],
    industries: [String],
    country: String,
    minBudget: Number
  }));

  const agencies = await Agency.find({});
  console.log(JSON.stringify(agencies, null, 2));
  await mongoose.connection.close();
}

listAgencies().catch(console.error);
