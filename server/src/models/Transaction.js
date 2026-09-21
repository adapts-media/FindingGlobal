import mongoose from "mongoose";

const TransactionSchema = new mongoose.Schema(
  {
    paymentIntentId: { type: String, required: true, unique: true, index: true },
    agencyId: { type: mongoose.Schema.Types.ObjectId, ref: "Agency", required: true },
    plan: { type: String, required: true },
    billingPeriod: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true },
    status: { type: String, enum: ["pending", "completed", "failed", "canceled"], default: "pending" },
  },
  { timestamps: true }
);

export default mongoose.model("Transaction", TransactionSchema);
