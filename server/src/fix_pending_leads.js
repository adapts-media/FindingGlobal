import mongoose from "mongoose";
import "dotenv/config";
import Meeting from "./models/Meeting.js";
import Lead from "./models/Lead.js";
import Project from "./models/Project.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  
  // Find all active accepted/confirmed meetings
  const meetings = await Meeting.find({ status: "accepted" });
  let count = 0;
  
  for (const meeting of meetings) {
    const projects = await Project.find({ clientUserId: meeting.client });
    const projectIds = projects.map(p => p._id);
    
    const lead = await Lead.findOne({
      agency: meeting.agency,
      project: { $in: projectIds }
    });
    
    if (lead && (!lead.meetingBooked || lead.status !== "In Conversation")) {
      lead.meetingBooked = true;
      lead.status = "In Conversation";
      await lead.save();
      count++;
    }
  }
  
  console.log(`Updated ${count} leads to 'In Conversation' & meetingBooked = true`);
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
