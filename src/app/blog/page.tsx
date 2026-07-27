import Link from "next/link";
import { PenLine } from "lucide-react";
import { auth } from "@/auth";
import { getPublishedPosts } from "@/lib/blog/queries";
import { Card } from "@/components/ui/card";

export default async function BlogPage() {
  const [posts, session] = await Promise.all([getPublishedPosts(), auth()]);

  return (
    <div className="relative flex-1 overflow-y-auto px-4.5 pt-4.5 pb-7">
      <p className="mb-4.5 text-[13.5px] text-foreground-soft">
        Independent of your study progress.
      </p>

      {posts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No posts published yet.</p>
      ) : (
        <Card className="gap-0 divide-y divide-border p-0 px-3.5">
          {posts.map((post) => (
            <Link
              key={post._id!.toString()}
              href={`/blog/${post.slug}`}
              className="block py-3.5"
            >
              <h4 className="font-serif text-[15.5px] leading-snug font-semibold">
                {post.title}
              </h4>
              {post.tags.length > 0 && (
                <p className="mt-1 text-[11.5px] text-muted-foreground">
                  {post.tags.join(", ")}
                </p>
              )}
            </Link>
          ))}
        </Card>
      )}

      {session?.user && (
        <Link
          href="/blog/manage/new"
          aria-label="New post"
          className="fixed right-4.5 flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_22px_-8px_rgba(190,91,36,0.55)]"
          style={{ bottom: "calc(var(--tabbar-h) + 18px + env(safe-area-inset-bottom))" }}
        >
          <PenLine className="size-5" strokeWidth={1.8} />
        </Link>
      )}
    </div>
  );
}
