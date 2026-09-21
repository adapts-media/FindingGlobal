import Agency from "../models/Agency.js";
import User from "../models/User.js";

/**
 * Checks if the agency's paid subscription has expired.
 * If expired, automatically downgrades to the Starter (free) plan.
 * 
 * @param {import("../models/Agency.js").default} agency 
 * @returns {Promise<boolean>} - True if the agency was updated/saved.
 */
export async function checkAndUpdateSubscription(agency) {
  if (!agency) return false;
  
  const now = new Date();
  let changed = false;

  // 1. Subscription Expiration Check
  if (agency.plan !== "Starter" && agency.planExpiresAt && agency.planExpiresAt < now) {
    agency.plan = "Starter";
    agency.planExpiresAt = undefined;
    agency.planBillingPeriod = "none";
    agency.leadsLimit = 3;
    changed = true;
  }

  // 2. Monthly Quota Reset Logic
  if (!agency.leadsLastResetDate) {
    agency.leadsLastResetDate = now;
    changed = true;
  } else if (
    agency.leadsLastResetDate.getMonth() !== now.getMonth() ||
    agency.leadsLastResetDate.getFullYear() !== now.getFullYear()
  ) {
    agency.leadsUsed = 0;
    agency.leadsLastResetDate = now;
    changed = true;
  }

  if (changed) {
    await agency.save();
  }

  return changed;
}

/**
 * Finds the agency associated with a given user ID.
 * It checks both ownerUserId and the user's agencySlug.
 * If found via agencySlug but ownerUserId is not set, it heals the database.
 * 
 * @param {string} userId 
 * @returns {Promise<import("../models/Agency.js").default | null>}
 */
export async function getAgencyForUser(userId) {
  if (!userId) return null;
  
  // 1. Try finding by ownerUserId first
  let agency = await Agency.findOne({ ownerUserId: userId });
  if (agency) {
    await checkAndUpdateSubscription(agency);
    return agency;
  }

  // 2. If not found, look up the user to get their agencySlug
  const user = await User.findById(userId);
  if (!user || !user.agencySlug) return null;

  // 3. Find agency by the user's agencySlug
  agency = await Agency.findOne({ slug: user.agencySlug });
  if (agency) {
    // Heal the database: associate ownerUserId
    agency.ownerUserId = userId;
    await checkAndUpdateSubscription(agency);
  }

  return agency;
}
