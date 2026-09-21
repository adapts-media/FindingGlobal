import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function run() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("Connected.");

  const Agency = mongoose.model("Agency", new mongoose.Schema({}, { strict: false }));

  // Find BillionWebs
  const billionMatch = await Agency.find({
    $or: [
      { name: /billion/i },
      { slug: /billion/i }
    ]
  });

  console.log(`Found ${billionMatch.length} agencies matching 'billion':`);
  for (const b of billionMatch) {
    console.log(` - Name: ${b.get("name")}, Slug: ${b.get("slug")}`);
  }

  const slugs = ["adapts-media", "genxmedia"];
  if (billionMatch.length > 0) {
    slugs.push(billionMatch[0].get("slug"));
  }

  for (const slug of slugs) {
    const agency = await Agency.findOne({ slug });
    if (!agency) {
      console.warn(`Agency not found for slug: ${slug}`);
      continue;
    }

    const reviews = agency.get("reviews") || [];
    const count = reviews.length || 30; // default to 30 if empty
    
    // We want the average rating to be exactly 4.9.
    // Sum of ratings = 4.9 * count.
    // Let's set almost all reviews to 5, and exactly enough to 4 to make the average 4.9.
    // Formula: 
    // Let x be the number of 5-star reviews, y be the number of 4-star reviews.
    // x + y = count
    // 5x + 4y = Math.round(4.9 * count)
    // 5(count - y) + 4y = Math.round(4.9 * count)
    // 5*count - y = Math.round(4.9 * count)
    // y = 5*count - Math.round(4.9 * count)
    const targetSum = Math.round(4.9 * count);
    const numFours = 5 * count - targetSum;
    const numFives = count - numFours;

    console.log(`Agency: ${agency.get("name")} (Slug: ${slug})`);
    console.log(` - Current review count: ${count}`);
    console.log(` - Setting ${numFives} reviews to 5 stars, and ${numFours} reviews to 4 stars.`);

    const newReviews = [];
    // If the reviews array is empty or too short, let's populate it
    const AUTHORS = [
      "Sarah Jenkins", "Ahmed Al-Mansoor", "Mariam Yasin", "David Smith", "Elena Rostova",
      "Sophia Patel", "Carlos Gomez", "Chloe Laurent", "Tariq Mahmood", "Fatima Al-Harbi"
    ];
    const COMPANIES = [
      "TechCorp", "Innovate LLC", "E-Store", "Al-Futtaim", "Qatar Airways",
      "BioHealth", "SaaSify", "Luxe Fashion"
    ];
    const EXCERPTS = [
      "Exceptional service! They delivered the project on time and exceeded our expectations.",
      "Very professional team. Great communication throughout the campaign.",
      "Highly recommended for digital marketing and branding. They know the MENA market well.",
      "They helped us scale our organic traffic by 150% in just 6 months. Fantastic SEO results!",
      "Great design work. The UI/UX was clean, modern, and exactly what we wanted."
    ];
    const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const YEARS = [2024, 2025, 2026];

    function getRandom(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    }

    for (let i = 0; i < count; i++) {
      const rating = i < numFours ? 4 : 5;
      const existing = reviews[i] || {};
      
      newReviews.push({
        author: existing.author || getRandom(AUTHORS),
        company: existing.company || getRandom(COMPANIES),
        rating: rating,
        date: existing.date || `${getRandom(MONTHS)} ${getRandom(YEARS)}`,
        excerpt: existing.excerpt || getRandom(EXCERPTS)
      });
    }

    const calculatedSum = newReviews.reduce((sum, r) => sum + r.rating, 0);
    const average = Math.round((calculatedSum / count) * 10) / 10;

    agency.set("reviews", newReviews);
    agency.set("reviewCount", count);
    agency.set("rating", average);

    await agency.save();
    console.log(` - Updated rating: ${average} (based on ${count} reviews).`);
  }

  await mongoose.disconnect();
  console.log("Disconnected.");
}

run().catch(console.error);
