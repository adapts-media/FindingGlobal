import { Router } from "express";
import Lead from "../models/Lead.js";
import Agency from "../models/Agency.js";
import Project from "../models/Project.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { createNotification } from "../utils/notifications.js";
import { getAgencyForUser } from "../utils/agency.js";
import { getMatchReasons } from "../lib/matching.js";

const router = Router();
const BUDGET_MAX = { "<25k": 25000, "25k-75k": 75000, "75k-150k": 150000, "150k-500k": 500000, "500k+": Infinity };

// Agency users: list leads for their agency. Admins: list all.
router.get("/", authRequired, requireRole("agency", "admin"), async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency || !agency.verified) return res.json({ leads: [] });
      filter.agency = agency._id;
    }
    const leads = await Lead.find(filter)
      .sort({ createdAt: -1 })
      .populate("project", "title budget country services description industry clientUserId")
      .populate("agency", "name slug plan leadsUsed leadsLimit services minBudget country industries rating reviewCount");

    // Clean up orphaned leads (where project was manually deleted from database)
    const validLeads = [];
    const orphanedIds = [];
    for (const l of leads) {
      if (l.type !== "Direct" && l.project == null) orphanedIds.push(l._id);
      else validLeads.push(l);
    }
    if (orphanedIds.length > 0) {
      Lead.deleteMany({ _id: { $in: orphanedIds } }).exec();
    }

    // Attach why-you-were-matched reasons to each matched lead (cheap, no extra queries).
    const leadsOut = validLeads.map((l) => {
      const matchReasons = l.type === "Matched" && l.project && l.agency
        ? getMatchReasons(l.project, l.agency)
        : [];
      return { ...l.toObject(), matchReasons };
    });

    res.json({ leads: leadsOut });
  } catch (e) { next(e); }
});

router.get("/:id", authRequired, requireRole("agency", "admin"), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate({
        path: "project",
        populate: { path: "clientUserId", select: "name email company" }
      })
      .populate("agency", "name slug plan leadsUsed leadsLimit logoSeed calendlyLink services minBudget country industries rating reviewCount");

    if (!lead) {
      console.log(`[leads] Lead not found: ${req.params.id}`);
      return res.status(404).json({ error: "Lead not found" });
    }

    if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency || String(lead.agency._id) !== String(agency._id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!agency.verified) {
        return res.status(403).json({ error: "Forbidden: Agency profile is pending approval." });
      }

      // Monthly Quota Reset Logic
      const now = new Date();
      if (!agency.leadsLastResetDate) {
        agency.leadsLastResetDate = now;
      } else if (
        agency.leadsLastResetDate.getMonth() !== now.getMonth() ||
        agency.leadsLastResetDate.getFullYear() !== now.getFullYear()
      ) {
        agency.leadsUsed = 0;
        agency.leadsLastResetDate = now;
        await agency.save();
      }

      // Handle subscription limits for Starter plan
      // Only check limits if the lead is NOT unlocked AND it's a "New" lead. 
      // If they already won/lost it, they should always be able to see it.
      if (agency.plan === "Starter" && !lead.unlocked && lead.status === "New") {
        if (agency.leadsUsed >= (agency.leadsLimit || 3)) {
          return res.status(403).json({
            error: "Monthly lead limit reached",
            code: "LIMIT_REACHED",
            limit: agency.leadsLimit
          });
        }
        // Auto-unlock the lead and increment usage
        lead.unlocked = true;
        await lead.save();
        agency.leadsUsed += 1;
        await agency.save();
      }
    }

    // Why-you-were-matched reasons, only meaningful for engine-matched leads (not direct contact-form leads).
    const matchReasons = lead.type === "Matched" && lead.project && lead.agency
      ? getMatchReasons(lead.project, lead.agency)
      : [];

    res.json({ lead: { ...lead.toObject(), matchReasons } });
  } catch (e) { next(e); }
});

router.patch("/:id", authRequired, requireRole("agency", "admin", "client"), async (req, res, next) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency || String(lead.agency) !== String(agency._id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!agency.verified) {
        return res.status(403).json({ error: "Forbidden: Agency profile is pending approval." });
      }
      if (agency.plan === "Starter" && !lead.unlocked) {
        return res.status(403).json({ error: "Unlock this lead first to change its status" });
      }
    } else if (req.user.role === "client") {
      // Clients can only update leads for their own projects
      const project = await Project.findById(lead.project);
      if (!project || String(project.clientUserId) !== req.user.id) {
        return res.status(403).json({ error: "Forbidden" });
      }
    }

    if (req.body.status) lead.status = req.body.status;
    if (req.body.meetingBooked === true) lead.status = "In Conversation";
    if (req.body.note !== undefined) lead.note = req.body.note;

    // Trigger meeting request notification for client
    if (req.body.meetingRequested === true && !lead.meetingRequested) {
      try {
        const project = await Project.findById(lead.project);
        const agency = await Agency.findById(lead.agency);
        if (project && project.clientUserId && agency) {
          await createNotification({
            recipientId: project.clientUserId,
            title: "Meeting Requested",
            message: `Agency "${agency.name}" has requested a meeting for your project "${project.title}".`,
            type: "meeting_request",
            link: `/projects/${project._id}`,
          });
        }
      } catch (err) {
        console.error("[leads] Failed to trigger meeting request notification:", err);
      }
    }

    // Trigger meeting booked notification
    if (req.body.meetingBooked === true && !lead.meetingBooked) {
      try {
        const project = await Project.findById(lead.project);
        const agency = await Agency.findById(lead.agency).populate("ownerUserId");
        
        if (req.user.role === "agency" || req.user.role === "admin") {
          // If agency confirms/books the meeting, notify the client
          if (project && project.clientUserId && agency) {
            await createNotification({
              recipientId: project.clientUserId,
              title: "Meeting Confirmed!",
              message: `Agency "${agency.name}" has confirmed and booked a meeting for your project "${project.title}".`,
              type: "meeting_booked",
              link: `/projects/${project._id}`,
            });
          }
        } else if (req.user.role === "client") {
          // If client confirms/books the meeting, notify the agency owner
          if (project && agency && agency.ownerUserId) {
            await createNotification({
              recipientId: agency.ownerUserId._id,
              title: "Meeting Confirmed!",
              message: `The client for project "${project.title}" has booked a meeting with your agency.`,
              type: "meeting_booked",
              link: `/leads/${lead._id}`,
            });
          }
        }
      } catch (err) {
        console.error("[leads] Failed to trigger meeting booked notification:", err);
      }
    }

    if (req.body.meetingRequested !== undefined) lead.meetingRequested = req.body.meetingRequested;
    if (req.body.meetingBooked !== undefined) lead.meetingBooked = req.body.meetingBooked;
    
    await lead.save();
    
    // Re-populate for frontend consistency
    const updated = await Lead.findById(lead._id)
      .populate({
        path: "project",
        populate: { path: "clientUserId", select: "name email company" }
      })
      .populate("agency", "name slug plan leadsUsed leadsLimit logoSeed calendlyLink");

    res.json({ lead: updated });
  } catch (e) { next(e); }
});

export default router;