import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { generateBlogDraft } from "@/lib/ai/prompts";
import { NimError } from "@/lib/ai/nim";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { source } = (await req.json().catch(() => ({}))) as { source?: string };
  if (!source?.trim()) {
    return NextResponse.json(
      { error: "Write a few rough notes first — there's nothing to work from yet." },
      { status: 400 }
    );
  }

  try {
    const draft = await generateBlogDraft(source);
    return NextResponse.json(draft);
  } catch (err) {
    if (err instanceof NimError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
