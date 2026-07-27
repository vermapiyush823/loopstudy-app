import "server-only";
import { chatCompletion, chatCompletionJSON, streamChatCompletion } from "@/lib/ai/llm";

/* ---------------------------------------------------------------- *
 * Learning path — the ordered syllabus of concepts for a topic
 * ---------------------------------------------------------------- */

const PATH_SCHEMA = {
  name: "learning_path",
  schema: {
    type: "object",
    properties: {
      concepts: {
        type: "array",
        items: {
          type: "object",
          properties: {
            title: { type: "string" },
            summary: { type: "string" },
          },
          required: ["title", "summary"],
        },
      },
    },
    required: ["concepts"],
  },
};

export interface GeneratedConcept {
  title: string;
  summary: string;
}

export async function generateLearningPath(
  topicName: string,
  topicDescription?: string
): Promise<GeneratedConcept[]> {
  const result = await chatCompletionJSON<{ concepts: GeneratedConcept[] }>(
    [
      {
        role: "system",
        content:
          "You design learning paths. Given a technical topic, break it into an ordered sequence of 8-12 concepts that take someone from fundamentals to competent. Order matters: each concept should build on the ones before it. For each concept give a short title and a one-sentence summary of what the learner will understand after it. Return JSON only.",
      },
      {
        role: "user",
        content: topicDescription
          ? `Topic: ${topicName}\nContext: ${topicDescription}`
          : `Topic: ${topicName}`,
      },
    ],
    PATH_SCHEMA,
    { temperature: 0.4, maxTokens: 4096 }
  );

  return (result.concepts ?? []).filter((c) => c.title?.trim());
}

/* ---------------------------------------------------------------- *
 * Lesson — the actual teaching content for one concept, streamed as
 * plain Markdown so the client can render it as it's generated rather
 * than waiting for the whole (slow) generation to finish.
 * ---------------------------------------------------------------- */

const LESSON_SYSTEM_PROMPT = [
  "You are a great technical teacher. Teach one concept clearly and concretely, as a single flowing Markdown document with exactly these sections, in this order:",
  "",
  "1. A focused explanation (roughly 400-700 words). Build intuition first, then precision. Use code blocks where code makes it clearer. Do not pad with filler.",
  '2. A "## In the real world" section with 2-4 REAL-WORLD examples as short paragraphs. Ground them in situations a working engineer actually meets — a system they\'d build, a bug they\'d hit, an everyday analogy that genuinely maps to the mechanics. Avoid toy foo/bar examples.',
  '3. A "## Worth remembering" section with a bullet list of 3-5 one-line takeaways.',
  "",
  "Write only the lesson content — no preamble, no meta-commentary about the task.",
].join("\n");

export function streamLesson(
  topicName: string,
  conceptTitle: string,
  conceptSummary: string
): AsyncGenerator<string> {
  return streamChatCompletion(
    [
      { role: "system", content: LESSON_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Topic: ${topicName}\nConcept: ${conceptTitle}\nWhat the learner should get from it: ${conceptSummary}`,
      },
    ],
    { temperature: 0.5, maxTokens: 4096 }
  );
}

/* ---------------------------------------------------------------- *
 * Flashcards — generated from a lesson
 * ---------------------------------------------------------------- */

const FLASHCARDS_SCHEMA = {
  name: "flashcards",
  schema: {
    type: "object",
    properties: {
      cards: {
        type: "array",
        items: {
          type: "object",
          properties: {
            question: { type: "string" },
            answer: { type: "string" },
          },
          required: ["question", "answer"],
        },
      },
    },
    required: ["cards"],
  },
};

export interface GeneratedFlashcard {
  question: string;
  answer: string;
}

export async function generateFlashcardsFromLesson(
  lessonText: string,
  count = 8
): Promise<GeneratedFlashcard[]> {
  const result = await chatCompletionJSON<{ cards: GeneratedFlashcard[] }>(
    [
      {
        role: "system",
        content: `You turn a lesson into flashcards. Generate up to ${count} question/answer pairs covering the concepts that matter. Questions must be specific and testable; answers concise. Return JSON only.`,
      },
      { role: "user", content: lessonText },
    ],
    FLASHCARDS_SCHEMA,
    { temperature: 0.5, maxTokens: 4096 }
  );
  return (result.cards ?? []).filter((c) => c.question?.trim() && c.answer?.trim());
}

/* ---------------------------------------------------------------- *
 * Go deeper on a lesson
 * ---------------------------------------------------------------- */

const DEPTH_SYSTEM: Record<"eli5" | "expert", string> = {
  eli5:
    "Re-explain this lesson as if to a curious beginner: simple words, short sentences, a relatable analogy. Under 250 words.",
  expert:
    "Re-explain this lesson at an expert level: precise terminology, edge cases, failure modes, and the nuance a practitioner would care about.",
};

export async function explainLesson(
  lessonText: string,
  depth: "eli5" | "expert"
): Promise<string> {
  return chatCompletion(
    [
      { role: "system", content: DEPTH_SYSTEM[depth] },
      { role: "user", content: lessonText },
    ],
    { maxTokens: 3072 }
  );
}

/* ---------------------------------------------------------------- *
 * Blog writing helper — independent of the study side
 * ---------------------------------------------------------------- */

const WRITING_HELPER_SCHEMA = {
  name: "writing_helper",
  schema: {
    type: "object",
    properties: {
      title: { type: "string" },
      tags: { type: "array", items: { type: "string" } },
      excerpt: { type: "string" },
      seoDescription: { type: "string" },
      draft: { type: "string" },
    },
    required: ["title", "tags", "excerpt", "seoDescription", "draft"],
  },
};

export interface WritingHelperResult {
  title: string;
  tags: string[];
  excerpt: string;
  seoDescription: string;
  draft: string;
}

export async function generateBlogDraft(source: string): Promise<WritingHelperResult> {
  return chatCompletionJSON<WritingHelperResult>(
    [
      {
        role: "system",
        content:
          "You turn rough material into a polished blog post draft in a clear, friendly first-person voice. Also propose a title, 3-6 tags, a one-sentence excerpt, and an SEO meta description under 160 characters. Preserve technical accuracy. Return JSON only; 'draft' is the full post body in Markdown.",
      },
      { role: "user", content: source },
    ],
    WRITING_HELPER_SCHEMA,
    { temperature: 0.6, maxTokens: 4096 }
  );
}
