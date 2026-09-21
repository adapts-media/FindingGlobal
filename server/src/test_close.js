import "dotenv/config";

async function run() {
  const tokenRes = await fetch("http://localhost:4000/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "client@example.com", password: "password" })
  });
  const { token } = await tokenRes.json();
  
  // 1. Create project
  const createRes = await fetch("http://localhost:4000/api/projects", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      title: "Test Project Close",
      services: ["Web Development"],
      budget: "25k-75k",
      country: "United Arab Emirates",
      industry: "Technology & SaaS"
    })
  });
  const { project } = await createRes.json();
  console.log("Created project:", project._id);
  const hiredAgency = project.matchedAgencies[0]._id;
  
  // 2. Patch project
  const patchRes = await fetch(`http://localhost:4000/api/projects/${project._id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
    body: JSON.stringify({
      status: "Closed",
      hiredAgency
    })
  });
  const patchJson = await patchRes.json();
  console.log("Patched status:", patchJson.project.status);
  
  // 3. Check leads
  const mongoose = await import("mongoose");
  const Lead = (await import("./models/Lead.js")).default;
  await mongoose.connect(process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena");
  const leads = await Lead.find({ project: project._id }).populate("agency");
  leads.forEach(l => console.log(`  Lead for ${l.agency.name}: ${l.status}`));
  
  process.exit(0);
}
run();
