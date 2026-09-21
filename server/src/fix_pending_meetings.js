import mongoose from "mongoose";
import "dotenv/config";
import Meeting from "./models/Meeting.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const result = await Meeting.updateMany(
    { status: "pending" },
    { $set: { status: "accepted" } }
  );
  console.log(`Updated ${result.modifiedCount} pending meetings to 'accepted'`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
