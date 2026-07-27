import Link from "next/link";
import { auth } from "@/auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { SignInButton, SignOutButton } from "@/components/auth-buttons";

export async function SiteHeader() {
  const session = await auth();

  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href="/" className="font-semibold tracking-tight">
          Loopstudy
        </Link>

        <nav className="flex items-center gap-4 text-sm">
          {session?.user && (
            <span className="flex items-center gap-4 border-r pr-4">
              <Link href="/" className="text-muted-foreground hover:text-foreground">
                Today
              </Link>
              <Link href="/topics" className="text-muted-foreground hover:text-foreground">
                Learn
              </Link>
            </span>
          )}

          <span className="flex items-center gap-4">
            <Link href="/blog" className="text-muted-foreground hover:text-foreground">
              Blog
            </Link>
            {session?.user && (
              <Link
                href="/blog/manage"
                className="text-muted-foreground hover:text-foreground"
              >
                Write
              </Link>
            )}
          </span>

          <ThemeToggle />

          {session?.user ? <SignOutButton /> : <SignInButton />}
        </nav>
      </div>
    </header>
  );
}
