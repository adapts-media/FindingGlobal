import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../server/.env') });

const AgencySchema = new mongoose.Schema({
  reviews: [{
    author: String,
    company: String,
    rating: Number,
    date: String,
    excerpt: String,
    projectId: mongoose.Schema.Types.ObjectId,
    userId: mongoose.Schema.Types.ObjectId
  }]
}, { strict: false });

const UserSchema = new mongoose.Schema({
  name: String,
  company: String
}, { strict: false });

const Agency = mongoose.model('Agency', AgencySchema);
const User = mongoose.model('User', UserSchema);

async function fixReviews() {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri);
    console.log('Connected to DB');

    const agencies = await Agency.find({ 'reviews.author': 'Anonymous' });
    console.log(`Found ${agencies.length} agencies with anonymous reviews`);

    for (const agency of agencies) {
      let changed = false;
      for (const review of agency.reviews) {
        if (review.author === 'Anonymous' && review.userId) {
          const user = await User.findById(review.userId);
          if (user) {
            console.log(`Fixing review for agency ${agency.slug || agency._id}: ${review.author} -> ${user.name}`);
            review.author = user.name || 'Anonymous';
            review.company = user.company || 'Client';
            changed = true;
          } else {
            console.log(`User not found for review with userId ${review.userId}`);
          }
        }
      }
      if (changed) {
        await agency.save();
        console.log(`Saved changes for agency ${agency.slug || agency._id}`);
      }
    }

    console.log('Done');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

fixReviews();
