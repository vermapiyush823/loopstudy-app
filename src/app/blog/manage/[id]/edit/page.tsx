import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth/require-session";
import { getBlogPostById } from "@/lib/blog/queries";
import { updateBlogPost } from "@/lib/blog/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

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
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Edit post</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={updatePostWithId} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={post.title} required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                name="content"
                rows={12}
                defaultValue={post.content}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
              <Input id="tags" name="tags" defaultValue={post.tags.join(", ")} />
            </div>

            <Button type="submit">Save changes</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
