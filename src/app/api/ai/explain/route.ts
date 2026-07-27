import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getLessonsCollection } from "@/lib/db/collections";
import { explainLesson } from "@/lib/ai/prompts";
import { NimError } from "@/lib/ai/nim";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, depth } = (await req.json().catch(() => ({}))) as {
    lessonId?: string;
    depth?: "eli5" | "expert";
  };

  if (!lessonId || (depth !== "eli5" && depth !== "expert")) {
    return NextResponse.json(
      { error: "lessonId and depth ('eli5' | 'expert') are required" },
      { status: 400 }
    );
  }

  const lessons = await getLessonsCollection();
  const lesson = await lessons.findOne({
    _id: new ObjectId(lessonId),
    userId: new ObjectId(session.user.id),
  });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const explanation = await explainLesson(lesson.explanation, depth);
    return NextResponse.json({ explanation });
  } catch (err) {
    if (err instanceof NimError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
