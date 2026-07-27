import { notFound } from "next/navigation";
import { getPublishedPostBySlug } from "@/lib/blog/queries";
import { MarkdownContent } from "@/components/markdown-content";
import { DrillInHeader } from "@/components/drill-in-header";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <DrillInHeader title={post.title} backHref="/blog" />
      <article className="flex-1 overflow-y-auto px-4.5 py-4.5">
        {post.tags.length > 0 && (
          <p className="mb-4.5 text-[13px] text-muted-foreground">{post.tags.join(", ")}</p>
        )}
        <MarkdownContent content={post.content} className="text-[15px] leading-[1.65]" />
      </article>
    </>
  );
}
