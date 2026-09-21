import "dotenv/config";
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("Error: MONGODB_URI environment variable is not defined in server/.env");
  process.exit(1);
}

// Extract database name from connection URI
let sourceDbName = "finding-mena";
let targetDbName = "findingmena-testing";

try {
  const url = new URL(MONGODB_URI);
  const path = url.pathname.substring(1);
  if (path) {
    sourceDbName = path;
  }
} catch (e) {
  console.log("Could not parse database name using URL constructor. Falling back to default name.");
}

console.log(`Source Database: ${sourceDbName}`);
console.log(`Target Database: ${targetDbName}`);

async function duplicateDatabase() {
  try {
    console.log("Connecting to MongoDB Cluster...");
    await mongoose.connect(MONGODB_URI);
    console.log("Connected successfully!");

    const sourceDbConnection = mongoose.connection.useDb(sourceDbName);
    const targetDbConnection = mongoose.connection.useDb(targetDbName);

    const srcDb = sourceDbConnection.db;
    const destDb = targetDbConnection.db;

    // Get list of all collections in the source database
    const collections = await srcDb.listCollections().toArray();
    console.log(`Found ${collections.length} collections in source database.`);

    for (const colInfo of collections) {
      const colName = colInfo.name;
      
      // Skip system collections
      if (colName.startsWith("system.")) {
        console.log(`Skipping system collection: ${colName}`);
        continue;
      }

      console.log(`\nProcessing collection: "${colName}"...`);

      // 1. Fetch all documents from the source collection
      const docs = await srcDb.collection(colName).find({}).toArray();
      console.log(` - Read ${docs.length} documents from source.`);

      // 2. Clear target collection if it already exists (to prevent duplicates and ensure a fresh sync)
      console.log(` - Dropping target collection "${colName}" if it exists...`);
      try {
        await destDb.collection(colName).drop();
        console.log(` - Dropped existing target collection.`);
      } catch (err) {
        // Collection might not exist, which is fine
        if (err.codeName !== "NamespaceNotFound") {
          console.log(` - Note (non-critical): Target collection drop error: ${err.message}`);
        }
      }

      // 3. Write documents to target collection if there are any
      if (docs.length > 0) {
        console.log(` - Copying ${docs.length} documents to target...`);
        const insertResult = await destDb.collection(colName).insertMany(docs);
        console.log(` - Successfully copied ${insertResult.insertedCount} documents.`);
      } else {
        // Just create the collection if it was empty
        console.log(` - Collection is empty. Creating empty collection on target.`);
        await destDb.createCollection(colName);
      }

      // 4. Copy indexes (important for query performance and constraints like unique indexes)
      console.log(` - Reading indexes from source collection...`);
      const indexes = await srcDb.collection(colName).indexes();
      
      for (const idx of indexes) {
        // Skip default _id index since it's created automatically
        if (idx.name === "_id_") continue;

        console.log(` - Re-creating index: ${idx.name}`);
        const { key, name, ...options } = idx;
        
        try {
          await destDb.collection(colName).createIndex(key, { name, ...options });
          console.log(`   Index ${idx.name} created successfully.`);
        } catch (idxErr) {
          console.error(`   Error creating index ${idx.name}:`, idxErr.message);
        }
      }
    }

    console.log("\nDuplication complete! Both databases are in sync.");

  } catch (error) {
    console.error("Fatal error during database duplication:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

duplicateDatabase();
