import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import { eventLog, insertEventLogSchema } from "@/repo/schema/event-log";
import { desc } from "drizzle-orm";

export const getEventLogs = authorized
  .route({ method: "GET", path: "/event-log" })
  .handler(async () => {
    return db.query.eventLog.findMany({
      orderBy: [desc(eventLog.timestamp)],
    });
  });

export const createEventLog = authorized
  .input(insertEventLogSchema.omit({ id: true }))
  .handler(async ({ input }) => {
    const [created] = await db
      .insert(eventLog)
      .values({
        ...input,
        timestamp: input.timestamp ?? new Date().toISOString(),
      })
      .returning();
    return created;
  });
