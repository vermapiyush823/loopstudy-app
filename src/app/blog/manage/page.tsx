import Link from "next/link";
import { requireSession } from "@/lib/auth/require-session";
import { getUserBlogPosts } from "@/lib/blog/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DrillInHeader } from "@/components/drill-in-header";

export default async function ManageBlogPostsPage() {
  const session = await requireSession();
  const posts = await getUserBlogPosts(session.user.id);

  return (
    <>
      <DrillInHeader title="Your posts" backHref="/blog" />
      <div className="flex-1 overflow-y-auto px-4.5 pt-3.5 pb-7">
        <Button asChild className="mb-3.5 w-full">
          <Link href="/blog/manage/new">New post</Link>
        </Button>

        {posts.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No posts yet. Write one here, or turn a study note into a post using the AI
            writing helper.
          </p>
        ) : (
          <Card className="gap-0 divide-y divide-border p-0 px-3.5">
            {posts.map((post) => (
              <Link
                key={post._id!.toString()}
                href={`/blog/manage/${post._id!.toString()}`}
                className="block py-3.5"
              >
                <h4 className="font-serif text-[15.5px] font-semibold">{post.title}</h4>
                {post.tags.length > 0 && (
                  <p className="mt-1 text-[11.5px] text-muted-foreground">
                    {post.tags.join(", ")}
                  </p>
                )}
              </Link>
            ))}
          </Card>
        )}
      </div>
    </>
  );
}
