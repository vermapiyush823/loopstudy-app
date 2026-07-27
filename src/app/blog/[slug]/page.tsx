import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/blog/queries";
import { MarkdownContent } from "@/components/markdown-content";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">{post.title}</h1>
      {post.tags.length > 0 && (
        <p className="mb-8 text-sm text-muted-foreground">{post.tags.join(", ")}</p>
      )}
      <MarkdownContent content={post.content} />
    </article>
  );
}
