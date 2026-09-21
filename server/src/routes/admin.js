import { Router } from "express";
import Agency from "../models/Agency.js";
import Project from "../models/Project.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { syncAgencyLeads } from "../lib/matching.js";
import { createNotification } from "../utils/notifications.js";
import Meeting from "../models/Meeting.js";
import EnterpriseInquiry from "../models/EnterpriseInquiry.js";
import Contact from "../models/Contact.js";

const router = Router();

router.use(authRequired, requireRole("admin"));

// Platform stats
router.get("/stats", async (_req, res, next) => {
  try {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      totalAgencies,
      pendingAgencies,
      projects30d,
      wonLeads,
      activeClients,
    ] = await Promise.all([
      Agency.countDocuments({ verified: true }),
      Agency.countDocuments({ verified: false }),
      Project.countDocuments({ createdAt: { $gte: since } }),
      Lead.countDocuments({ status: "Won" }),
      User.countDocuments({ role: "client" }),
    ]);
    res.json({
      stats: {
        totalAgencies,
        pendingAgencies,
        projects30d,
        successfulMatches: wonLeads,
        activeClients,
      },
    });
  } catch (e) { next(e); }
});

// Pending agencies awaiting verification
router.get("/agencies/pending", async (_req, res, next) => {
  try {
    const agencies = await Agency.find({ verified: false })
      .select("-portfolio -reviews -messages -team -awards")
      .sort({ createdAt: -1 })
      .limit(100);
    res.json({ agencies });
  } catch (e) { next(e); }
});

// Approve / reject
router.post("/agencies/:slug/approve", async (req, res, next) => {
  try {
    const agency = await Agency.findOneAndUpdate(
      { slug: req.params.slug },
      { verified: true },
      { new: true }
    );
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    // When an agency is approved, match them against all currently active projects in the background
    syncAgencyLeads(agency).catch(err => {
      console.error(`Background lead sync failed for ${agency.slug}:`, err);
    });

    // Send approval notification + email to the agency owner
    (async () => {
      try {
        let ownerUserId = agency.ownerUserId;
        if (!ownerUserId) {
          const ownerUser = await User.findOne({ agencySlug: agency.slug, role: "agency" });
          if (ownerUser) ownerUserId = ownerUser._id;
        }
        if (ownerUserId) {
          await createNotification({
            recipientId: ownerUserId,
            title: "🎉 Your Agency Has Been Approved!",
            message: `Congratulations! Your agency "${agency.name}" has been approved and is now live on Finding Global. Your profile is visible to potential clients, and you'll start receiving relevant project opportunities. Log in to your dashboard to manage inquiries and grow your business!`,
            type: "general",
            link: "/agency-dashboard",
          });
          console.log(`[Admin] Approval notification sent for agency: ${agency.slug}`);
        } else {
          console.warn(`[Admin] Could not find owner for approved agency: ${agency.slug} — no notification sent.`);
        }
      } catch (err) {
        console.error(`[Admin] Failed to send approval notification for ${agency.slug}:`, err);
      }
    })();

    res.json({ agency });
  } catch (e) { next(e); }
});

router.post("/agencies/:slug/reject", async (req, res, next) => {
  try {
    const agency = await Agency.findOne({ slug: req.params.slug, verified: false });
    if (!agency) return res.status(404).json({ error: "Pending agency not found" });
    
    // Keep the agencySlug on the user so they see the rejection screen on their dashboard    
    await Agency.deleteOne({ _id: agency._id });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Recent projects
router.get("/projects/recent", async (_req, res, next) => {
  try {
    const projects = await Project.find({})
      .sort({ createdAt: -1 })
      .limit(20)
      .populate("matchedAgencies", "name slug");
    res.json({ projects });
  } catch (e) { next(e); }
});

// Top agencies (by rating + review count)
router.get("/agencies/top", async (_req, res, next) => {
  try {
    const agencies = await Agency.find({ verified: true })
      .select("-portfolio -reviews -messages -team -awards")
      .sort({ rating: -1, reviewCount: -1 })
      .limit(10);
    res.json({ agencies });
  } catch (e) { next(e); }
});

// All agencies
router.get("/agencies/all", async (_req, res, next) => {
  try {
    const agencies = await Agency.find({})
      .select("-portfolio -reviews -messages -team -awards")
      .sort({ name: 1 });
    res.json({ agencies });
  } catch (e) { next(e); }
});

// Update agency plan
router.patch("/agencies/:slug/plan", async (req, res, next) => {
  try {
    const { plan } = req.body || {};
    if (!["Starter", "Growth"].includes(plan)) {
      return res.status(400).json({ error: "Invalid plan" });
    }
    const agency = await Agency.findOneAndUpdate(
      { slug: req.params.slug },
      { plan, leadsLimit: plan === "Starter" ? 3 : 9999 },
      { new: true }
    );
    if (!agency) return res.status(404).json({ error: "Agency not found" });
    res.json({ agency });
  } catch (e) { next(e); }
});

// Toggle agency featured status
router.patch("/agencies/:slug/featured", async (req, res, next) => {
  try {
    const { featured } = req.body || {};
    if (typeof featured !== "boolean") {
      return res.status(400).json({ error: "featured must be a boolean" });
    }
    const agency = await Agency.findOneAndUpdate(
      { slug: req.params.slug },
      { featured },
      { new: true }
    );
    if (!agency) return res.status(404).json({ error: "Agency not found" });
    res.json({ agency });
  } catch (e) { next(e); }
});

// Delete agency from platform
router.delete("/agencies/:slug", async (req, res, next) => {
  try {
    const agency = await Agency.findOne({ slug: req.params.slug });
    if (!agency) return res.status(404).json({ error: "Agency not found" });

    const agencyId = agency._id;
    const slug = agency.slug;

    // Clean up related records in parallel
    await Promise.all([
      User.updateMany({ agencySlug: slug }, { $unset: { agencySlug: 1 } }),
      Lead.deleteMany({ agency: agencyId }),
      Meeting.deleteMany({ agency: agencyId }),
      Project.updateMany({ matchedAgencies: agencyId }, { $pull: { matchedAgencies: agencyId } }),
      Project.updateMany({ hiredAgency: agencyId }, { $unset: { hiredAgency: 1 } }),
      Agency.deleteOne({ _id: agencyId }),
    ]);

    res.json({ ok: true });
  } catch (e) { next(e); }
});

// Get enterprise inquiries
router.get("/enterprise-inquiries", async (_req, res, next) => {
  try {
    const inquiries = await EnterpriseInquiry.find({}).sort({ createdAt: -1 });
    res.json({ inquiries });
  } catch (e) { next(e); }
});

// Get general contact messages
router.get("/messages", async (_req, res, next) => {
  try {
    const messages = await Contact.find({}).sort({ createdAt: -1 });
    res.json({ messages });
  } catch (e) { next(e); }
});

export default router;