import { requireSession } from "@/lib/auth/require-session";
import { createBlogPost } from "@/lib/blog/actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default async function NewBlogPostPage() {
  await requireSession();

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>New post</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBlogPost} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea id="content" name="content" rows={12} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="tags">Tags (comma-separated, optional)</Label>
              <Input id="tags" name="tags" placeholder="e.g. kubernetes, deep-dive" />
            </div>

            <Button type="submit">Publish post</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
