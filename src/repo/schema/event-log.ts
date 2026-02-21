import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import type z from "zod";

export const eventActionValues = [
  "CREATE",
  "UPDATE",
  "DELETE",
  "SALE",
  "LOGIN",
  "LOGOUT",
] as const;
export const eventEntityValues = [
  "PRODUCT",
  "VENDOR",
  "SUPPLY",
  "TRANSACTION",
  "USER",
  "SYSTEM",
] as const;

export type EventAction = (typeof eventActionValues)[number];
export type EventEntity = (typeof eventEntityValues)[number];

export const eventLog = sqliteTable("event_log", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  timestamp: text("timestamp").notNull(),
  action: text("action", { enum: eventActionValues }).notNull(),
  entity: text("entity", { enum: eventEntityValues }).notNull(),
  entityId: text("entity_id"),
  details: text("details").notNull(),
  performedBy: text("performed_by").notNull(),
});

// --- Zod Schemas ---
// Event logs are append-only — no update schema

export const selectEventLogSchema = createSelectSchema(eventLog);
export type SelectEventLog = z.infer<typeof selectEventLogSchema>;

export const insertEventLogSchema = createInsertSchema(eventLog, {
  id: (s) => s.optional(),
  timestamp: (s) =>
    s.datetime({ message: "Timestamp must be a valid ISO string" }).optional(),
  details: (s) => s.min(1, "Details are required"),
  performedBy: (s) => s.min(1, "performedBy is required"),
  entityId: (s) => s.optional(),
});
export type InsertEventLog = z.infer<typeof insertEventLogSchema>;
