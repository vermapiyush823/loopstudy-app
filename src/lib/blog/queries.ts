import { ObjectId } from "mongodb";
import { getBlogPostsCollection, type BlogPost } from "@/lib/db/collections";

export async function getUserBlogPosts(userId: string): Promise<BlogPost[]> {
  const posts = await getBlogPostsCollection();
  return posts
    .find({ userId: new ObjectId(userId) })
    .sort({ updatedAt: -1 })
    .toArray();
}

export async function getBlogPostById(
  userId: string,
  postId: string
): Promise<BlogPost | null> {
  const posts = await getBlogPostsCollection();
  return posts.findOne({ _id: new ObjectId(postId), userId: new ObjectId(userId) });
}

export async function getPublishedPosts(): Promise<BlogPost[]> {
  const posts = await getBlogPostsCollection();
  return posts.find({}).sort({ updatedAt: -1 }).toArray();
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getBlogPostsCollection();
  return posts.findOne({ slug });
}
