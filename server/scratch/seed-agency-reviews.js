import "dotenv/config";
import mongoose from "mongoose";
import Agency from "../src/models/Agency.js";

const MONGODB_URI = process.env.MONGODB_URI;

const FIRST_NAMES = [
  "Tariq", "Sarah", "Amine", "Rania", "David", "Nour", "James", "Mariam", "Faisal", "Elena", 
  "Karim", "Samantha", "Omar", "Layla", "Yasmine", "Hisham", "Christopher", "Fatima", "Rachel", 
  "Khaled", "Mona", "John", "Michael", "Emily", "Jessica", "Abdullah", "Ryan", "Patricia", "Zain"
];

const LAST_NAMES = [
  "Al-Mansoori", "Jenkins", "Benjelloun", "Al-Ghamdi", "Vance", "El-Din", "Mercer", "Al-Khabaz", 
  "Al-Rashed", "Rostova", "El-Sayed", "Cole", "Al-Suwaidi", "Haddad", "Smith", "Miller", 
  "Johnson", "Davis", "Al-Harbi", "Al-Otaibi", "Al-Masri", "Baker", "Taylor", "Brown"
];

const COMPANIES = [
  "Emaar Properties", "Noon E-commerce", "Al-Futtaim Group", "Riyadh Digital Bank", "Tabby MENA", 
  "Careem", "Sary KSA", "KAFD Development", "Nadec Group", "Abu Dhabi Investment Office", 
  "Aramex", "Chalhoub Group", "EMAAR KSA", "Majid Al Futtaim", "ADQ", "Giga Projects KSA", 
  "Tamara", "Jahez", "Floward", "Delivery Hero", "Zamil Group", "Savola", "SABIC", "Aramco", 
  "Qiddiya", "Red Sea Global", "NEOM", "Diriyah Gate Authority"
];

const EXCERPTS = [
  "We engaged them for our regional brand repositioning. The level of strategic foresight and bilingual delivery was exceptional.",
  "An absolute powerhouse of technical talent. They helped us architect and scale our customer portal in record time.",
  "Our paid acquisition ROI has improved significantly since onboarding them. Outstanding data reporting and optimization.",
  "Their understanding of local nuances in KSA and UAE was critical for our launch. Highly recommend their corporate strategy team.",
  "They delivered a gorgeous design system that has unified all of our digital product touchpoints. Great designers.",
  "Outstanding communication and project management. Every milestone was hit on time and within budget.",
  "Their bilingual SEO and organic content engine has driven a massive lift in high-intent inbound search traffic.",
  "They function as a true extension of our internal team. Strategic, responsive, and detail-oriented.",
  "Excellent service and high attention to detail. The team was highly professional and accommodated all our feedback.",
  "They helped us launch our mobile app in record time. The code quality was superb and they provided great documentation.",
  "We saw a 40% increase in conversion rate within the first month of launching the redesign. Truly a world-class team.",
  "Their strategic roadmap helped us align our regional offices. Clear, concise, and highly actionable insights.",
  "Very responsive and proactive. They identified key bottlenecks in our user flow and resolved them efficiently.",
  "The team's creativity is top-tier. They captured our brand's heritage while giving it a modern, clean look.",
  "Strong domain expertise in fintech and security. They guided us through complex local regulatory requirements.",
  "Outstanding video production and campaign storytelling. It went viral across social media channels in the Gulf.",
  "Great performance marketing partners. They managed our budgets transparently and achieved all CPA targets.",
  "Highly collaborative workshop sessions. They brought great energy and really helped us narrow down our core value proposition.",
  "Their market entry study was incredibly thorough and gave us the confidence to launch our retail footprint in Saudi.",
  "Excellent post-launch support. They are fast at addressing issues and continue to optimize the platform."
];

function getRandomElement(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomDate() {
  const years = [2024, 2025];
  const months = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const year = years[Math.floor(Math.random() * years.length)];
  const month = months[Math.floor(Math.random() * months.length)];
  return `${year}-${month}`;
}

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB database.");

    const agencies = await Agency.find({});
    console.log(`Found ${agencies.length} agencies in the database.`);

    for (const agency of agencies) {
      // 1. Generate 25-30 reviews for each agency
      const reviewNum = Math.floor(25 + Math.random() * 6); // 25, 26, 27, 28, 29, 30

      // Calculate a review count matching or slightly higher than reviewNum
      const reviewCount = Math.floor(reviewNum + Math.random() * 30); // rating count around 50

      // Overall rating between 4.7 and 4.9
      const ratingsPool = [4.7, 4.8, 4.9];
      const rating = ratingsPool[Math.floor(Math.random() * ratingsPool.length)];

      const reviews = [];
      for (let i = 0; i < reviewNum; i++) {
        const firstName = getRandomElement(FIRST_NAMES);
        const lastName = getRandomElement(LAST_NAMES);
        const company = getRandomElement(COMPANIES);
        const excerpt = getRandomElement(EXCERPTS);

        reviews.push({
          author: `${firstName} ${lastName}`,
          company: company,
          rating: Math.random() > 0.2 ? 5 : 4, // Mostly 5 stars, some 4 stars
          date: getRandomDate(),
          excerpt: excerpt
        });
      }

      agency.reviewCount = reviewCount;
      agency.rating = rating;
      agency.reviews = reviews;

      await agency.save();
      console.log(`Updated Agency: "${agency.name}" -> Rating: ${rating}, ReviewCount: ${reviewCount}, Reviews: ${reviews.length}`);
    }

    console.log("All agencies seeded successfully with 25-30 reviews!");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error seeding agencies:", error);
    process.exit(1);
  }
}

seed();
