"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { getTopicsCollection } from "@/lib/db/collections";

function slugify(name: string) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "topic"
  );
}

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createTopic(formData: FormData) {
  const userId = await requireUserId();

  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  if (!name) throw new Error("Name is required");

  const topics = await getTopicsCollection();
  const now = new Date();
  await topics.insertOne({
    userId: new ObjectId(userId),
    name,
    slug: slugify(name),
    description: description || undefined,
    isPredefined: false,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/topics");
}
