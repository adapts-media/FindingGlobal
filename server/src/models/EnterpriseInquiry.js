import mongoose from "mongoose";

const EnterpriseInquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  company: { type: String },
  phone: { type: String },
  requirements: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.EnterpriseInquiry || mongoose.model("EnterpriseInquiry", EnterpriseInquirySchema);
