import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function main() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model("User", new mongoose.Schema({}, { strict: false }));
  
  const users = await User.find({
    $or: [
      { email: /billion/i },
      { name: /billion/i },
      { email: /webs/i }
    ]
  });

  console.log(`Found ${users.length} matching users:`);
  for (const u of users) {
    console.log(` - Email: ${u.get("email")}, Name: ${u.get("name")}, ID: ${u._id}, agencySlug: ${u.get("agencySlug")}`);
  }

  await mongoose.disconnect();
}

main().catch(console.error);
