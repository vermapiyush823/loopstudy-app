import { ObjectId } from "mongodb";
import { getTopicsCollection, type Topic } from "@/lib/db/collections";

export async function getUserTopics(userId: string): Promise<Topic[]> {
  const topics = await getTopicsCollection();
  return topics
    .find({ userId: new ObjectId(userId) })
    .sort({ isPredefined: -1, name: 1 })
    .toArray();
}

export async function getTopicBySlug(userId: string, slug: string): Promise<Topic | null> {
  const topics = await getTopicsCollection();
  return topics.findOne({ userId: new ObjectId(userId), slug });
}

export function groupTopicsByParent(topics: Topic[]) {
  const topLevel = topics.filter((t) => !t.parentTopicId);
  const bySubtopic = new Map<string, Topic[]>();

  for (const t of topics) {
    if (t.parentTopicId) {
      const key = t.parentTopicId.toString();
      const list = bySubtopic.get(key) ?? [];
      list.push(t);
      bySubtopic.set(key, list);
    }
  }

  return topLevel.map((topic) => ({
    topic,
    subtopics: bySubtopic.get(topic._id!.toString()) ?? [],
  }));
}
