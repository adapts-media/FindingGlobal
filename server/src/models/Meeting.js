import mongoose from "mongoose";

const MeetingSchema = new mongoose.Schema(
  {
    client: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    clientName: { type: String, required: true },
    clientEmail: { type: String, required: true },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true, index: true },
    agencySlug: { type: String, required: true, index: true },
    agencyName: { type: String, required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD
    time: { type: String, required: true }, // Format: HH:MM
    duration: { type: Number, default: 30 }, // in minutes
    topic: { type: String, required: true },
    notes: String,
    timezone: { type: String, default: "GST (UTC+4)" },
    status: {
      type: String,
      enum: ["pending", "accepted", "declined", "cancelled"],
      default: "pending",
      index: true
    },
    meetingLink: { type: String }
  },
  { timestamps: true }
);

export default mongoose.model("Meeting", MeetingSchema);
