import { NextResponse } from "next/server";
import { getUsersCollection } from "@/lib/db/collections";
import { getDueSummary } from "@/lib/review/queries";
import { sendDueReviewEmail } from "@/lib/notifications/email";

export const maxDuration = 60;

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await getUsersCollection();
  const allUsers = await users.find({ email: { $exists: true } }).toArray();

  let emailsSent = 0;
  const errors: string[] = [];

  for (const user of allUsers) {
    if (!user.email) continue;
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

  // Temporary — masked fingerprint of the env vars this deployment actually loaded,
  // to confirm Vercel dashboard edits actually reached the running function. Remove once
  // email delivery is confirmed working.
  const key = process.env.RESEND_API_KEY ?? "";
  const debug = {
    resendKeyFingerprint: key ? `${key.slice(0, 6)}...${key.slice(-4)} (${key.length})` : "(unset)",
  };

  return NextResponse.json({ usersProcessed: allUsers.length, emailsSent, errors, debug });
}
