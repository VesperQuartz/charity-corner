import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";
import { real, sqliteTable, text } from "drizzle-orm/sqlite-core";
import {
  createInsertSchema,
  createSelectSchema,
  createUpdateSchema,
} from "drizzle-zod";
import { z } from "zod";
import { user } from "@/repo/schema/auth.schema";

export const paymentMethodValues = [
  "CASH",
  "TRANSFER",
  "POS",
  "CREDIT",
] as const;
export type PaymentMethod = (typeof paymentMethodValues)[number];

// One transaction = one sale receipt
export const transactions = sqliteTable("transactions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  date: text("date").notNull(),
  subtotal: real("subtotal").notNull(),
  total: real("total").notNull(),
  paymentMethod: text("payment_method", {
    enum: paymentMethodValues,
  }).notNull(),
  cashierId: text("cashier_id")
    .notNull()
    .references(() => user.id),
  debtorName: text("debtor_name"), // only set when paymentMethod is CREDIT
});

// Each product line within a transaction
// transactionId is the FK back to the parent — no need to store itemIds on the transaction itself
export const transactionItems = sqliteTable("transaction_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
  transactionId: text("transaction_id")
    .notNull()
    .references(() => transactions.id, { onDelete: "cascade" }),
  productId: text("product_id").notNull(), // intentionally no FK — product may be deleted later
  name: text("name").notNull(), // snapshot of product name at time of sale
  quantity: real("quantity").notNull(),
  priceAtSale: real("price_at_sale").notNull(), // snapshot of price at time of sale
});

// --- Relations ---

export const transactionsRelations = relations(
  transactions,
  ({ one, many }) => ({
    cashier: one(user, {
      fields: [transactions.cashierId],
      references: [user.id],
    }),
    items: many(transactionItems),
  }),
);

export const transactionItemsRelations = relations(
  transactionItems,
  ({ one }) => ({
    transaction: one(transactions, {
      fields: [transactionItems.transactionId],
      references: [transactions.id],
    }),
  }),
);

// --- Zod Schemas: Transaction Items ---

export const selectTransactionItemSchema = createSelectSchema(transactionItems);
export type SelectTransactionItem = z.infer<typeof selectTransactionItemSchema>;

export const insertTransactionItemSchema = createInsertSchema(
  transactionItems,
  {
    id: (s) => s.optional(),
    name: (s) => s.min(1, "Item name is required"),
    quantity: (s) => s.positive("Quantity must be greater than 0"),
    priceAtSale: (s) => s.nonnegative("Price cannot be negative"),
  },
);
export type InsertTransactionItem = z.infer<typeof insertTransactionItemSchema>;

// Items are never updated individually — they're immutable once created

// --- Zod Schemas: Transactions ---

export const selectTransactionSchema = createSelectSchema(transactions);
export type SelectTransaction = z.infer<typeof selectTransactionSchema>;

export const insertTransactionSchema = createInsertSchema(transactions, {
  id: (s) => s.optional(),
  date: (s) =>
    s.datetime({ message: "Date must be a valid ISO string" }).optional(),
  subtotal: (s) => s.nonnegative("Subtotal cannot be negative"),
  total: (s) => s.nonnegative("Total cannot be negative"),
  debtorName: (s) =>
    s.min(1, "Debtor name is required for credit transactions").optional(),
}).extend({
  // items are passed in together with the transaction and written to transaction_items separately
  items: z
    .array(insertTransactionItemSchema.omit({ transactionId: true }))
    .min(1, "A transaction must have at least one item"),
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// Transactions are receipts — only debtorName and paymentMethod can be corrected after the fact
export const updateTransactionSchema = createUpdateSchema(transactions).pick({
  paymentMethod: true,
  debtorName: true,
});
export type UpdateTransaction = z.infer<typeof updateTransactionSchema>;
