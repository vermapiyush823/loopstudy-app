import { ObjectId } from "mongodb";
import { getTopicsCollection, type Topic } from "@/lib/db/collections";
import { PREDEFINED_TOPICS } from "@/lib/topics/seed-data";

export async function seedTopicsForUser(userId: string) {
  const topics = await getTopicsCollection();
  const userObjectId = new ObjectId(userId);

  const existing = await topics.countDocuments({ userId: userObjectId });
  if (existing > 0) return;

  const now = new Date();
  const docs: Topic[] = [];

  for (const seed of PREDEFINED_TOPICS) {
    const parentId = new ObjectId();
    docs.push({
      _id: parentId,
      userId: userObjectId,
      name: seed.name,
      slug: seed.slug,
      description: seed.description,
      icon: seed.icon,
      color: seed.color,
      isPredefined: true,
      createdAt: now,
      updatedAt: now,
    });

    for (const sub of seed.subtopics ?? []) {
      docs.push({
        userId: userObjectId,
        name: sub.name,
        slug: sub.slug,
        description: sub.description,
        icon: sub.icon,
        color: sub.color,
        isPredefined: true,
        parentTopicId: parentId,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  await topics.insertMany(docs);
}
