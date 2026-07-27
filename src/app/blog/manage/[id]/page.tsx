import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getBlogPostById } from "@/lib/blog/queries";
import { deleteBlogPost } from "@/lib/blog/actions";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";

export default async function ManageBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const post = await getBlogPostById(session.user.id, id);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <div className="mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{post.title}</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            <Link href={`/blog/${post.slug}`} className="underline underline-offset-4">
              View public post
            </Link>
            {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link href={`/blog/manage/${id}/edit`}>Edit</Link>
          </Button>
          <form action={deleteBlogPost.bind(null, id)}>
            <Button type="submit" variant="destructive">
              Delete
            </Button>
          </form>
        </div>
      </div>

      <MarkdownContent content={post.content} />
    </div>
  );
}
