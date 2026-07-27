import "server-only";
import { Resend } from "resend";
import type { DueSummary } from "@/lib/review/queries";

function appUrl(): string {
  if (process.env.APP_URL) return process.env.APP_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return "http://localhost:3000";
}

export async function sendDueReviewEmail(to: string, summary: DueSummary): Promise<void> {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const reviewUrl = `${appUrl()}/review`;

  const topicLines = summary.topics
    .map((t) => `<li>${t.name} — ${t.count} card${t.count === 1 ? "" : "s"}</li>`)
    .join("");

  const { error } = await resend.emails.send({
    // Hardcoded: resend.dev's sandbox sender needs no domain verification, and this isn't
    // a secret — one less Vercel env var to get out of sync while debugging delivery.
    from: "Loopstudy <onboarding@resend.dev>",
    to,
    subject: `${summary.totalCount} card${summary.totalCount === 1 ? "" : "s"} due for review`,
    html: `
      <p>You have ${summary.totalCount} flashcard${summary.totalCount === 1 ? "" : "s"} due for review:</p>
      <ul>${topicLines}</ul>
      <p><a href="${reviewUrl}">Review now</a></p>
    `,
  });

  // The Resend SDK returns { error } on API failures rather than throwing —
  // without this check a failed send is silently miscounted as sent.
  if (error) {
    throw new Error(`Resend send failed: ${error.name} — ${error.message}`);
  }
}
