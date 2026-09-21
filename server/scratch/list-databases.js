import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/finding-mena";

async function listDbs() {
  try {
    console.log("Connecting to:", MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const admin = new mongoose.mongo.Admin(mongoose.connection.db);
    const dbsInfo = await admin.listDatabases();
    console.log("\nDatabases in Cluster:");
    console.log(JSON.stringify(dbsInfo.databases, null, 2));

    for (const dbInfo of dbsInfo.databases) {
      console.log(`\n--- Collections in Database: ${dbInfo.name} ---`);
      // Connect to the specific database
      const dbConnection = mongoose.connection.useDb(dbInfo.name);
      const collections = await dbConnection.db.listCollections().toArray();
      collections.forEach(col => {
        console.log(` - ${col.name}`);
      });
    }

  } catch (error) {
    console.error("Failed to list databases:", error);
  } finally {
    await mongoose.disconnect();
    console.log("\nDisconnected.");
  }
}

listDbs();
