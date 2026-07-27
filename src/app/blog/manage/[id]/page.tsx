import Link from "next/link";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getBlogPostById } from "@/lib/blog/queries";
import { deleteBlogPost } from "@/lib/blog/actions";
import { Button } from "@/components/ui/button";
import { MarkdownContent } from "@/components/markdown-content";
import { DrillInHeader } from "@/components/drill-in-header";
import { BottomCtaBar } from "@/components/bottom-cta-bar";

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
    <>
      <DrillInHeader title={post.title} backHref="/blog/manage" />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
        <p className="mb-4.5 text-[12px] text-muted-foreground">
          <Link href={`/blog/${post.slug}`} className="font-semibold text-primary">
            View public post
          </Link>
          {post.tags.length > 0 && ` · ${post.tags.join(", ")}`}
        </p>
        <MarkdownContent content={post.content} className="text-[15px] leading-[1.65]" />
      </div>
      <BottomCtaBar>
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link href={`/blog/manage/${id}/edit`}>Edit</Link>
        </Button>
        <form action={deleteBlogPost.bind(null, id)} className="flex-1">
          <Button type="submit" variant="destructive" size="sm" className="w-full">
            Delete
          </Button>
        </form>
      </BottomCtaBar>
    </>
  );
}
