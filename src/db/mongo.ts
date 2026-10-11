import {
  MongoClient,
  type Collection,
  type Db,
  type Document,
} from "mongodb";

const globalForMongo = globalThis as typeof globalThis & {
  __infycrestMongoClient?: MongoClient;
  __infycrestMongoConnect?: Promise<MongoClient>;
  __infycrestMongoIndexes?: Promise<void>;
};

function getClient(): MongoClient {
  if (globalForMongo.__infycrestMongoClient) {
    return globalForMongo.__infycrestMongoClient;
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is required");
  const client = new MongoClient(uri);
  if (process.env.NODE_ENV !== "production") {
    globalForMongo.__infycrestMongoClient = client;
  }
  return client;
}

async function ensureIndexes(database: Db): Promise<void> {
  await Promise.all([
    database.collection("users").createIndex({ email: 1 }, { unique: true }),
    database.collection("sessions").createIndex({ token: 1 }, { unique: true }),
    database.collection("sessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    database.collection("sessions").createIndex({ userId: 1 }),
    database.collection("organizationMembers").createIndex(
      { orgId: 1, userId: 1 },
      { unique: true },
    ),
    database.collection("properties").createIndex({ orgId: 1 }),
    database.collection("propertyDomains").createIndex(
      { propertyId: 1, domain: 1 },
      { unique: true },
    ),
    database.collection("propertyDomains").createIndex({ propertyId: 1 }),
    database.collection("chatbotSettings").createIndex(
      { propertyId: 1 },
      { unique: true },
    ),
    database.collection("knowledgeSources").createIndex({ propertyId: 1, status: 1, createdAt: -1 }),
    database.collection("knowledgeChunks").createIndex({ propertyId: 1, status: 1 }),
    database.collection("knowledgeChunks").createIndex({ sourceId: 1 }),
    database.collection("conversations").createIndex({ propertyId: 1, lastMessageAt: -1 }),
    database.collection("conversations").createIndex({ propertyId: 1, sessionId: 1, status: 1, lastMessageAt: -1 }),
    database.collection("messages").createIndex({ conversationId: 1, createdAt: 1 }),
    database.collection("messages").createIndex({ propertyId: 1, createdAt: -1 }),
    database.collection("messages").createIndex({ propertyId: 1, flagged: 1, createdAt: -1 }),
    database.collection("leads").createIndex({ propertyId: 1, createdAt: -1 }),
    database.collection("usageRecords").createIndex(
      { propertyId: 1, period: 1 },
      { unique: true },
    ),
    database.collection("subscriptions").createIndex({ orgId: 1 }, { unique: true }),
    database.collection("planLimits").createIndex({ planId: 1 }, { unique: true }),
    database.collection("auditLogs").createIndex({ propertyId: 1, createdAt: -1 }),
    database.collection("rateLimits").createIndex({ key: 1 }, { unique: true }),
    database.collection("rateLimits").createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

export async function getDb(): Promise<Db> {
  const client = getClient();
  const connection =
    globalForMongo.__infycrestMongoConnect ?? client.connect();
  globalForMongo.__infycrestMongoConnect = connection;
  const connectedClient = await connection;
  const database = connectedClient.db();
  const indexes = globalForMongo.__infycrestMongoIndexes ?? ensureIndexes(database);
  globalForMongo.__infycrestMongoIndexes = indexes;
  await indexes;
  return database;
}

export async function getCollection<T extends Document>(
  name: string,
): Promise<Collection<T>> {
  return (await getDb()).collection<T>(name);
}

export async function closeMongoClient(): Promise<void> {
  if (globalForMongo.__infycrestMongoConnect) {
    const connectedClient = await globalForMongo.__infycrestMongoConnect;
    await connectedClient.close();
    globalForMongo.__infycrestMongoClient = undefined;
    globalForMongo.__infycrestMongoConnect = undefined;
    globalForMongo.__infycrestMongoIndexes = undefined;
  }
}