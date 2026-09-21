import Project from "../models/Project.js";
import Lead from "../models/Lead.js";

const BUDGET_MAX = {
  "<25k": 25000,
  "25k-75k": 75000,
  "75k-150k": 150000,
  "150k-500k": 500000,
  "500k+": Infinity,
};

const BUDGET_LABELS = {
  "<25k": "under $25k",
  "25k-75k": "$25k–$75k",
  "75k-150k": "$75k–$150k",
  "150k-500k": "$150k–$500k",
  "500k+": "$500k+",
};

/**
 * Calculates a match score between a project and an agency.
 * @returns {number} The score. If 0, it's a definite mismatch.
 */
export function calculateMatchScore(project, agency) {
  if (!project || !agency) return 0;
  let score = 0;
  const projectServices = project.services || [];
  const agencyServices = agency.services || [];
  
  const overlap = agencyServices.filter((s) => projectServices.includes(s)).length;
  
  // Requirement: If project specifies services, there MUST be at least one overlap.
  if (projectServices.length > 0 && overlap === 0) {
    return 0;
  }

  if (projectServices.length > 0) {
    score += (overlap / projectServices.length) * 50;
  }

  const cap = BUDGET_MAX[project.budget] ?? Infinity;
  if ((agency.minBudget ?? 0) <= cap) {
    score += 25;
  }

  if (agency.country === project.country) {
    score += 15;
  } else {
    score += 5;
  }

  if (project.industry && (agency.industries || []).includes(project.industry)) {
    score += 10;
  }

  // Quality boost: Add up to 10 points based on rating (e.g., 5.0 rating = 10 pts)
  if (agency.rating) {
    score += agency.rating * 2;
  }

  // Plan tier boost: Growth ("FindingGlobal+", the paid plan) gets +15, Starter (free) +0
  if (agency.plan === "Growth") {
    score += 15;
  }

  // Service match density boost: extra points if the agency matches more of the requested services
  if (projectServices.length > 0) {
    score += (overlap / projectServices.length) * 10;
  }

  return Math.round(score * 10) / 10;
}

/**
 * Human-readable reasons a specific agency was matched to a specific project,
 * built from the same fields calculateMatchScore reads above. Only includes a
 * reason when its underlying condition is actually true — no filler text.
 * @returns {string[]}
 */
export function getMatchReasons(project, agency) {
  if (!project || !agency) return [];
  const reasons = [];
  const projectServices = project.services || [];
  const agencyServices = agency.services || [];
  const overlap = agencyServices.filter((s) => projectServices.includes(s));

  if (overlap.length > 0) {
    reasons.push(`Matches your ${overlap.join(", ")} expertise`);
  }

  const cap = BUDGET_MAX[project.budget] ?? Infinity;
  if ((agency.minBudget ?? 0) <= cap) {
    reasons.push(`Fits your ${BUDGET_LABELS[project.budget] ?? project.budget} project range`);
  }

  if (agency.country && agency.country === project.country) {
    reasons.push(`Based in ${agency.country}`);
  }

  if (project.industry && (agency.industries || []).includes(project.industry)) {
    reasons.push(`Experience in ${project.industry}`);
  }

  if (agency.rating > 0) {
    reasons.push(`${agency.rating}★ rated, ${agency.reviewCount ?? 0} review${agency.reviewCount === 1 ? "" : "s"}`);
  }

  const hasCapacity = agency.plan === "Growth" || (agency.leadsUsed ?? 0) < (agency.leadsLimit ?? 3);
  if (hasCapacity) {
    reasons.push("Currently accepting new projects");
  }

  return reasons;
}

export const MATCH_THRESHOLD = 20;

// Paid-tier priority: Growth ("FindingGlobal+", paid) > Starter (free).
// Used to guarantee paid agencies rank above free ones wherever matches/listings
// are ordered, instead of relying solely on the scoring bonus above (which a
// strong free-tier match could otherwise outweigh).
const PLAN_RANK = { Growth: 1, Starter: 0 };

export function planRank(plan) {
  return PLAN_RANK[plan] ?? 0;
}

/**
 * Sort comparator: paid plan tier first (Growth > Starter), then
 * match score descending within the same tier. Pass agency-scored pairs of
 * shape { plan, score }.
 */
export function comparePriority(a, b) {
  const tierDiff = planRank(b.plan) - planRank(a.plan);
  if (tierDiff !== 0) return tierDiff;
  return b.score - a.score;
}

/**
 * Synchronizes leads for a single agency against all active projects.
 * Useful when an agency profile is updated or approved.
 */
export async function syncAgencyLeads(agency) {
  if (!agency.verified) {
    console.log(`[Matching] Skip syncAgencyLeads for unverified agency: ${agency.slug}`);
    return;
  }
  
  // 1. Load only essential project fields and bypass Mongoose document wrapping
  const activeProjects = await Project.find({ status: "Matching" })
    .select("_id title budget country services industry matchedAgencies")
    .lean();
    
  const leadOps = [];
  const addedProjectIds = [];
  const pulledProjectIds = [];
  const newlyMatchedProjects = [];

  for (const project of activeProjects) {
    const score = calculateMatchScore(project, agency);
    const matchedAgencies = project.matchedAgencies || [];
    const isCurrentlyMatched = matchedAgencies.some(id => String(id) === String(agency._id));
    
    if (score > MATCH_THRESHOLD) {
      if (!isCurrentlyMatched) {
        leadOps.push({
          updateOne: {
            filter: { project: project._id, agency: agency._id },
            update: { $setOnInsert: { project: project._id, agency: agency._id, status: "New", unlocked: false } },
            upsert: true
          }
        });
        addedProjectIds.push(project._id);
        newlyMatchedProjects.push(project);
      }
    } else {
      if (isCurrentlyMatched) {
        leadOps.push({
          deleteMany: {
            filter: { project: project._id, agency: agency._id, status: "New" }
          }
        });
        pulledProjectIds.push(project._id);
      }
    }
  }

  // 2. Perform database writes in batch
  if (leadOps.length > 0) await Lead.bulkWrite(leadOps);
  if (addedProjectIds.length > 0) {
    await Project.updateMany(
      { _id: { $in: addedProjectIds } },
      { $addToSet: { matchedAgencies: agency._id } }
    );
  }
  if (pulledProjectIds.length > 0) {
    await Project.updateMany(
      { _id: { $in: pulledProjectIds } },
      { $pull: { matchedAgencies: agency._id } }
    );
  }

  // 3. Batch retrieve created leads for notification triggers
  if (newlyMatchedProjects.length > 0) {
    try {
      const { notifyAgencyForNewLead, notifyAgencyForBulkLeads } = await import("../utils/notifications.js");
      const createdLeads = await Lead.find({
        project: { $in: newlyMatchedProjects.map(p => p._id) },
        agency: agency._id
      }).select("_id project").lean();

      if (newlyMatchedProjects.length === 1) {
        const project = newlyMatchedProjects[0];
        const lead = createdLeads.find(l => String(l.project) === String(project._id));
        if (lead) {
          notifyAgencyForNewLead(agency._id, project.title, project.budget, "Matched Project", lead._id).catch(err => {
            console.error(`Background lead sync notification failed for project ${project._id}:`, err);
          });
        }
      } else {
        notifyAgencyForBulkLeads(agency._id, newlyMatchedProjects.length).catch(err => {
          console.error(`Background bulk lead sync notification failed:`, err);
        });
      }
    } catch (err) {
      console.error("Failed to trigger notifications in syncAgencyLeads:", err);
    }
  }
}
