import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
import { products } from "./products";
import { supplyEntries } from "./supply-entries";

export const vendors = sqliteTable("vendors", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  contact: text("contact").notNull(),
  email: text("email").notNull(),
});

// One vendor can supply many products and have many supply entries
export const vendorsRelations = relations(vendors, ({ many }) => ({
  products: many(products),
  supplyEntries: many(supplyEntries),
}));

// --- Zod Schemas ---

export const selectVendorSchema = createSelectSchema(vendors);
export type SelectVendor = z.infer<typeof selectVendorSchema>;

export const insertVendorSchema = createInsertSchema(vendors, {
  id: (s) => s.optional(),
  name: (s) => s.min(1, "Vendor name is required"),
  contact: (s) => s.min(1, "Contact is required"),
  email: (s) => s.email("Must be a valid email address"),
});
export type InsertVendor = z.infer<typeof insertVendorSchema>;

export const updateVendorSchema = createUpdateSchema(vendors, {
  name: (s) => s.min(1, "Vendor name is required").optional(),
  email: (s) => s.email("Must be a valid email address").optional(),
}).omit({ id: true });
export type UpdateVendor = z.infer<typeof updateVendorSchema>;
