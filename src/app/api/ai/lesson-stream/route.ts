import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  getConceptsCollection,
  getLessonsCollection,
  getTopicsCollection,
} from "@/lib/db/collections";
import { streamLesson } from "@/lib/ai/prompts";
import { NimError } from "@/lib/ai/nim";

export const maxDuration = 60;

/**
 * Streams the lesson as newline-delimited JSON frames — {"chunk": "..."} as
 * text arrives, or {"error": "..."} if generation fails. Plain text framing
 * (not SSE) since this is a same-origin fetch, not an EventSource consumer.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { conceptId } = (await req.json().catch(() => ({}))) as { conceptId?: string };
  if (!conceptId) {
    return new Response(JSON.stringify({ error: "conceptId is required" }), {
      status: 400,
    });
  }

  const uid = new ObjectId(session.user.id);
  const concepts = await getConceptsCollection();
  const concept = await concepts.findOne({ _id: new ObjectId(conceptId), userId: uid });
  if (!concept) {
    return new Response(JSON.stringify({ error: "Concept not found" }), { status: 404 });
  }

  const lessons = await getLessonsCollection();
  const existing = await lessons.findOne({ userId: uid, conceptId: concept._id! });

  const encoder = new TextEncoder();
  const frame = (obj: Record<string, string>) => encoder.encode(JSON.stringify(obj) + "\n");

  // Already generated — replay instantly rather than calling the model again.
  if (existing) {
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(frame({ chunk: existing.content }));
        controller.close();
      },
    });
    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
  }

  const topics = await getTopicsCollection();
  const topic = await topics.findOne({ _id: concept.topicId, userId: uid });
  if (!topic) {
    return new Response(JSON.stringify({ error: "Topic not found" }), { status: 404 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      let full = "";
      try {
        for await (const piece of streamLesson(topic.name, concept.title, concept.summary)) {
          full += piece;
          controller.enqueue(frame({ chunk: piece }));
        }

        if (full.trim().length < 50) {
          throw new NimError("The AI returned an empty lesson — try again");
        }

        const now = new Date();
        await lessons.insertOne({
          userId: uid,
          topicId: concept.topicId,
          conceptId: concept._id!,
          title: concept.title,
          content: full,
          createdAt: now,
        });
        await concepts.updateOne(
          { _id: concept._id },
          { $set: { status: "in_progress", updatedAt: now } }
        );

        revalidatePath(`/learn/${conceptId}`);
        revalidatePath(`/topics/${topic.slug}`);
        revalidatePath("/");
      } catch (err) {
        const message = err instanceof NimError ? err.message : "Lesson generation failed";
        controller.enqueue(frame({ error: message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: { "Content-Type": "application/x-ndjson" } });
}
