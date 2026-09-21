import "dotenv/config";
import mongoose from "mongoose";
import User from "../src/models/User.js";
import Agency from "../src/models/Agency.js";
import { getAgencyForUser } from "../src/utils/agency.js";

async function main() {
  const MONGODB_URI = process.env.MONGODB_URI;
  if (!MONGODB_URI) {
    console.error("MONGODB_URI is not set!");
    return;
  }
  await mongoose.connect(MONGODB_URI);

  const email = "adapts@media.com";
  const user = await User.findOne({ email });
  if (!user) {
    console.error("User not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("Found user:", email, "with ID:", user._id);

  // 1. Manually set agency to expired Growth plan in database
  const agency = await Agency.findOne({ ownerUserId: user._id });
  if (!agency) {
    console.error("Agency profile not found!");
    await mongoose.disconnect();
    return;
  }

  console.log("Setting agency plan to expired Growth...");
  agency.plan = "Growth";
  agency.planBillingPeriod = "monthly";
  agency.planExpiresAt = new Date(Date.now() - 5000); // 5 seconds ago
  agency.leadsLimit = 9999;
  await agency.save();

  console.log("Database state successfully set. Initial agency plan:", agency.plan);
  console.log("Initial planExpiresAt:", agency.planExpiresAt);
  console.log("Initial leadsLimit:", agency.leadsLimit);

  // 2. Fetch the agency through our helper (which invokes checkAndUpdateSubscription)
  console.log("\nFetching agency via getAgencyForUser()...");
  const fetchedAgency = await getAgencyForUser(user._id.toString());

  console.log("Fetched Agency Plan:", fetchedAgency.plan);
  console.log("Fetched Agency planExpiresAt:", fetchedAgency.planExpiresAt);
  console.log("Fetched Agency leadsLimit:", fetchedAgency.leadsLimit);

  // 3. Verify direct DB lookup to ensure change is persisted
  console.log("\nVerifying direct database state...");
  const dbAgency = await Agency.findById(agency._id);
  console.log("DB Agency Plan:", dbAgency.plan);
  console.log("DB Agency planExpiresAt:", dbAgency.planExpiresAt);
  console.log("DB Agency leadsLimit:", dbAgency.leadsLimit);

  if (dbAgency.plan === "Starter" && dbAgency.leadsLimit === 3) {
    console.log("\n✅ SUCCESS: Agency was successfully downgraded back to basic/Starter!");
  } else {
    console.error("\n❌ FAILURE: Agency was not downgraded correctly.");
  }

  await mongoose.disconnect();
}

main().catch(console.error);
