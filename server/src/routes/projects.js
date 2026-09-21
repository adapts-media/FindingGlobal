import { Router } from "express";
import { z } from "zod";
import Project from "../models/Project.js";
import Agency from "../models/Agency.js";
import Lead from "../models/Lead.js";
import User from "../models/User.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import { notifyAgencyForNewLead } from "../utils/notifications.js";
import { getAgencyForUser } from "../utils/agency.js";

import { calculateMatchScore, MATCH_THRESHOLD, comparePriority } from "../lib/matching.js";

const router = Router();

/**
 * Run the matching algorithm against all agencies and return up to `limit`
 * agency ObjectIds whose score exceeds the threshold.
 */
async function runMatching({ services = [], budget, country, industry, limit = 10 } = {}) {
  // Filter agencies by some basic criteria at the DB level to avoid fetching thousands of irrelevant records
  const query = {
    verified: true,
    $or: [
      { country: country },
      { services: { $in: services } }
    ]
  };

  const potentialAgencies = await Agency.find(query)
    .select("_id services minBudget country industries rating plan")
    .lean();
  
  return potentialAgencies
    .map((a) => ({
      id: a._id,
      plan: a.plan,
      score: calculateMatchScore({ services, budget, country, industry }, a)
    }))
    .filter((s) => s.score > MATCH_THRESHOLD)
    // Paid-tier agencies (Growth/"FindingGlobal+") rank above free Starter
    // agencies among everyone who genuinely matches; free agencies fill remaining slots.
    .sort(comparePriority)
    .slice(0, Math.min(Number(limit) || 10, 20))
    .map((s) => s.id);
}

const ProjectSchema = z.object({
  title: z.string().min(2).max(200),
  description: z.string().max(5000).optional(),
  services: z.array(z.string()).default([]),
  budget: z.enum(["<25k", "25k-75k", "75k-150k", "150k-500k", "500k+"]),
  country: z.string().min(1),
  industry: z.string().min(1),
});

router.get("/", authRequired, async (req, res, next) => {
  try {
    const filter = req.user.role === "admin" ? {} : { clientUserId: req.user.id };
    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .populate("matchedAgencies")
      .populate("clientUserId", "name company email")
      .lean();
    res.set("Cache-Control", "private, no-cache");
    res.json({ projects });
  } catch (e) { next(e); }
});

router.post("/", authRequired, requireRole("client", "admin"), async (req, res, next) => {
  try {
    const data = ProjectSchema.parse(req.body);
    const matches = await runMatching(data);

    const project = await Project.create({
      ...data,
      clientUserId: req.user.id,
      matchedAgencies: matches,
    });

    await project.populate("matchedAgencies");

    // create leads for matched agencies
    const createdLeads = await Lead.insertMany(matches.map((agencyId) => ({ project: project._id, agency: agencyId })));
    
    // notify matched agencies
    for (const agencyId of matches) {
      const leadForAgency = createdLeads.find(l => String(l.agency) === String(agencyId));
      notifyAgencyForNewLead(agencyId, project.title, project.budget, "Matched Project", leadForAgency?._id).catch(err => {
        console.error(`Failed to send background lead notification to agency ${agencyId}:`, err);
      });
    }

    res.status(201).json({ project });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id).populate(["matchedAgencies", "hiredAgency"]);
    if (!project) return res.status(404).json({ error: "Project not found" });

    // Fetch leads for this project to show meeting requests to the client
    let leads = [];
    if (req.user.role === "client" || req.user.role === "admin") {
      leads = await Lead.find({ project: project._id }).populate("agency", "name slug logoSeed calendlyLink");
    }

    if (req.user.role !== "admin" && String(project.clientUserId) !== req.user.id) {
      // Check if agency is matched
      if (req.user.role === "agency") {
        const agency = await getAgencyForUser(req.user.id);
        if (!agency || !project.matchedAgencies.some((a) => String(a._id) === String(agency._id))) {
          return res.status(403).json({ error: "Forbidden" });
        }
      } else {
        return res.status(403).json({ error: "Forbidden" });
      }
    }
    res.json({ project, leads });
  } catch (e) { next(e); }
});

const UpdateSchema = z.object({
  title: z.string().min(2).max(200).optional(),
  description: z.string().max(5000).optional(),
  services: z.array(z.string()).optional(),
  budget: z.enum(["<25k", "25k-75k", "75k-150k", "150k-500k", "500k+"]).optional(),
  country: z.string().min(1).optional(),
  industry: z.string().min(1).optional(),
  status: z.enum(["Matching", "In Review", "Active", "Closed"]).optional(),
  hiredAgency: z.string().nullable().optional(),
});

router.patch("/:id", authRequired, requireRole("client", "admin"), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (req.user.role !== "admin" && String(project.clientUserId) !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }
    const data = UpdateSchema.parse(req.body);
    Object.assign(project, data);

    // Only re-run matching and sync leads if the project is still in the "Matching" phase
    if (project.status === "Matching") {
      const newMatches = await runMatching({
        services: project.services,
        budget:   project.budget,
        country:  project.country,
        industry: project.industry,
      });

      const prevIds  = project.matchedAgencies.map(String);
      const newIds   = newMatches.map(String);
      const added    = newIds.filter((id) => !prevIds.includes(id));
      const removed  = prevIds.filter((id) => !newIds.includes(id));

      // Sync leads: add for newly matched, remove for de-matched
      if (added.length) {
        const createdLeads = await Lead.insertMany(added.map((agencyId) => ({ project: project._id, agency: agencyId })));
        for (const agencyId of added) {
          const leadForAgency = createdLeads.find(l => String(l.agency) === String(agencyId));
          notifyAgencyForNewLead(agencyId, project.title, project.budget, "Matched Project", leadForAgency?._id).catch(err => {
            console.error(`Failed to send background lead notification to agency ${agencyId}:`, err);
          });
        }
      }
      if (removed.length) await Lead.deleteMany({ project: project._id, agency: { $in: removed }, status: "New" }); // Only delete if never touched

      project.matchedAgencies = newMatches;
    }

    // Handle project closure
    if (project.status === "Closed") {
      if (project.hiredAgency) {
        await Lead.updateMany(
          { project: project._id, agency: project.hiredAgency },
          { $set: { status: "Won" } }
        );
        await Lead.updateMany(
          { project: project._id, agency: { $ne: project.hiredAgency } },
          { $set: { status: "Lost" } }
        );
      } else {
        await Lead.updateMany(
          { project: project._id },
          { $set: { status: "Lost" } }
        );
      }
    }

    await project.save();
    await project.populate(["matchedAgencies", "hiredAgency"]);
    res.json({ project });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: "Invalid input", issues: err.issues });
    next(err);
  }
});

router.delete("/:id", authRequired, requireRole("client", "admin"), async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: "Project not found" });
    if (req.user.role !== "admin" && String(project.clientUserId) !== req.user.id) {
      return res.status(403).json({ error: "Forbidden" });
    }

    await Lead.deleteMany({ project: project._id });
    await Project.deleteOne({ _id: project._id });

    res.json({ ok: true });
  } catch (e) { next(e); }
});

const AVAILABLE_SERVICES = [
  "Web Development",
  "Mobile Development",
  "Strategy & Consulting",
  "Creative & Design",
  "Performance & Paid Media",
  "SEO & Content",
  "Social Media Marketing",
  "Branding & PR"
];

const SERVICE_KEYWORDS = {
  "web": "Web Development",
  "website": "Web Development",
  "e-commerce": "Web Development",
  "ecommerce": "Web Development",
  "shop": "Web Development",
  "html": "Web Development",
  "react": "Web Development",
  "wordpress": "Web Development",
  
  "mobile": "Mobile Development",
  "app": "Mobile Development",
  "ios": "Mobile Development",
  "android": "Mobile Development",
  "application": "Mobile Development",
  "swift": "Mobile Development",
  
  "strategy": "Strategy & Consulting",
  "consulting": "Strategy & Consulting",
  "advisory": "Strategy & Consulting",
  "business": "Strategy & Consulting",
  
  "design": "Creative & Design",
  "creative": "Creative & Design",
  "ui": "Creative & Design",
  "ux": "Creative & Design",
  "graphics": "Creative & Design",
  "illustration": "Creative & Design",
  
  "marketing": "Performance & Paid Media",
  "performance": "Performance & Paid Media",
  "ads": "Performance & Paid Media",
  "ad": "Performance & Paid Media",
  "ppc": "Performance & Paid Media",
  "paid": "Performance & Paid Media",
  "google": "Performance & Paid Media",
  
  "seo": "SEO & Content",
  "content": "SEO & Content",
  "writing": "SEO & Content",
  "blog": "SEO & Content",
  
  "social": "Social Media Marketing",
  "instagram": "Social Media Marketing",
  "facebook": "Social Media Marketing",
  "tiktok": "Social Media Marketing",
  
  "brand": "Branding & PR",
  "branding": "Branding & PR",
  "pr": "Branding & PR",
  "public relations": "Branding & PR",
  "logo": "Branding & PR"
};

router.post("/predict-service", (req, res) => {
  const { query } = req.body;
  if (!query || typeof query !== "string") {
    return res.status(400).json({ error: "Query string is required" });
  }

  const normalized = query.toLowerCase().trim();
  
  // 1. Direct matching or substring matching
  for (const service of AVAILABLE_SERVICES) {
    const serviceLower = service.toLowerCase();
    if (normalized.includes(serviceLower) || (normalized.length >= 3 && serviceLower.includes(normalized))) {
      return res.json({ service });
    }
  }

  // 2. Keyword mapping
  const words = normalized.split(/\s+/);
  for (const word of words) {
    const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    if (SERVICE_KEYWORDS[cleanWord]) {
      return res.json({ service: SERVICE_KEYWORDS[cleanWord] });
    }
  }

  // 3. Fallback
  res.json({ service: "Web Development" });
});

export default router;