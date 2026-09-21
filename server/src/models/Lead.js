import mongoose from "mongoose";

const LeadSchema = new mongoose.Schema(
  {
    project: { type: mongoose.Schema.Types.ObjectId, ref: "Project", index: true },
    agency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true, index: true },
    type: { type: String, enum: ["Matched", "Direct"], default: "Matched" },
    status: {
      type: String,
      enum: ["New", "Quoted", "In Conversation", "Won", "Lost"],
      default: "New",
    },
    note: String,
    unlocked: { type: Boolean, default: false },
    meetingRequested: { type: Boolean, default: false },
    meetingBooked: { type: Boolean, default: false },
    // For direct leads from contact form
    directContact: {
      name: String,
      email: String,
      company: String,
      budget: String,
      message: String
    }
  },
  { timestamps: true }
);

export default mongoose.model("Lead", LeadSchema);