import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    services: [String],
    budget: { type: String, enum: ["<25k", "25k-75k", "75k-150k", "150k-500k", "500k+"] },
    country: String,
    industry: String,
    status: {
      type: String,
      enum: ["Matching", "In Review", "Active", "Closed"],
      default: "Matching",
    },
    matchedAgencies: [{ type: mongoose.Schema.Types.ObjectId, ref: "Agency" }],
    hiredAgency: { type: mongoose.Schema.Types.ObjectId, ref: "Agency" },
    clientUserId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  },
  { timestamps: true }
);

export default mongoose.model("Project", ProjectSchema);