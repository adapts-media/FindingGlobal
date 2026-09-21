import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: { type: String, enum: ["new_lead", "system", "general", "meeting_request", "meeting_booked"], default: "general" },
    read: { type: Boolean, default: false },
    link: { type: String }, // e.g. "/agency-inbox" or "/projects/123"
  },
  { timestamps: true }
);

export default mongoose.model("Notification", NotificationSchema);
