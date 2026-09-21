import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const AgencySchema = new mongoose.Schema({
  slug: String,
  featured: Boolean,
  verified: Boolean,
  name: String
}, { strict: false });

const Agency = mongoose.model('Agency', AgencySchema);

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const slug = 'billionwebs';
    const agency = await Agency.findOne({ slug: new RegExp(slug, 'i') });

    if (!agency) {
      console.log(`Agency with slug matching "${slug}" not found.`);
      process.exit(1);
    }

    console.log(`Found agency: ${agency.name} (${agency.slug})`);
    
    agency.featured = true;
    agency.verified = true;
    await agency.save();

    console.log(`Agency "${agency.name}" is now FEATURED and VERIFIED.`);
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

run();
