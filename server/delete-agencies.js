import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

const schema = new mongoose.Schema({}, { strict: false });
const Agency = mongoose.model("Agency", schema, "agencies");
const User = mongoose.model("User", schema, "users");

async function run() {
  await mongoose.connect(MONGODB_URI);
  
  // Also delete associated users to keep database clean
  const agencies = await Agency.find({ name: { $in: ["Test", "Nitish"] } });
  const userIds = agencies.map(a => a.userId).filter(Boolean);
  
  const agencyResult = await Agency.deleteMany({ name: { $in: ["Test", "Nitish"] } });
  const userResult = await User.deleteMany({ _id: { $in: userIds } });
  
  console.log("Deleted Agencies:", agencyResult.deletedCount);
  console.log("Deleted Users:", userResult.deletedCount);
  process.exit(0);
}

run().catch(console.error);
