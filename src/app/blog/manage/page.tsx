import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { getUserBlogPosts } from "@/lib/blog/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ManageBlogPostsPage() {
  const session = await requireSession();
  const posts = await getUserBlogPosts(session.user.id);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Your posts</h1>
        <Button asChild>
          <Link href="/blog/manage/new">New post</Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">
          No posts yet. Write one here, or turn a study note into a post using the AI
          writing helper.
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post._id!.toString()} href={`/blog/manage/${post._id!.toString()}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle className="text-base">{post.title}</CardTitle>
                </CardHeader>
                {post.tags.length > 0 && (
                  <CardContent className="text-xs text-muted-foreground">
                    {post.tags.join(", ")}
                  </CardContent>
                )}
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
