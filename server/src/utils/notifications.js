import Notification from "../models/Notification.js";
import User from "../models/User.js";
import { sendEmail } from "./mailer.js";

/**
 * Creates an in-app notification and sends an email to the recipient.
 */
export async function createNotification({ recipientId, title, message, type = "general", link = "" }) {
  try {
    // 1. Create the in-app notification
    const notification = await Notification.create({
      recipient: recipientId,
      title,
      message,
      type,
      link,
    });

    // 2. Fetch recipient's email
    const recipientUser = await User.findById(recipientId);
    if (recipientUser && recipientUser.email) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const emailSubject = `🔔 Finding Global: ${title}`;
      const emailText = `${message}\n\nView details here: ${frontendUrl}${link}\n\nCheers,\nFinding Global Team`;
      
      const emailHtml = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px; background-color: #fcfcfc;">
          <h2 style="color: #0b0f19; border-bottom: 2px solid #f3f4f6; padding-bottom: 10px; margin-top: 0;">Finding Global</h2>
          <p style="font-size: 16px; color: #1f2937; font-weight: bold;">Hello ${recipientUser.name || "there"},</p>
          <p style="font-size: 15px; color: #4b5563; line-height: 1.6;">${message}</p>
          ${link ? `
            <div style="margin: 25px 0;">
              <a href="${frontendUrl}${link}" style="background-color: #0038ff; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; display: inline-block;">
                View Details
              </a>
            </div>
          ` : ""}
          <hr style="border: 0; border-top: 1px solid #f3f4f6; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9ca3af; line-height: 1.4;">
            This is an automated notification from Finding Global. You received this email because you are a registered user.
          </p>
        </div>
      `;

      // Trigger email sending in background (don't await to avoid blocking the caller)
      sendEmail({
        to: recipientUser.email,
        subject: emailSubject,
        text: emailText,
        html: emailHtml,
      }).catch(err => console.error("[Notification] Email fail:", err));
    }

    return notification;
  } catch (error) {
    console.error("[Notification] Error creating notification:", error);
  }
}

/**
 * Specifically notifies an agency about a new lead.
 */

export async function notifyAgencyForNewLead(agencyId, projectTitle, budget, leadType = "Matched Project", leadId = null) {
  try {
    const Agency = (await import("../models/Agency.js")).default;
    const agency = await Agency.findById(agencyId).populate("ownerUserId");
    if (!agency) {
      console.log(`[Notification] Agency not found for Agency ID: ${agencyId}`);
      return;
    }

    let ownerUserId = agency.ownerUserId;
    if (!ownerUserId) {
      const User = (await import("../models/User.js")).default;
      const ownerUser = await User.findOne({ agencySlug: agency.slug, role: "agency" });
      if (ownerUser) {
        ownerUserId = ownerUser;
        agency.ownerUserId = ownerUser._id;
        await agency.save();
      }
    }

    if (!ownerUserId) {
      console.log(`[Notification] Agency owner not found for Agency ID: ${agencyId} (slug: ${agency.slug})`);
      return;
    }

    const title = "New Lead Received!";
    let message = "";
    let link = "/agency-inbox";

    if (leadType === "Direct Contact") {
      link = "/agency-inbox";
    } else if (leadId) {
      link = `/leads/${leadId}`;
    } else {
      try {
        const Lead = (await import("../models/Lead.js")).default;
        const query = { agency: agencyId, type: "Matched" };
        const latestLead = await Lead.findOne(query).sort({ createdAt: -1 });
        if (latestLead) {
          link = `/leads/${latestLead._id}`;
        }
      } catch (err) {
        console.error("[Notification] Error finding latest lead for link:", err);
      }
    }

    if (leadType === "Direct Contact") {
      message = `You have received a direct contact request on your agency page! Go to your inbox to view details.`;
    } else {
      message = `Great news! Your agency has been matched with a new project: "${projectTitle}". Estimated Budget: ${budget}. Go to your inbox to unlock and view full details!`;
    }

    await createNotification({
      recipientId: ownerUserId._id,
      title,
      message,
      type: "new_lead",
      link,
    });
    console.log(`[Notification] Notified agency ${agency.name} (owner: ${ownerUserId.email}) for lead on ${projectTitle || "Direct Lead"}`);
  } catch (error) {
    console.error("[Notification] Failed to notify agency for new lead:", error);
  }
}

/**
 * Notifies an agency about multiple new leads at once (used during bulk syncs).
 */
export async function notifyAgencyForBulkLeads(agencyId, count) {
  try {
    const Agency = (await import("../models/Agency.js")).default;
    const agency = await Agency.findById(agencyId).populate("ownerUserId");
    if (!agency) return;

    let ownerUserId = agency.ownerUserId;
    if (!ownerUserId) {
      const User = (await import("../models/User.js")).default;
      const ownerUser = await User.findOne({ agencySlug: agency.slug, role: "agency" });
      if (ownerUser) {
        ownerUserId = ownerUser;
        agency.ownerUserId = ownerUser._id;
        await agency.save();
      }
    }
    if (!ownerUserId) return;

    await createNotification({
      recipientId: ownerUserId._id,
      title: "Multiple New Matches!",
      message: `Great news! Your agency has been matched with ${count} new projects. Go to your inbox to unlock and view full details!`,
      type: "new_lead",
      link: "/agency-inbox",
    });
    console.log(`[Notification] Notified agency ${agency.name} for ${count} bulk leads`);
  } catch (error) {
    console.error("[Notification] Failed to bulk notify agency:", error);
  }
}
