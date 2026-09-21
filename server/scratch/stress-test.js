import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../src/models/User.js";
import Agency from "../src/models/Agency.js";
import Project from "../src/models/Project.js";
import Lead from "../src/models/Lead.js";
import Notification from "../src/models/Notification.js";
import { calculateMatchScore, MATCH_THRESHOLD } from "../src/lib/matching.js";
import { notifyAgencyForNewLead } from "../src/utils/notifications.js";

// Suppress email simulation and notifications printout logs to keep output clean and fast
const originalLog = console.log;
console.log = (...args) => {
  if (args[0] && typeof args[0] === "string" && (
    args[0].includes("[SIMULATED EMAIL SENT]") ||
    args[0].includes("=========================") ||
    args[0].includes("To:      ") ||
    args[0].includes("Subject: ") ||
    args[0].includes("Content:") ||
    args[0].includes("[Notification]")
  )) {
    return;
  }
  originalLog(...args);
};

const SERVICES = [
  "Strategy & Consulting",
  "Marketing",
  "Branding",
  "Web Development",
  "Mobile Development",
  "Creative & Design",
  "SEO & Content",
  "Performance & Paid Media"
];

const BUDGETS = ["<25k", "25k-75k", "75k-150k", "150k-500k", "500k+"];

const COUNTRIES = [
  "United Arab Emirates",
  "Saudi Arabia",
  "Egypt",
  "Qatar",
  "Kuwait",
  "Oman",
  "Bahrain",
  "Jordan",
  "Lebanon"
];

const COUNTRY_CODES = {
  "United Arab Emirates": "AE",
  "Saudi Arabia": "SA",
  "Egypt": "EG",
  "Qatar": "QA",
  "Kuwait": "KW",
  "Oman": "OM",
  "Bahrain": "BH",
  "Jordan": "JO",
  "Lebanon": "LB"
};

const INDUSTRIES = [
  "Technology & SaaS",
  "E-Commerce",
  "Real Estate",
  "Healthcare",
  "Finance & Banking",
  "Retail",
  "Hospitality & Travel",
  "Education",
  "Logistics"
];

async function runMatching({ services = [], budget, country, industry, limit = 6 } = {}) {
  const query = {
    verified: true,
    $or: [
      { country: country },
      { services: { $in: services } }
    ]
  };

  const potentialAgencies = await Agency.find(query)
    .select("_id services minBudget country industries")
    .lean();
  
  return potentialAgencies
    .map((a) => ({
      id: a._id,
      score: calculateMatchScore({ services, budget, country, industry }, a)
    }))
    .filter((s) => s.score > MATCH_THRESHOLD)
    .sort((a, b) => b.score - a.score)
    .slice(0, Math.min(Number(limit) || 6, 20))
    .map((s) => s.id);
}

async function run() {
  const start = Date.now();
  originalLog("\n🚀 STARTING MENA AGENCY CONNECT DATABASE & LOAD STRESS TEST...");

  const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";
  await mongoose.connect(MONGODB_URI);
  originalLog("🔌 Connected to MongoDB database.");

  // Pre-calculate bcrypt hash for 'stresspassword123'
  originalLog("🔑 Pre-calculating password hash for test accounts...");
  const hashStart = Date.now();
  const passwordHash = await bcrypt.hash("stresspassword123", 10);
  originalLog(`🔑 Password hash calculated in ${Date.now() - hashStart}ms`);

  // Track created documents for deletion
  const agencyUserIds = [];
  const clientUserIds = [];
  const agencyIds = [];
  const projectIds = [];
  const leadIds = [];
  const notificationIds = [];

  // Metrics counter variables (available in outer scope)
  let agenciesCreatedCount = 0;
  let clientsCreatedCount = 0;
  let projectsCreatedCount = 0;
  let leadsGeneratedCount = 0;
  let directMessagesCount = 0;
  let meetingsRequestedCount = 0;
  let meetingsBookedCount = 0;
  let projectsClosedCount = 0;

  try {
    // ----------------------------------------------------
    // Step 1: Create 100 Agencies
    // ----------------------------------------------------
    originalLog("🏢 Generating 100 Agencies...");
    const agencyStart = Date.now();
    
    // We create the agency users and profiles in batches
    for (let i = 1; i <= 100; i++) {
      const email = `stress_agency_${i}@example.com`;
      const name = `Stress Agency ${i}`;
      const slug = `stress-agency-${i}`;
      
      const user = await User.create({
        email,
        passwordHash,
        name,
        role: "agency",
        company: name,
        agencySlug: slug
      });
      agencyUserIds.push(user._id);

      const country = COUNTRIES[i % COUNTRIES.length];
      const services = [
        SERVICES[i % SERVICES.length],
        SERVICES[(i + 1) % SERVICES.length]
      ];
      const minBudget = i % 4 === 0 ? 0 : i % 4 === 1 ? 25000 : i % 4 === 2 ? 75000 : 150000;

      const agency = await Agency.create({
        slug,
        name,
        tagline: `Accelerating growth through expert solutions.`,
        description: `This is a stress test agency profile designed to benchmark system performance and search relevance.`,
        website: `https://www.stress-agency-${i}.com`,
        city: "Dubai",
        country,
        countryCode: COUNTRY_CODES[country] || "AE",
        founded: 2015 + (i % 9),
        teamSize: "10-50",
        minBudget,
        rating: 4.0 + (i % 11) * 0.1,
        reviewCount: 0,
        services,
        industries: [INDUSTRIES[i % INDUSTRIES.length], INDUSTRIES[(i + 2) % INDUSTRIES.length]],
        logoSeed: slug,
        coverSeed: slug,
        featured: i % 10 === 0,
        verified: true,
        plan: i % 3 === 0 ? "Growth" : "Starter",
        ownerUserId: user._id,
        portfolio: [
          {
            title: "Digital Transformation Project",
            client: `Client X ${i}`,
            category: services[0],
            imageSeed: `${slug}-port-1`,
            summary: "Accelerated lead volume and visual identity modernization."
          }
        ]
      });
      agencyIds.push(agency._id);
    }
    agenciesCreatedCount = agencyIds.length;
    const agencyDuration = Date.now() - agencyStart;
    originalLog(`✅ Created 100 Agencies (users & profiles) in ${agencyDuration}ms (${(100 / (agencyDuration/1000)).toFixed(1)} ops/sec)`);

    // ----------------------------------------------------
    // Step 2: Create 1000 Clients
    // ----------------------------------------------------
    originalLog("👥 Generating 1000 Clients...");
    const clientStart = Date.now();
    
    // Create users in batches of 100 to optimize write speed
    const clientUsersData = [];
    for (let i = 1; i <= 1000; i++) {
      clientUsersData.push({
        email: `stress_client_${i}@example.com`,
        passwordHash,
        name: `Stress Client ${i}`,
        role: "client",
        company: `Stress Client Co ${i}`,
        country: COUNTRIES[i % COUNTRIES.length]
      });
    }

    // Insert client users
    const createdClients = await User.insertMany(clientUsersData);
    createdClients.forEach(u => clientUserIds.push(u._id));
    clientsCreatedCount = clientUserIds.length;
    
    const clientDuration = Date.now() - clientStart;
    originalLog(`✅ Created 1000 Client Users in ${clientDuration}ms (${(1000 / (clientDuration/1000)).toFixed(1)} ops/sec)`);

    // ----------------------------------------------------
    // Step 3: Create 1000 Projects and Run Matching Logic
    // ----------------------------------------------------
    originalLog("📋 Creating 1000 Projects and running matching & lead gen...");
    const projectStart = Date.now();
    let matchingTimes = [];

    // Let's create projects in batches of 50 to avoid overloading connections, keeping track of leads
    const batchSize = 50;
    for (let b = 0; b < 1000; b += batchSize) {
      const batchPromises = [];
      for (let i = b + 1; i <= b + batchSize && i <= 1000; i++) {
        const clientUserId = clientUserIds[i - 1];
        const services = [SERVICES[i % SERVICES.length]];
        if (i % 3 === 0) services.push(SERVICES[(i + 2) % SERVICES.length]);
        const budget = BUDGETS[i % BUDGETS.length];
        const country = COUNTRIES[i % COUNTRIES.length];
        const industry = INDUSTRIES[i % INDUSTRIES.length];

        const createProject = async () => {
          const matchStart = Date.now();
          const matches = await runMatching({ services, budget, country, industry });
          matchingTimes.push(Date.now() - matchStart);

          const project = await Project.create({
            title: `Stress Test Project ${i}`,
            description: `A detailed description for project ${i} targeting ${services.join(", ")} in ${country}.`,
            services,
            budget,
            country,
            industry,
            clientUserId,
            matchedAgencies: matches,
            status: "Matching"
          });
          projectIds.push(project._id);

          if (matches.length > 0) {
            const leads = await Lead.insertMany(matches.map(agencyId => ({
              project: project._id,
              agency: agencyId,
              status: "New"
            })));
            leads.forEach(l => leadIds.push(l._id));

            // Notify agencies in background
            for (const agencyId of matches) {
              const leadForAgency = leads.find(l => String(l.agency) === String(agencyId));
              notifyAgencyForNewLead(agencyId, project.title, project.budget, "Matched Project", leadForAgency?._id).catch(() => {});
            }
          }
        };
        batchPromises.push(createProject());
      }
      await Promise.all(batchPromises);
    }

    projectsCreatedCount = projectIds.length;
    leadsGeneratedCount = leadIds.length;
    const projectDuration = Date.now() - projectStart;
    const avgMatchTime = matchingTimes.reduce((a, b) => a + b, 0) / matchingTimes.length;
    originalLog(`✅ Created 1000 Projects and completed matching in ${projectDuration}ms (${(1000 / (projectDuration/1000)).toFixed(1)} ops/sec)`);
    originalLog(`📊 Average matching algorithm run duration: ${avgMatchTime.toFixed(2)}ms`);

    // ----------------------------------------------------
    // Step 4: Simulate Client Messages / Agency Direct Contacts (500)
    // ----------------------------------------------------
    originalLog("💬 Simulating 500 Direct Contact messages to random agencies...");
    const msgStart = Date.now();
    
    const msgPromises = [];
    for (let m = 1; m <= 500; m++) {
      const agencyIdx = m % agencyIds.length;
      const agencyId = agencyIds[agencyIdx];
      const clientIdx = m % clientUserIds.length;

      const sendDirectContact = async () => {
        const agency = await Agency.findById(agencyId);
        if (!agency) return;

        const email = `stress_client_${clientIdx}@example.com`;
        const name = `Stress Client ${clientIdx}`;

        agency.messages = agency.messages || [];
        agency.messages.push({
          name,
          email,
          company: `Stress Client Co ${clientIdx}`,
          budget: BUDGETS[m % BUDGETS.length],
          message: `Hello! We would love to discuss a project with you regarding our requirements. Let's connect soon!`,
          createdAt: new Date()
        });
        await agency.save();

        const lead = await Lead.create({
          agency: agencyId,
          type: "Direct",
          status: "New",
          unlocked: true,
          directContact: {
            name,
            email,
            company: `Stress Client Co ${clientIdx}`,
            budget: BUDGETS[m % BUDGETS.length],
            message: `Hello! We would love to discuss a project with you regarding our requirements. Let's connect soon!`
          }
        });
        leadIds.push(lead._id);

        notifyAgencyForNewLead(agencyId, "", BUDGETS[m % BUDGETS.length], "Direct Contact", lead._id).catch(() => {});
      };
      
      msgPromises.push(sendDirectContact());
      // Await in small chunks of 50 to maintain performance without exhaustion
      if (msgPromises.length >= 50) {
        await Promise.all(msgPromises);
        msgPromises.length = 0;
      }
    }
    if (msgPromises.length > 0) {
      await Promise.all(msgPromises);
    }
    directMessagesCount = 500;
    const msgDuration = Date.now() - msgStart;
    originalLog(`✅ Simulating 500 Direct Messages in ${msgDuration}ms (${(500 / (msgDuration/1000)).toFixed(1)} ops/sec)`);

    // ----------------------------------------------------
    // Step 5: Simulate Agency Meeting Requests (300)
    // ----------------------------------------------------
    originalLog("📅 Simulating 300 Meeting Requests from agencies...");
    const meetReqStart = Date.now();
    
    // Find matched leads
    const matchedLeads = await Lead.find({ _id: { $in: leadIds }, type: "Matched" }).limit(300);
    const meetReqPromises = [];
    for (let i = 0; i < matchedLeads.length; i++) {
      const lead = matchedLeads[i];
      lead.meetingRequested = true;
      lead.status = "In Conversation";
      
      const reqMeet = async () => {
        await lead.save();
        // Create client notification
        const project = await Project.findById(lead.project);
        const agency = await Agency.findById(lead.agency);
        if (project && project.clientUserId && agency) {
          const notif = await Notification.create({
            recipient: project.clientUserId,
            title: "Meeting Requested",
            message: `Agency "${agency.name}" has requested a meeting for your project "${project.title}".`,
            type: "meeting_request",
            link: `/projects/${project._id}`
          });
          notificationIds.push(notif._id);
        }
      };
      meetReqPromises.push(reqMeet());
      if (meetReqPromises.length >= 50) {
        await Promise.all(meetReqPromises);
        meetReqPromises.length = 0;
      }
    }
    if (meetReqPromises.length > 0) {
      await Promise.all(meetReqPromises);
    }
    meetingsRequestedCount = matchedLeads.length;
    const meetReqDuration = Date.now() - meetReqStart;
    originalLog(`✅ Simulated ${matchedLeads.length} Meeting Requests in ${meetReqDuration}ms (${(matchedLeads.length / (meetReqDuration/1000)).toFixed(1)} ops/sec)`);

    // ----------------------------------------------------
    // Step 6: Simulate Client Booking Meetings (150)
    // ----------------------------------------------------
    originalLog("🤝 Simulating 150 Client Bookings...");
    const bookStart = Date.now();
    
    const activeReqLeads = await Lead.find({ _id: { $in: leadIds }, meetingRequested: true }).limit(150);
    const bookPromises = [];
    for (let i = 0; i < activeReqLeads.length; i++) {
      const lead = activeReqLeads[i];
      lead.meetingBooked = true;

      const bookMeet = async () => {
        await lead.save();
        // Create agency notification
        const project = await Project.findById(lead.project);
        const agency = await Agency.findById(lead.agency);
        if (project && agency && agency.ownerUserId) {
          const notif = await Notification.create({
            recipient: agency.ownerUserId,
            title: "Meeting Confirmed!",
            message: `The client for project "${project.title}" has booked a meeting with your agency.`,
            type: "meeting_booked",
            link: `/leads/${lead._id}`
          });
          notificationIds.push(notif._id);
        }
      };
      bookPromises.push(bookMeet());
      if (bookPromises.length >= 50) {
        await Promise.all(bookPromises);
        bookPromises.length = 0;
      }
    }
    if (bookPromises.length > 0) {
      await Promise.all(bookPromises);
    }
    meetingsBookedCount = activeReqLeads.length;
    const bookDuration = Date.now() - bookStart;
    originalLog(`✅ Simulated ${activeReqLeads.length} Meeting Bookings in ${bookDuration}ms (${(activeReqLeads.length / (bookDuration/1000)).toFixed(1)} ops/sec)`);

    // ----------------------------------------------------
    // Step 7: Simulate Closing Projects & Leaving Reviews (200)
    // ----------------------------------------------------
    originalLog("🔒 Simulating 200 Project Closures & Reviews...");
    const closeStart = Date.now();
    
    const projectsToClose = await Project.find({ _id: { $in: projectIds } }).limit(200);
    const closePromises = [];
    for (let i = 0; i < projectsToClose.length; i++) {
      const proj = projectsToClose[i];
      proj.status = "Closed";
      
      const hiredAgencyId = proj.matchedAgencies[0] || null;
      if (hiredAgencyId) {
        proj.hiredAgency = hiredAgencyId;
      }

      const closeProj = async () => {
        await proj.save();
        
        if (hiredAgencyId) {
          // Update leads status
          await Lead.updateMany(
            { project: proj._id, agency: hiredAgencyId },
            { $set: { status: "Won" } }
          );
          await Lead.updateMany(
            { project: proj._id, agency: { $ne: hiredAgencyId } },
            { $set: { status: "Lost" } }
          );

          // Submit a review
          const agency = await Agency.findById(hiredAgencyId);
          const client = await User.findById(proj.clientUserId);
          if (agency && client) {
            const review = {
              author: client.name,
              company: client.company || "Stress Client Co",
              rating: 4 + (i % 2), // 4 or 5 star
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              excerpt: `Superb execution! Stress test project executed beautifully and on time. Highly recommended partner.`,
              projectId: proj._id,
              userId: client._id
            };
            agency.reviews = agency.reviews || [];
            agency.reviews.push(review);
            
            const totalRating = agency.reviews.reduce((sum, r) => sum + r.rating, 0);
            agency.reviewCount = agency.reviews.length;
            agency.rating = totalRating / agency.reviewCount;
            await agency.save();
          }
        } else {
          await Lead.updateMany(
            { project: proj._id },
            { $set: { status: "Lost" } }
          );
        }
      };
      closePromises.push(closeProj());
      if (closePromises.length >= 50) {
        await Promise.all(closePromises);
        closePromises.length = 0;
      }
    }
    if (closePromises.length > 0) {
      await Promise.all(closePromises);
    }
    projectsClosedCount = projectsToClose.length;
    const closeDuration = Date.now() - closeStart;
    originalLog(`✅ Simulated ${projectsToClose.length} Project Closures and Reviews in ${closeDuration}ms (${(projectsToClose.length / (closeDuration/1000)).toFixed(1)} ops/sec)`);

  } catch (error) {
    originalLog("❌ Stress testing run encountered error:", error);
  } finally {
    // ----------------------------------------------------
    // Step 8: Clean Up All Stress Test Entities
    // ----------------------------------------------------
    originalLog("🧹 CLEANING UP STRESS TEST DATA...");
    const cleanupStart = Date.now();

    const deletedUsers = await User.deleteMany({ _id: { $in: [...agencyUserIds, ...clientUserIds] } });
    const deletedAgencies = await Agency.deleteMany({ _id: { $in: agencyIds } });
    const deletedProjects = await Project.deleteMany({ _id: { $in: projectIds } });
    
    // Delete leads associated with our projects or agencies
    const deletedLeads = await Lead.deleteMany({
      $or: [
        { project: { $in: projectIds } },
        { agency: { $in: agencyIds } },
        { _id: { $in: leadIds } }
      ]
    });
    
    // Delete notifications associated with our users
    const deletedNotifs = await Notification.deleteMany({
      $or: [
        { recipient: { $in: [...agencyUserIds, ...clientUserIds] } },
        { _id: { $in: notificationIds } }
      ]
    });

    const cleanupDuration = Date.now() - cleanupStart;
    originalLog(`✅ Cleaned up database in ${cleanupDuration}ms`);

    // Disconnect
    await mongoose.disconnect();
    originalLog("🔌 Disconnected from database.");

    // Final Report
    const totalTime = Date.now() - start;
    originalLog("\n========================================================");
    originalLog("📊 STRESS TEST REPORT SUMMARY");
    originalLog("========================================================");
    originalLog(`Total Duration:           ${(totalTime / 1000).toFixed(2)} seconds`);
    originalLog(`Agencies Created:         ${agenciesCreatedCount}`);
    originalLog(`Clients Created:          ${clientsCreatedCount}`);
    originalLog(`Projects Created:         ${projectsCreatedCount}`);
    originalLog(`Leads Generated:          ${leadsGeneratedCount}`);
    originalLog(`Direct Messages Sent:     ${directMessagesCount}`);
    originalLog(`Meetings Requested:       ${meetingsRequestedCount}`);
    originalLog(`Meetings Booked:          ${meetingsBookedCount}`);
    originalLog(`Projects Closed:          ${projectsClosedCount}`);
    originalLog("--------------------------------------------------------");
    originalLog("🧹 DELETED DATABASE DOCUMENTS COUNTS:");
    originalLog(`- Users:                  ${deletedUsers.deletedCount}`);
    originalLog(`- Agencies:               ${deletedAgencies.deletedCount}`);
    originalLog(`- Projects:               ${deletedProjects.deletedCount}`);
    originalLog(`- Leads:                  ${deletedLeads.deletedCount}`);
    originalLog(`- Notifications:          ${deletedNotifs.deletedCount}`);
    originalLog("========================================================\n");
  }
}

run().catch((err) => {
  originalLog("Fatal error running stress test:", err);
  process.exit(1);
});
