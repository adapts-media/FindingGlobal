import { Router } from "express";
import jwt from "jsonwebtoken";
import { rateLimit } from "express-rate-limit";
import Agency from "../models/Agency.js";
import Project from "../models/Project.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import Transaction from "../models/Transaction.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { notifyAgencyForNewLead } from "../utils/notifications.js";
import { getAgencyForUser, checkAndUpdateSubscription } from "../utils/agency.js";

import { calculateMatchScore, MATCH_THRESHOLD, syncAgencyLeads, planRank } from "../lib/matching.js";

const router = Router();

// Escapes regex metacharacters in user-supplied search text before it's used to build a
// RegExp, so a crafted value (e.g. nested quantifiers) can't cause catastrophic backtracking.
function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.get("/", async (req, res, next) => {
  try {
    const { service, country, industry, search, featured, limit = "1000" } = req.query;
    // This listing is fully public and unauthenticated — it must only ever return verified
    // agencies. Pending/unverified applications are exposed solely via the admin-only
    // GET /api/admin/agencies/pending route (server/src/routes/admin.js), which requires an
    // admin session. There used to be a `status` query param here that let anyone pass
    // ?status=pending to read that same data with no auth at all; it's gone for good.
    const q = { verified: true };
    // Query values are coerced to strings — Express's query parser allows bracket syntax
    // (e.g. ?service[$ne]=null), which would otherwise hand a MongoDB query operator object
    // straight to Agency.find() instead of the plain string these fields expect.
    if (service) q.services = String(service);
    if (country) q.country = String(country);
    if (industry) q.industries = String(industry);
    if (featured === "true") q.featured = true;
    if (search) {
      const safeSearch = escapeRegExp(String(search));
      q.$or = [
        { name: new RegExp(safeSearch, "i") },
        { tagline: new RegExp(safeSearch, "i") },
      ];
    }
    const agencies = await Agency.find(q)
      .select("-portfolio -reviews -messages -team -awards -clients")
      .limit(Math.min(Number(limit) || 1000, 1000))
      .lean();
    // Paid-tier agencies (Growth/"FindingGlobal+") surface above free
    // Starter agencies by default; callers may still re-sort within that (e.g. by rating).
    agencies.sort((a, b) => planRank(b.plan) - planRank(a.plan));
    res.set("Cache-Control", "public, max-age=300"); // Cache public list for 5 mins
    res.json({ agencies });
  } catch (e) { next(e); }
});

router.get("/:slug", async (req, res, next) => {
  try {
    let agency = await Agency.findOne({ slug: req.params.slug }).select("-messages").lean();
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    // Authorization check for private data (messages)
    let isOwnerOrAdmin = false;
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : null;

    if (token) {
      try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (payload.role === "admin" || payload.id === String(agency.ownerUserId)) {
          isOwnerOrAdmin = true;
        }
      } catch { }
    }

    if (!agency.verified && !isOwnerOrAdmin) {
      return res.status(404).json({ error: "Agency not found" });
    }

    // If authorized, re-fetch with messages
    if (isOwnerOrAdmin) {
      const fullAgency = await Agency.findOne({ slug: req.params.slug });
      await checkAndUpdateSubscription(fullAgency);
      agency = fullAgency.toObject();
    }

    res.set("Cache-Control", isOwnerOrAdmin ? "no-store" : "public, max-age=600");
    res.json({ agency });
  } catch (e) { next(e); }
});

router.post("/match", async (req, res, next) => {
  try {
    const { services = [], budget, country, industry, limit = 6 } = req.body || {};
    const all = await Agency.find({ verified: true });
    const scored = all.map((agency) => ({
      agency,
      score: calculateMatchScore({ services, budget, country, industry }, agency)
    }));
    const matches = scored
      .filter((s) => s.score > MATCH_THRESHOLD)
      .sort((a, b) => planRank(b.agency.plan) - planRank(a.agency.plan) || b.score - a.score)
      .slice(0, Math.min(Number(limit) || 6, 20));
    res.json({ matches });
  } catch (e) { next(e); }
});

router.post("/", authRequired, requireRole("admin"), async (req, res, next) => {
  try {
    const agency = await Agency.create(req.body);
    res.status(201).json({ agency });
  } catch (e) { next(e); }
});

router.patch("/:slug", authRequired, requireRole("admin", "agency"), async (req, res, next) => {
  try {
    const agency = await Agency.findOne({ slug: req.params.slug });
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    // Validate Ownership: Non-admin users can only update their own agency profile
    if (req.user.role !== "admin") {
      const userAgency = await getAgencyForUser(req.user.id);
      if (!userAgency || String(userAgency._id) !== String(agency._id)) {
        return res.status(403).json({ error: "Forbidden: You are not the owner of this agency profile" });
      }
    }

    // Filter req.body to prevent non-admins from modifying administrative parameters
    if (req.user.role !== "admin") {
      delete req.body.featured;
      delete req.body.verified;
      delete req.body.plan;
      delete req.body.leadsUsed;
      delete req.body.leadsLimit;
      delete req.body.ownerUserId;
    }

    Object.assign(agency, req.body);
    await agency.save();

    // 1. Only sync leads if fields that affect matching have changed
    const matchingFields = ["services", "minBudget", "country", "industries", "verified"];
    const hasMatchingChanges = Object.keys(req.body).some(k => matchingFields.includes(k));

    if (hasMatchingChanges) {
      // 2. Perform sync in the background to avoid blocking the response
      syncAgencyLeads(agency).catch(err => {
        console.error(`Background lead sync failed for ${agency.slug}:`, err);
      });
    }

    const agencyJson = agency.toObject();
    delete agencyJson.messages;

    res.json({ agency: agencyJson });
  } catch (e) { next(e); }
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // limit each IP to 5 messages per hour
  message: { error: "Too many messages sent. Please try again in an hour." },
});

// Public contact form — anyone can message an agency directly.
router.post("/:slug/contact", contactLimiter, async (req, res, next) => {
  try {
    const { name, email, company, budget, message } = req.body || {};
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Name, email, and message are required" });
    }

    // Basic sanitization
    const cleanName = String(name).trim().slice(0, 100);
    const cleanEmail = String(email).trim().toLowerCase().slice(0, 100);
    const cleanMessage = String(message).trim().slice(0, 4000);

    if (cleanMessage.length < 10) {
      return res.status(400).json({ error: "Message is too short" });
    }

    const agency = await Agency.findOne({ slug: req.params.slug });
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    agency.messages = agency.messages || [];
    agency.messages.push({
      name: cleanName,
      email: cleanEmail,
      company: company ? String(company).trim().slice(0, 100) : undefined,
      budget: budget ? String(budget).trim().slice(0, 50) : undefined,
      message: cleanMessage,
      createdAt: new Date(),
    });

    // Create a Lead for the agency dashboard
    const newLead = await Lead.create({
      agency: agency._id,
      type: "Direct",
      status: "New",
      unlocked: true, // Direct contacts are always unlocked
      directContact: {
        name: cleanName,
        email: cleanEmail,
        company: company ? String(company).trim().slice(0, 100) : undefined,
        budget: budget ? String(budget).trim().slice(0, 50) : undefined,
        message: cleanMessage
      }
    });

    await agency.save();

    // Send background notification for direct contact lead
    notifyAgencyForNewLead(agency._id, "", budget || "", "Direct Contact", newLead._id).catch(err => {
      console.error(`Failed to send direct lead notification to agency ${agency._id}:`, err);
    });

    res.status(201).json({ ok: true });
  } catch (e) { next(e); }
});

// Upgrade or Downgrade plan (integrates Ziina payment checkout)
router.post("/upgrade", authRequired, requireRole("agency"), async (req, res, next) => {
  try {
    const { plan, billingPeriod = "monthly" } = req.body || {};
    if (!["Starter", "Growth"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    const agency = await getAgencyForUser(req.user.id);
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    // Starter tier is free. Downgrade directly.
    if (plan === "Starter") {
      const update = {
        plan: "Starter",
        leadsLimit: 3,
      };
      const updated = await Agency.findByIdAndUpdate(
        agency._id,
        update,
        { new: true }
      );
      return res.json({ agency: updated });
    }

    // FindingGlobal+ (stored as "Growth" internally in the database Schema) is the paid tier. Setup Ziina payment session.
    const billing = billingPeriod === "annual" ? "annual" : "monthly";
    const amount = billing === "annual" ? 94800 : 9900; // $948.00 annually or $99.00 monthly

    const ziinaToken = process.env.ZIINA_TOKEN;
    const frontendOrigin = req.headers.origin || "http://localhost:3000";

    if (!ziinaToken) {
      console.warn("ZIINA_TOKEN is not configured in .env file. Falling back to dummy payment simulation.");

      const mockPaymentIntentId = `mock_pi_${Math.random().toString(36).substring(2, 15)}`;

      // Store pending mock transaction
      await Transaction.create({
        paymentIntentId: mockPaymentIntentId,
        agencyId: agency._id,
        plan,
        billingPeriod: billing,
        amount,
        currency: "USD",
        status: "pending"
      });

      return res.json({
        redirectUrl: `${frontendOrigin}/payment-success?payment_intent_id=${mockPaymentIntentId}`
      });
    }

    // Call Ziina API
    try {
      const response = await fetch("https://api-v2.ziina.com/api/payment_intent", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${ziinaToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          amount,
          currency_code: "USD",
          message: `FindingGlobal+ ${plan} Plan (${billing})`,
          success_url: `${frontendOrigin}/payment-success?payment_intent_id={PAYMENT_INTENT_ID}`,
          cancel_url: `${frontendOrigin}/upgrade`
        })
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Ziina API response error (${response.status})`);
      }

      // Store pending real transaction
      await Transaction.create({
        paymentIntentId: data.id,
        agencyId: agency._id,
        plan,
        billingPeriod: billing,
        amount,
        currency: "USD",
        status: "pending"
      });

      return res.json({
        redirectUrl: data.redirect_url
      });
    } catch (err) {
      console.error("Ziina payment intent creation failed:", err);
      return res.status(500).json({ error: "Failed to initialize payment gateway with Ziina" });
    }
  } catch (e) { next(e); }
});

// Verify and confirm payment to complete upgrade
router.post("/confirm-payment", authRequired, requireRole("agency"), async (req, res, next) => {
  try {
    const { paymentIntentId } = req.body || {};
    if (!paymentIntentId) {
      return res.status(400).json({ error: "Payment Intent ID is required" });
    }

    const transaction = await Transaction.findOne({ paymentIntentId });
    if (!transaction) {
      return res.status(404).json({ error: "Transaction not found" });
    }

    const agency = await Agency.findById(transaction.agencyId);
    if (!agency) {
      return res.status(404).json({ error: "Agency associated with transaction not found" });
    }

    // Security check: Only the owner can confirm their transaction
    const userAgency = await getAgencyForUser(req.user.id);
    if ((!userAgency || String(userAgency._id) !== String(agency._id)) && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden: You are not authorized to confirm this transaction" });
    }

    if (transaction.status === "completed") {
      return res.json({ success: true, status: "completed", agency });
    }

    let isSuccess = false;

    if (paymentIntentId.startsWith("mock_pi_")) {
      // Simulate successful payment for test mode/missing token
      isSuccess = true;
      transaction.status = "completed";
      await transaction.save();
    } else {
      const ziinaToken = process.env.ZIINA_TOKEN;
      if (!ziinaToken) {
        return res.status(400).json({ error: "ZIINA_TOKEN not configured to verify payment" });
      }

      const response = await fetch(`https://api-v2.ziina.com/api/payment_intent/${paymentIntentId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${ziinaToken}`
        }
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || `Ziina API verification failed (${response.status})`);
      }

      transaction.status = data.status === "completed" ? "completed" : data.status;
      await transaction.save();

      if (data.status === "completed") {
        isSuccess = true;
      }
    }

    if (isSuccess) {
      let planExpiresAt = null;
      let planPurchasedAt = null;
      if (transaction.plan === "Growth") {
        planPurchasedAt = new Date();
        planExpiresAt = new Date();
        if (transaction.billingPeriod === "annual") {
          planExpiresAt.setFullYear(planExpiresAt.getFullYear() + 1);
        } else {
          planExpiresAt.setMonth(planExpiresAt.getMonth() + 1);
        }
      }

      const update = {
        plan: transaction.plan,
        planExpiresAt,
        planPurchasedAt,
        planBillingPeriod: transaction.plan === "Starter" ? "none" : transaction.billingPeriod,
        leadsLimit: transaction.plan === "Starter" ? 3 : 9999,
        verified: transaction.plan === "Starter" ? agency.verified : true
      };

      if (agency.tagline === "Pending verification") {
        update.tagline = "Growth-focused agency";
      }

      const updatedAgency = await Agency.findByIdAndUpdate(
        agency._id,
        update,
        { new: true }
      );

      return res.json({ success: true, status: "completed", agency: updatedAgency });
    }

    return res.json({ success: false, status: transaction.status });
  } catch (e) { next(e); }
});

// Submit a review for an agency
router.post("/:id/reviews", authRequired, async (req, res, next) => {
  try {
    const { rating, excerpt, projectId } = req.body || {};
    if (!rating || !excerpt || !projectId) {
      return res.status(400).json({ error: "Rating, review, and project ID are required" });
    }

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Authorization check
    if (String(project.clientUserId) !== String(req.user.id)) {
      return res.status(403).json({ error: "You are not the owner of this project" });
    }
    if (project.status !== "Closed") {
      return res.status(400).json({ error: "Project must be closed to leave a review" });
    }
    if (!project.hiredAgency || String(project.hiredAgency) !== String(req.params.id)) {
      return res.status(400).json({ error: "You can only review the agency you hired" });
    }

    const agency = await Agency.findById(req.params.id);
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // Check if already reviewed
    const existing = (agency.reviews || []).find(r => String(r.projectId) === String(projectId));
    if (existing) return res.status(400).json({ error: "You have already reviewed this project" });

    const newReview = {
      author: user.name || "Anonymous",
      company: user.company || "Client",
      rating: Number(rating),
      excerpt,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      projectId,
      userId: req.user.id
    };

    agency.reviews = agency.reviews || [];
    agency.reviews.push(newReview);

    // Update aggregate rating
    const totalRating = agency.reviews.reduce((sum, r) => sum + r.rating, 0);
    agency.reviewCount = agency.reviews.length;
    agency.rating = totalRating / agency.reviewCount;

    await agency.save();
    res.status(201).json({ review: newReview, rating: agency.rating, reviewCount: agency.reviewCount });
  } catch (e) { next(e); }
});

export default router;