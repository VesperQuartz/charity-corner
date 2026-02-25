import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import z from "zod";
import { products } from "./products";
import { vendors } from "./vendors";

export const supplyEntries = sqliteTable("supply_entries", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  date: text("date").notNull(),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id, { onDelete: "cascade" }),
  productId: text("product_id")
    .notNull()
    .references(() => products.id, { onDelete: "cascade" }),
  quantity: real("quantity").notNull(),
  costPrice: real("cost_price").notNull(),
  sellingPrice: real("selling_price").notNull(),
  purchaseOrderNumber: text("purchase_order_number").notNull(),
  isPaid: integer("is_paid", { mode: "boolean" }).notNull().default(false),
});

// Each supply entry belongs to one vendor and one product
export const supplyEntriesRelations = relations(supplyEntries, ({ one }) => ({
  vendor: one(vendors, {
    fields: [supplyEntries.vendorId],
    references: [vendors.id],
  }),
  product: one(products, {
    fields: [supplyEntries.productId],
    references: [products.id],
  }),
}));

// --- Zod Schemas ---

export const selectSupplyEntrySchema = createSelectSchema(supplyEntries);
export type SelectSupplyEntry = z.infer<typeof selectSupplyEntrySchema>;

export const insertSupplyEntrySchema = createInsertSchema(supplyEntries, {
  id: (s) => s.optional(),
  date: () => z.string().min(1, "Date is required").optional(),
  quantity: (s) => s.positive("Quantity must be greater than 0"),
  costPrice: (s) => s.nonnegative("Cost price must be 0 or more"),
  sellingPrice: (s) => s.nonnegative("Selling price must be 0 or more"),
  purchaseOrderNumber: (s) => s.min(1, "Purchase order number is required"),
  isPaid: (s) => s.optional(),
});
export type InsertSupplyEntry = z.infer<typeof insertSupplyEntrySchema>;

export const updateSupplyEntrySchema = createUpdateSchema(supplyEntries, {
  quantity: (s) => s.positive("Quantity must be greater than 0").optional(),
  costPrice: (s) => s.positive("Cost price must be greater than 0").optional(),
  sellingPrice: (s) =>
    s.positive("Selling price must be greater than 0").optional(),
}).omit({ id: true });
export type UpdateSupplyEntry = z.infer<typeof updateSupplyEntrySchema>;
