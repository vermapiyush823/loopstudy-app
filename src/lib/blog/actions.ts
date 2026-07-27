"use server";

import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { getBlogPostsCollection } from "@/lib/db/collections";

function slugify(title: string) {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "") || "post"
  );
}

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

export async function createBlogPost(formData: FormData) {
  const userId = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) throw new Error("Title is required");

  const posts = await getBlogPostsCollection();
  const now = new Date();
  const result = await posts.insertOne({
    userId: new ObjectId(userId),
    title,
    slug: slugify(title),
    content,
    tags,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/blog");
  redirect(`/blog/manage/${result.insertedId.toString()}`);
}

export async function updateBlogPost(postId: string, formData: FormData) {
  const userId = await requireUserId();

  const posts = await getBlogPostsCollection();
  const existing = await posts.findOne({
    _id: new ObjectId(postId),
    userId: new ObjectId(userId),
  });
  if (!existing) throw new Error("Forbidden: post does not belong to user");

  const title = String(formData.get("title") ?? "").trim();
  const content = String(formData.get("content") ?? "");
  const tags = String(formData.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!title) throw new Error("Title is required");

  await posts.updateOne(
    { _id: existing._id },
    {
      $set: {
        title,
        content,
        tags,
        slug: title === existing.title ? existing.slug : slugify(title),
        updatedAt: new Date(),
      },
    }
  );

  revalidatePath("/blog");
  revalidatePath(`/blog/manage/${postId}`);
}

export async function deleteBlogPost(postId: string) {
  const userId = await requireUserId();

  const posts = await getBlogPostsCollection();
  const result = await posts.deleteOne({
    _id: new ObjectId(postId),
    userId: new ObjectId(userId),
  });
  if (result.deletedCount === 0) throw new Error("Forbidden or not found");

  revalidatePath("/blog");
  redirect("/blog/manage");
}

/** Saves an AI-assisted draft as a new post. */
export async function createPostFromDraft(draft: {
  title: string;
  content: string;
  tags: string[];
  excerpt?: string;
  seoDescription?: string;
}) {
  const userId = await requireUserId();

  const title = draft.title.trim();
  if (!title) throw new Error("Title is required");

  const posts = await getBlogPostsCollection();
  const now = new Date();
  const slug = slugify(title);
  const result = await posts.insertOne({
    userId: new ObjectId(userId),
    title,
    slug,
    content: draft.content,
    tags: draft.tags,
    excerpt: draft.excerpt,
    seoDescription: draft.seoDescription,
    createdAt: now,
    updatedAt: now,
  });

  revalidatePath("/blog");
  return { postId: result.insertedId.toString(), slug };
}
