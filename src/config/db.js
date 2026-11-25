
import { MongoClient } from "mongodb";
import { env, assertRequiredEnv } from "./env.js";

let client = null;
let db = null;
let connecting = null; 


export async function connectDB() {
  if (db) return db;

  if (!connecting) {
    connecting = (async () => {
      assertRequiredEnv();
      client = new MongoClient(env.mongoUri);
      await client.connect();
      db = client.db(env.dbName);
      await createIndexes(db);
      console.log(`MongoDB connected -> database "${env.dbName}"`);
      return db;
    })().catch((error) => {
      connecting = null; 
      throw error;
    });
  }

  return connecting;
}

export function getDb() {
  if (!db) throw new Error("Database is not connected yet.");
  return db;
}


export const collections = {
  get users() {
    return getDb().collection("user");
  },
  get equipment() {
    return getDb().collection("equipment");
  },
  get bookings() {
    return getDb().collection("bookings");
  },
  get payments() {
    return getDb().collection("payments");
  },
  get favorites() {
    return getDb().collection("favorites");
  },
};


async function createIndexes(database) {
  try {
    await Promise.all([
      database.collection("favorites").createIndex({ userEmail: 1, equipmentId: 1 }, { unique: true }),
      database.collection("payments").createIndex({ stripeSessionId: 1 }, { unique: true }),
      database.collection("equipment").createIndex({ status: 1, createdAt: -1 }),
      database.collection("equipment").createIndex({ "owner.email": 1 }),
      database.collection("bookings").createIndex({ customerEmail: 1, createdAt: -1 }),
      database.collection("bookings").createIndex({ ownerEmail: 1, createdAt: -1 }),
      database.collection("bookings").createIndex({ equipmentId: 1, startDate: 1, endDate: 1 }),
    ]);
  } catch (error) {

    console.warn("Could not create indexes:", error.message);
  }
}
