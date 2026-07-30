import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

// Cache the client on the global object so warm serverless invocations
// (and HMR reloads in dev) reuse the same connection instead of opening
// a new one per request.
if (!global._mongoClientPromise) {
  const client = new MongoClient(uri, options);
  global._mongoClientPromise = client.connect();
}

const clientPromise = global._mongoClientPromise;

export default clientPromise;
