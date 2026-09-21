import { Router } from "express";
import Notification from "../models/Notification.js";
import Agency from "../models/Agency.js";
import { authRequired } from "../middleware/auth.js";
import { getAgencyForUser } from "../utils/agency.js";

const router = Router();

// Get all notifications for current user
router.get("/", authRequired, async (req, res, next) => {
  try {
    if (req.user.role === "agency") {
      const agency = await getAgencyForUser(req.user.id);
      if (!agency || !agency.verified) {
        return res.json({ notifications: [] });
      }
    }

    const notifications = await Notification.find({ recipient: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ notifications });
  } catch (e) {
    next(e);
  }
});

// Mark single notification as read or unread
router.patch("/:id/read", authRequired, async (req, res, next) => {
  try {
    const { read = true } = req.body || {};
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { read },
      { new: true }
    );
    if (!notification) {
      return res.status(404).json({ error: "Notification not found" });
    }
    res.json({ notification });
  } catch (e) {
    next(e);
  }
});

// Mark all notifications as read
router.post("/read-all", authRequired, async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user.id, read: false },
      { read: true }
    );
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
