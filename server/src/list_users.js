import mongoose from "mongoose";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function listUsers() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    name: String,
    role: String
  }));

  const users = await User.find({});
  console.log(JSON.stringify(users, null, 2));
  await mongoose.connection.close();
}

listUsers().catch(console.error);
