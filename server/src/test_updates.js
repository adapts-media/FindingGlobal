import mongoose from "mongoose";
import "dotenv/config";
import Lead from "./models/Lead.js";
import Project from "./models/Project.js";

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const p = await Project.findById("69f2f15ba06292b52286506a"); // nnii project
  
  console.log("hiredAgency:", p.hiredAgency);
  console.log("type:", typeof p.hiredAgency);
  
  const res1 = await Lead.updateMany(
    { project: p._id, agency: p.hiredAgency },
    { $set: { status: "Won" } }
  );
  console.log("res1:", res1);
  
  const res2 = await Lead.updateMany(
    { project: p._id, agency: { $ne: p.hiredAgency } },
    { $set: { status: "Lost" } }
  );
  console.log("res2:", res2);
  process.exit(0);
}
run();
