import { NextResponse } from "next/server";
import { getUsersCollection, type AppUser } from "@/lib/db/collections";
import { getDueSummary } from "@/lib/review/queries";
import { sendDueReviewEmail } from "@/lib/notifications/email";

export const maxDuration = 60;

/** Number of users emailed concurrently per batch, to stay considerate of Resend's rate limit. */
const BATCH_SIZE = 10;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsersCollection();
  const allUsers = await users.find({ email: { $exists: true } }).toArray();

  let emailsSent = 0;
  const errors: string[] = [];

  async function processUser(user: AppUser) {
    if (!user.email) return;
    try {
      const summary = await getDueSummary(user._id.toString());
      if (summary.totalCount > 0) {
        await sendDueReviewEmail(user.email, summary);
        emailsSent++;
      }
    } catch (err) {
      errors.push(`${user._id.toString()}: ${err instanceof Error ? err.message : "unknown error"}`);
    }
  }

  for (const batch of chunk(allUsers, BATCH_SIZE)) {
    await Promise.allSettled(batch.map(processUser));
  }

  return NextResponse.json({ usersProcessed: allUsers.length, emailsSent, errors });
}
