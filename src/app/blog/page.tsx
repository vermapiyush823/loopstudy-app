import Link from "next/link";
import { getPublishedPosts } from "@/lib/blog/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function BlogPage() {
  const posts = await getPublishedPosts();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-8 text-2xl font-semibold tracking-tight">Blog</h1>

      {posts.length === 0 ? (
        <p className="text-muted-foreground">No posts published yet.</p>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <Link key={post._id!.toString()} href={`/blog/${post.slug}`}>
              <Card className="transition-colors hover:border-foreground/30">
                <CardHeader>
                  <CardTitle className="text-lg">{post.title}</CardTitle>
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
