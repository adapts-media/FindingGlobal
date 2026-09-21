import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import { rateLimit } from "express-rate-limit";
import crypto from "crypto";
import User from "../models/User.js";
import Agency from "../models/Agency.js";
import { authRequired } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const resetPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: { error: "Too many attempts. Please try again in 15 minutes." }
});

// Previously only the generic app-wide limiter (10,000 req/15min per IP, in server/src/
// index.js) applied to these — not remotely tight enough to stop credential stuffing or OTP
// guessing. skipSuccessfulRequests on the login limiter means a user who mistypes their
// password a couple of times before getting it right doesn't get counted against the limit;
// only a run of failures does.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  message: { error: "Too many login attempts. Please try again in 15 minutes." },
});

const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: "Too many registration attempts. Please try again later." },
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Too many verification attempts. Please try again in 15 minutes." },
});

const MAX_LOGIN_ATTEMPTS = 10;
const LOGIN_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

const router = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  name: z.string().min(1).max(120),
  role: z.enum(["client", "agency"]).default("client"),
  company: z.string().min(1, "Company is required").max(160),
  country: z.string().max(80).optional(),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const GoogleLoginSchema = z.object({
  credential: z.string(),
  role: z.enum(["client", "agency"]).optional(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  password: z.string().min(8).max(128),
});

const VerifyRegisterSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
});

function sign(user) {
  return jwt.sign(
    { id: user._id.toString(), role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

function safeUser(u) {
  return {
    id: u._id,
    email: u.email,
    name: u.name,
    role: u.role,
    company: u.company,
    country: u.country,
    agencySlug: u.agencySlug,
    createdAt: u.createdAt,
  };
}

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const data = RegisterSchema.parse(req.body);
    let user = await User.findOne({ email: data.email });

    if (user && user.isVerified) {
      return res.status(409).json({ error: "Email already in use" });
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    if (user && !user.isVerified) {
      // Update existing unverified user
      user.passwordHash = passwordHash;
      user.name = data.name;
      user.role = data.role || "client";
      user.company = data.company;
      user.country = data.country;
      user.registerOtp = otp;
      user.registerOtpExpires = otpExpires;
      user.registerOtpAttempts = 0;
      await user.save();
    } else {
      // Create new user
      user = await User.create({
        ...data,
        passwordHash,
        isVerified: false,
        registerOtp: otp,
        registerOtpExpires: otpExpires,
      });
    }

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Welcome to Finding Global - Account Verification OTP",
      text: `Hello ${user.name},\n\nYour OTP code to verify your account is: ${otp}\n\nThis OTP is valid for 15 minutes.\n\nIf you did not register for an account, please ignore this email.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #003bb3; margin-top: 0;">Verify Your Account</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Thank you for registering with Finding Global. Use the following One-Time Password (OTP) to verify your account:</p>
          <div style="background-color: #f4f6fa; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #0b0f19;">${otp}</span>
          </div>
          <p>This OTP is valid for <strong>15 minutes</strong>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            If you did not attempt to register an account, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.status(200).json({ message: "OTP sent to your email. Please verify.", requiresOtp: true });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.post("/verify-register", otpVerifyLimiter, async (req, res, next) => {
  try {
    const data = VerifyRegisterSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });

    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.isVerified) return res.status(400).json({ error: "User is already verified" });
    if (!user.registerOtp || !user.registerOtpExpires || user.registerOtpExpires < new Date()) {
      return res.status(400).json({ error: "OTP has expired. Please register again to get a new one." });
    }

    if (user.registerOtpAttempts >= MAX_OTP_ATTEMPTS) {
      user.registerOtp = undefined;
      user.registerOtpExpires = undefined;
      user.registerOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Too many failed attempts. Please register again to get a new OTP." });
    }

    if (user.registerOtp !== data.otp) {
      user.registerOtpAttempts = (user.registerOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    // OTP is valid
    user.isVerified = true;
    user.registerOtp = undefined;
    user.registerOtpExpires = undefined;
    user.registerOtpAttempts = 0;

    // If signing up as an agency, auto-create a pending agency profile now
    if (user.role === "agency") {
      const baseSlug = (user.company || user.name)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || `agency-${user._id.toString().slice(-6)}`;
      let slug = baseSlug;
      let i = 1;
      while (await Agency.findOne({ slug })) {
        slug = `${baseSlug}-${i++}`;
      }
      const agency = await Agency.create({
        slug,
        name: user.company || user.name,
        tagline: "",
        city: "",
        country: user.country || "",
        countryCode: "",
        minBudget: 0,
        rating: 0,
        reviewCount: 0,
        services: [],
        industries: [],
        logoSeed: slug,
        featured: false,
        verified: false,
        ownerUserId: user._id,
      });
      user.agencySlug = agency.slug;
    }
    await user.save();

    const token = sign(user);
    res.cookie("fm_token", token, COOKIE_OPTIONS);
    res.status(200).json({ token, user: safeUser(user) });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await User.findOne({ email: data.email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    if (!user.isVerified) return res.status(401).json({ error: "Please verify your email before logging in." });

    // Per-account lockout, on top of the IP-based loginLimiter above — this is what actually
    // stops a credential-stuffing attempt against one account from many/rotating IPs, which
    // an IP-keyed rate limiter alone can't catch.
    if (user.lockUntil && user.lockUntil > new Date()) {
      return res.status(429).json({ error: "Too many failed attempts. Please try again later." });
    }

    const ok = user.passwordHash ? await bcrypt.compare(data.password, user.passwordHash) : false;
    if (!ok) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= MAX_LOGIN_ATTEMPTS) {
        user.lockUntil = new Date(Date.now() + LOGIN_LOCKOUT_MS);
        user.loginAttempts = 0;
      }
      await user.save();
      return res.status(401).json({ error: "Invalid credentials" });
    }

    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();

    const token = sign(user);
    res.cookie("fm_token", token, COOKIE_OPTIONS);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.post("/forgot-password", resetPasswordLimiter, async (req, res, next) => {
  try {
    const data = ForgotPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" });
    }

    // Generate 6-digit OTP
    const otp = crypto.randomInt(100000, 999999).toString();
    user.resetOtp = otp;
    user.resetOtpExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    user.resetOtpAttempts = 0;
    await user.save();

    // Send email
    await sendEmail({
      to: user.email,
      subject: "Your Finding Global Password Reset OTP",
      text: `Hello ${user.name},\n\nYou requested to reset your password. Your OTP code is: ${otp}\n\nThis OTP is valid for 15 minutes.\n\nIf you did not request this, you can safely ignore this email.`,
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #003bb3; margin-top: 0;">Password Reset</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>You requested to reset your password for your Finding Global account. Use the following One-Time Password (OTP) to proceed:</p>
          <div style="background-color: #f4f6fa; padding: 15px; text-align: center; border-radius: 8px; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #0b0f19;">${otp}</span>
          </div>
          <p>This OTP is valid for <strong>15 minutes</strong>.</p>
          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
            If you did not request a password reset, you can safely ignore this email.
          </p>
        </div>
      `,
    });

    res.json({ success: true, message: "OTP sent successfully" });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.post("/reset-password", resetPasswordLimiter, async (req, res, next) => {
  try {
    const data = ResetPasswordSchema.parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ error: "User with this email does not exist" });
    }

    if (!user.resetOtp || !user.resetOtpExpires || user.resetOtpExpires < new Date()) {
      return res.status(400).json({ error: "OTP has expired or is invalid. Please request a new one." });
    }

    if (user.resetOtpAttempts >= 5) {
      user.resetOtp = undefined;
      user.resetOtpExpires = undefined;
      user.resetOtpAttempts = 0;
      await user.save();
      return res.status(400).json({ error: "Too many failed attempts. Please request a new OTP." });
    }

    if (user.resetOtp !== data.otp) {
      user.resetOtpAttempts = (user.resetOtpAttempts || 0) + 1;
      await user.save();
      return res.status(400).json({ error: "Invalid OTP code" });
    }

    // Check if new password is same as old password
    if (user.passwordHash) {
      const isSame = await bcrypt.compare(data.password, user.passwordHash);
      if (isSame) {
        return res.status(400).json({ error: "New password cannot be the same as your old password." });
      }
    }

    // Reset password
    const passwordHash = await bcrypt.hash(data.password, 10);
    user.passwordHash = passwordHash;
    user.resetOtp = undefined;
    user.resetOtpExpires = undefined;
    user.resetOtpAttempts = 0;
    await user.save();

    res.json({ success: true, message: "Password reset successfully. You can now sign in." });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.post("/google", async (req, res, next) => {
  try {
    const { credential, role = "client" } = GoogleLoginSchema.parse(req.body);

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (!user) {
      // Create new user
      user = new User({
        email,
        googleId,
        name,
        role: role, // Default to client if not specified
        isVerified: true, // Google handles verification
      });

      // If signing up as an agency, auto-create a pending agency profile
      if (user.role === "agency") {
        const baseSlug = name
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || `agency-${googleId.slice(-6)}`;

        let slug = baseSlug;
        let i = 1;
        while (await Agency.findOne({ slug })) {
          slug = `${baseSlug}-${i++}`;
        }

        const agency = await Agency.create({
          slug,
          name: name,
          tagline: "",
          city: "",
          country: "",
          countryCode: "",
          minBudget: 0,
          rating: 0,
          reviewCount: 0,
          services: [],
          industries: [],
          logoSeed: slug,
          featured: false,
          verified: false,
          ownerUserId: user._id,
        });
        user.agencySlug = agency.slug;
      }
      await user.save();
    } else if (!user.googleId) {
      // Link Google account to existing email user
      user.googleId = googleId;
      await user.save();
    }

    const token = sign(user);
    res.cookie("fm_token", token, COOKIE_OPTIONS);
    res.json({ token, user: safeUser(user) });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    console.error("GOOGLE AUTH CRITICAL ERROR:", err.message || err);
    res.status(401).json({ error: `Google authentication failed: ${err.message || 'Unknown error'}` });
  }
});

router.post("/logout", (req, res) => {
  res.clearCookie("fm_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  });
  res.json({ success: true });
});

router.get("/me", authRequired, async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json({ user: safeUser(user) });
});

export default router;