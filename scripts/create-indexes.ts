import { MongoClient } from "mongodb";

if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;

type UniqueCheck = {
  collection: string;
  keys: string[];
};

const UNIQUE_CHECKS: UniqueCheck[] = [
  { collection: "topics", keys: ["userId", "slug"] },
  { collection: "lessonNotes", keys: ["userId", "lessonId"] },
  { collection: "blogPosts", keys: ["slug"] },
];

async function checkForDuplicates(db: Awaited<ReturnType<MongoClient["db"]>>) {
  let hasDuplicates = false;

  for (const { collection, keys } of UNIQUE_CHECKS) {
    const groupId = Object.fromEntries(keys.map((k) => [k, `$${k}`]));
    const duplicates = await db
      .collection(collection)
      .aggregate([
        { $group: { _id: groupId, count: { $sum: 1 } } },
        { $match: { count: { $gt: 1 } } },
      ])
      .toArray();

    if (duplicates.length > 0) {
      hasDuplicates = true;
      console.error(
        `Found ${duplicates.length} duplicate group(s) in "${collection}" for keys [${keys.join(", ")}]:`
      );
      console.error(duplicates);
    }
  }

  return hasDuplicates;
}

async function main() {
  const client = new MongoClient(uri);
  await client.connect();
  const db = client.db();

  try {
    console.log("Checking for duplicate data that would break unique indexes...");
    const hasDuplicates = await checkForDuplicates(db);
    if (hasDuplicates) {
      console.error(
        "\nAborting: resolve the duplicates above before creating unique indexes."
      );
      process.exitCode = 1;
      return;
    }
    console.log("No duplicates found.\n");

    console.log("Creating indexes...");

    await db.collection("concepts").createIndexes([
      { key: { userId: 1, _id: 1 } },
      { key: { userId: 1, topicId: 1, order: 1 } },
      { key: { userId: 1, status: 1, updatedAt: 1 } },
      { key: { userId: 1, status: 1, updatedAt: 1, order: 1 } },
      { key: { userId: 1, topicId: 1 } },
    ]);

    await db.collection("topics").createIndexes([
      { key: { userId: 1, slug: 1 }, unique: true },
      { key: { userId: 1, isPredefined: -1, name: 1 } },
    ]);

    await db.collection("lessons").createIndexes([{ key: { userId: 1, conceptId: 1 } }]);

    await db.collection("flashcards").createIndexes([
      { key: { userId: 1, nextReviewDate: 1 } },
      { key: { userId: 1, topicId: 1, nextReviewDate: 1 } },
      { key: { userId: 1, conceptId: 1 } },
      { key: { userId: 1, lessonId: 1 } },
    ]);

    await db
      .collection("lessonNotes")
      .createIndexes([{ key: { userId: 1, lessonId: 1 }, unique: true }]);

    await db
      .collection("lessonQuestions")
      .createIndexes([{ key: { userId: 1, lessonId: 1 } }]);

    await db.collection("blogPosts").createIndexes([
      { key: { userId: 1, updatedAt: -1 } },
      { key: { slug: 1 }, unique: true },
    ]);

    console.log("Done.");
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
