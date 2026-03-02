import { db } from "@/db";
import { messages } from "@/db/schema";
import { and, asc, eq, gt } from "drizzle-orm";
import { createHash } from "node:crypto";

const WINDOW_SIZE = 20;
const DEDUP_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

function hashContent(content: string) {
  return createHash("sha256").update(content).digest("hex");
}

export async function checkIdempotency(content: string) {
  const hash = hashContent(content);
  const cutoff = new Date(Date.now() - DEDUP_WINDOW_MS);

  const existing = await db.query.messages.findFirst({
    where: and(
      eq(messages.contentHash, hash),
      gt(messages.createdAt, cutoff),
    ),
  });

  if (!existing) return null;

  const cachedResponse = await db.query.messages.findFirst({
    where: and(
      eq(messages.role, "assistant"),
      gt(messages.id, existing.id),
    ),
  });

  return cachedResponse?.content ?? null;
}

export async function storeMessage(
  role: "user" | "assistant",
  content: string,
) {
  const hash = role === "user" ? hashContent(content) : null;

  const [msg] = await db
    .insert(messages)
    .values({
      role,
      content,
      contentHash: hash,
    })
    .returning();

  return msg;
}

export async function getRecentMessages() {
  const allMessages = await db.query.messages.findMany({
    orderBy: asc(messages.createdAt),
  });

  return allMessages.slice(-WINDOW_SIZE).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));
}
