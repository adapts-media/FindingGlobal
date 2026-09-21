import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

const AUTHORS = [
  "Sarah Jenkins", "Ahmed Al-Mansoor", "Mariam Yasin", "David Smith", "Elena Rostova",
  "Sophia Patel", "Carlos Gomez", "Chloe Laurent", "Tariq Mahmood", "Fatima Al-Harbi",
  "John Doe", "Michael Brown", "Emily Davis", "Amir Khan", "Lina Haddad",
  "Ravi Sharma", "Yuki Tanaka", "Oliver Muller", "Emma Wilson", "Zane Peterson"
];

const COMPANIES = [
  "TechCorp", "Innovate LLC", "E-Store", "Al-Futtaim", "Qatar Airways",
  "BioHealth", "SaaSify", "Luxe Fashion", "Apex Capital", "PropTech MENA",
  "Gulf Ventures", "FinTech Solutions", "EduLearn", "Global Logistics", "TravelGo"
];

const EXCERPTS = [
  "Exceptional service! They delivered the project on time and exceeded our expectations.",
  "Very professional team. Great communication throughout the campaign.",
  "Highly recommended for digital marketing and branding. They know the MENA market well.",
  "They helped us scale our organic traffic by 150% in just 6 months. Fantastic SEO results!",
  "Great design work. The UI/UX was clean, modern, and exactly what we wanted.",
  "A reliable partner for web development. Good technical skills and post-launch support.",
  "The social media strategy they implemented doubled our engagement rate. Will work with them again.",
  "Competent team and good project management, though sometimes response times were slightly slow.",
  "Excellent performance marketing results. Our cost per acquisition dropped significantly.",
  "Very creative ideas. They really helped redefine our brand identity.",
  "They grasped our requirements immediately and delivered a flawless product.",
  "Professionalism at its best. They kept us in the loop at every milestone.",
  "Their strategic insights helped us penetrate the Saudi market successfully.",
  "Outstanding development skills. The app runs smoothly and users love it.",
  "They are not just vendors; they acted as true extension of our internal team."
];

const RATINGS = [5, 5, 5, 4, 4, 4, 3]; // weighted towards 4 and 5 stars
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const YEARS = [2024, 2025, 2026];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateRandomReview() {
  const rating = getRandomElement(RATINGS);
  const author = getRandomElement(AUTHORS);
  const company = getRandomElement(COMPANIES);
  const excerpt = getRandomElement(EXCERPTS);
  const date = `${getRandomElement(MONTHS)} ${getRandomElement(YEARS)}`;

  return { author, company, rating, date, excerpt };
}

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  const agencies = await Agency.find({});
  console.log(`Found ${agencies.length} agencies to seed with reviews.`);

  let totalReviewsSeeded = 0;

  for (const agency of agencies) {
    // Generate random number of reviews between 25 and 50
    const reviewCount = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
    
    const reviews = [];
    let ratingSum = 0;
    
    for (let i = 0; i < reviewCount; i++) {
      const review = generateRandomReview();
      reviews.push(review);
      ratingSum += review.rating;
    }
    
    const averageRating = Math.round((ratingSum / reviewCount) * 10) / 10;

    agency.set("reviews", reviews);
    agency.set("reviewCount", reviewCount);
    agency.set("rating", averageRating);

    await agency.save();
    totalReviewsSeeded += reviewCount;
  }

  console.log(`Successfully seeded ${totalReviewsSeeded} reviews across ${agencies.length} agencies.`);
  
  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
