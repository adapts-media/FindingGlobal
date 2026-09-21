import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import "dotenv/config";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function resetPassword() {
  await mongoose.connect(MONGODB_URI);
  const User = mongoose.model("User", new mongoose.Schema({
    email: String,
    passwordHash: String
  }));

  const email = "new@new.co";
  const newPassword = "password123";
  const passwordHash = await bcrypt.hash(newPassword, 10);

  const res = await User.updateOne({ email }, { passwordHash });
  if (res.modifiedCount > 0) {
    console.log(`Successfully reset password for ${email} to: ${newPassword}`);
  } else {
    console.log(`User ${email} not found or password unchanged.`);
  }

  await mongoose.connection.close();
}

resetPassword().catch(console.error);
