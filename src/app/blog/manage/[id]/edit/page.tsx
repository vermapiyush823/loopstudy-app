import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getBlogPostById } from "@/lib/blog/queries";
import { updateBlogPost } from "@/lib/blog/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrillInHeader } from "@/components/drill-in-header";

export default async function EditBlogPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await requireSession();
  const post = await getBlogPostById(session.user.id, id);
  if (!post) notFound();

  const updatePostWithId = updateBlogPost.bind(null, id);

  return (
    <>
      <DrillInHeader title="Edit post" backHref={`/blog/manage/${id}`} />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
        <form action={updatePostWithId} className="space-y-3.5">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-xs font-semibold text-foreground-soft">
              Title
            </Label>
            <Input id="title" name="title" defaultValue={post.title} required />
          </div>

          <div className="space-y-1">
            <Label htmlFor="content" className="text-xs font-semibold text-foreground-soft">
              Content (Markdown)
            </Label>
            <Textarea id="content" name="content" rows={12} defaultValue={post.content} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tags" className="text-xs font-semibold text-foreground-soft">
              Tags (comma-separated, optional)
            </Label>
            <Input id="tags" name="tags" defaultValue={post.tags.join(", ")} />
          </div>

          <Button type="submit" className="w-full">
            Save changes
          </Button>
        </form>
      </div>
    </>
  );
}
