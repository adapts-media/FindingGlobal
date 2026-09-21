import mongoose from "mongoose";
import EnterpriseInquiry from "./src/models/EnterpriseInquiry.js";
import Contact from "./src/models/Contact.js";

const MONGODB_URI = process.env.MONGODB_URI;

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  // Clear all enterprise inquiries and contact messages (assuming these are test submissions)
  const eiResult = await EnterpriseInquiry.deleteMany({});
  const contactResult = await Contact.deleteMany({});
  
  console.log("Deleted Enterprise Inquiries:", eiResult.deletedCount);
  console.log("Deleted General Messages:", contactResult.deletedCount);
  process.exit(0);
}

run().catch(console.error);
