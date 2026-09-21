import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: false }, // Optional for Google users
    googleId: { type: String, unique: true, sparse: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: ["client", "agency", "admin"], default: "client", index: true },
    company: { type: String, trim: true },
    country: { type: String, trim: true },
    agencySlug: { type: String, trim: true }, // for agency users
    isVerified: { type: Boolean, default: false },
    registerOtp: { type: String },
    registerOtpExpires: { type: Date },
    registerOtpAttempts: { type: Number, default: 0 },
    resetOtp: { type: String },
    resetOtpExpires: { type: Date },
    resetOtpAttempts: { type: Number, default: 0 },
    // Per-account login lockout — on top of the IP-based rate limiter on POST /login, this
    // stops a distributed/rotating-IP credential-stuffing attack aimed at one specific
    // account from ever being rate-limited by IP alone.
    loginAttempts: { type: Number, default: 0 },
    lockUntil: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("User", UserSchema);