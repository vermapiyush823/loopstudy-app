import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { auth } from "@/auth";
import { getLessonQuestionsCollection, getLessonsCollection } from "@/lib/db/collections";
import { answerLessonQuestion } from "@/lib/ai/prompts";
import { getLessonQuestions } from "@/lib/learning/queries";
import { LlmError } from "@/lib/ai/llm";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { lessonId, question } = (await req.json().catch(() => ({}))) as {
    lessonId?: string;
    question?: string;
  };

  if (!lessonId || !question?.trim()) {
    return NextResponse.json(
      { error: "lessonId and question are required" },
      { status: 400 }
    );
  }

  const uid = new ObjectId(session.user.id);
  const lessons = await getLessonsCollection();
  const lesson = await lessons.findOne({ _id: new ObjectId(lessonId), userId: uid });
  if (!lesson) {
    return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
  }

  try {
    const priorQA = await getLessonQuestions(session.user.id, lesson._id!);
    const answer = await answerLessonQuestion(
      lesson.content,
      question,
      priorQA.map((qa) => ({ question: qa.question, answer: qa.answer }))
    );

    const questions = await getLessonQuestionsCollection();
    await questions.insertOne({
      userId: uid,
      topicId: lesson.topicId,
      conceptId: lesson.conceptId,
      lessonId: lesson._id!,
      question,
      answer,
      createdAt: new Date(),
    });

    return NextResponse.json({ answer });
  } catch (err) {
    if (err instanceof LlmError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "AI request failed" }, { status: 500 });
  }
}
