import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import type z from "zod";
import { supplyEntries } from "./supply-entries";
import { vendors } from "./vendors";

export const products = sqliteTable("products", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  name: text("name").notNull(),
  costPrice: real("cost_price").notNull(),
  sellingPrice: real("selling_price").notNull(),
  stock: integer("stock").notNull().default(0),
  vendorId: text("vendor_id")
    .notNull()
    .references(() => vendors.id),
  lastSupplyDate: text("last_supply_date"),
  lowStockThreshold: integer("low_stock_threshold"),
});

// One product belongs to one vendor, and can appear in many supply entries
export const productsRelations = relations(products, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [products.vendorId],
    references: [vendors.id],
  }),
  supplyEntries: many(supplyEntries),
}));

// --- Zod Schemas ---

export const selectProductSchema = createSelectSchema(products);
export type SelectProduct = z.infer<typeof selectProductSchema>;

export const insertProductSchema = createInsertSchema(products, {
  id: (s) => s.optional(),
  name: (s) => s.min(1, "Product name is required"),
  costPrice: (s) => s.nonnegative("Cost price must be 0 or more"),
  sellingPrice: (s) => s.nonnegative("Selling price must be 0 or more"),
  stock: (s) => s.int().nonnegative("Stock cannot be negative").optional(),
  lowStockThreshold: (s) =>
    s.int().nonnegative("Threshold cannot be negative").optional(),
});

export type InsertProduct = z.infer<typeof insertProductSchema>;

export const updateProductSchema = createUpdateSchema(products, {
  name: (s) => s.min(1, "Product name is required").optional(),
  costPrice: (s) => s.nonnegative("Cost price must be 0 or more").optional(),
  sellingPrice: (s) =>
    s.nonnegative("Selling price must be 0 or more").optional(),
  stock: (s) => s.int().nonnegative("Stock cannot be negative").optional(),
  lowStockThreshold: (s) =>
    s.int().nonnegative("Threshold cannot be negative").optional(),
}).omit({ id: true });
export type UpdateProduct = z.infer<typeof updateProductSchema>;
