import { Router } from "express";
import { rateLimit } from "express-rate-limit";
import Contact from "../models/Contact.js";
import EnterpriseInquiry from "../models/EnterpriseInquiry.js";
const router = Router();

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 contact submissions per 15 minutes
  message: { error: "Too many contact submissions. Please try again later." }
});

// POST /api/contact
router.post("/", contactLimiter, async (req, res, next) => {
  try {
    const { name, email, subject, message } = req.body;
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required." });
    }
    const submission = await Contact.create({ name, email, subject, message });
    res.status(201).json({ success: true, contact: submission });
  } catch (e) {
    next(e);
  }
});

// POST /api/contact/enterprise
router.post("/enterprise", contactLimiter, async (req, res, next) => {
  try {
    const { name, email, company, phone, requirements } = req.body;
    if (!name || !email || !requirements) {
      return res.status(400).json({ error: "Name, email, and requirements are required." });
    }
    const submission = await EnterpriseInquiry.create({ name, email, company, phone, requirements });
    res.status(201).json({ success: true, contact: submission });
  } catch (e) {
    next(e);
  }
});

export default router;
