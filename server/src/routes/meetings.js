import { Router } from "express";
import Meeting from "../models/Meeting.js";
import Agency from "../models/Agency.js";
import User from "../models/User.js";
import { authRequired } from "../middleware/auth.js";
import { createNotification } from "../utils/notifications.js";
import { getAgencyForUser } from "../utils/agency.js";
import Lead from "../models/Lead.js";
import Project from "../models/Project.js";

const router = Router();

// GET / - List meetings for logged-in user
router.get("/", authRequired, async (req, res, next) => {
  try {
    let filter = {};
    if (req.user.role === "client") {
      filter.client = req.user.id;
    } else if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency) return res.json({ meetings: [] });
      filter.agency = agency._id;
    } else if (req.user.role === "admin") {
      // Admins see all
    } else {
      return res.status(403).json({ error: "Forbidden" });
    }

    const meetings = await Meeting.find(filter)
      .sort({ createdAt: -1 })
      .populate("client", "name email company")
      .populate("agency", "name slug logoSeed");

    res.json({ meetings });
  } catch (e) {
    next(e);
  }
});

// GET /requests - List incoming meeting requests for the client
router.get("/requests", authRequired, async (req, res, next) => {
  try {
    if (req.user.role !== "client" && req.user.role !== "admin") {
      return res.status(403).json({ error: "Only clients or admins can access meeting requests." });
    }
    const clientProjects = await Project.find({ clientUserId: req.user.id }).select("_id");
    const projectIds = clientProjects.map(p => p._id);
    const requests = await Lead.find({
      project: { $in: projectIds },
      meetingRequested: true
    })
      .sort({ updatedAt: -1 })
      .populate("agency", "name slug logoSeed calendlyLink")
      .populate({
        path: "project",
        populate: { path: "clientUserId", select: "name email company" }
      });
    res.json({ requests });
  } catch (e) {
    next(e);
  }
});

// POST / - Book a meeting
router.post("/", authRequired, async (req, res, next) => {
  try {
    const { agencySlug, date, time, topic, notes, timezone, meetingLink, leadId } = req.body;
    if (!agencySlug || !date || !time || !topic || !meetingLink) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const agency = await Agency.findOne({ slug: agencySlug }).populate("ownerUserId");
    if (!agency) {
      return res.status(404).json({ error: "Agency not found" });
    }

    const clientUser = await User.findById(req.user.id);
    if (!clientUser) {
      return res.status(404).json({ error: "Client user not found" });
    }

    const tzString = timezone || "GST (UTC+4)";

    const meeting = await Meeting.create({
      client: clientUser._id,
      clientName: clientUser.name,
      clientEmail: clientUser.email,
      agency: agency._id,
      agencySlug,
      agencyName: agency.name,
      date,
      time,
      timezone: tzString,
      topic,
      notes,
      meetingLink: meetingLink || undefined,
      status: "accepted"
    });

    // Auto-update lead status if exists
    let lead = null;
    if (leadId) {
      lead = await Lead.findById(leadId);
    } else {
      const projects = await Project.find({ clientUserId: clientUser._id });
      const projectIds = projects.map(p => p._id);
      lead = await Lead.findOne({
        agency: agency._id,
        project: { $in: projectIds }
      });
    }

    if (lead) {
      lead.meetingBooked = true;
      lead.status = "In Conversation";
      await lead.save();
    }

    // Notify agency owner
    if (agency.ownerUserId) {
      await createNotification({
        recipientId: agency.ownerUserId._id,
        title: "Meeting Scheduled",
        message: `${clientUser.name} has scheduled a meeting on ${date} at ${time} (${tzString}) regarding "${topic}".`,
        type: "general",
        link: "/agency-dashboard"
      });
    }

    res.status(201).json({ meeting });
  } catch (e) {
    next(e);
  }
});

// PATCH /:id - Update meeting status
router.patch("/:id", authRequired, async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!["accepted", "declined", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    const meeting = await Meeting.findById(req.params.id);
    if (!meeting) {
      return res.status(404).json({ error: "Meeting not found" });
    }

    // Auth check
    if (req.user.role === "client") {
      if (String(meeting.client) !== String(req.user.id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (status !== "cancelled") {
        return res.status(400).json({ error: "Clients can only cancel meetings" });
      }
    } else if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency || String(meeting.agency) !== String(agency._id)) {
        return res.status(403).json({ error: "Forbidden" });
      }
      if (!["accepted", "declined"].includes(status)) {
        return res.status(400).json({ error: "Agencies can only accept or decline meetings" });
      }
    } else if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    meeting.status = status;
    await meeting.save();

    // Notify other party
    if (req.user.role === "agency" || req.user.role === "admin") {
      // Notify client
      await createNotification({
        recipientId: meeting.client,
        title: `Meeting ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: `Your meeting request with ${meeting.agencyName} on ${meeting.date} at ${meeting.time} has been ${status}.`,
        type: "general",
        link: "/dashboard"
      });
    } else {
      // Notify agency
      const agency = await Agency.findById(meeting.agency);
      if (agency && agency.ownerUserId) {
        await createNotification({
          recipientId: agency.ownerUserId._id,
          title: "Meeting Cancelled",
          message: `The meeting request from ${meeting.clientName} on ${meeting.date} at ${meeting.time} has been cancelled.`,
          type: "general",
          link: "/agency-dashboard"
        });
      }
    }

    res.json({ meeting });
  } catch (e) {
    next(e);
  }
});

export default router;
