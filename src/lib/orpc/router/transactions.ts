import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
  eventLog,
  insertTransactionSchema,
  products,
  transactionItems,
  transactions,
  updateTransactionSchema,
} from "@/repo/schema";
import { z } from "zod";

// Client sends: subtotal, total, paymentMethod, debtorName?, items. Server sets id, date, cashierId.
const createTransactionInputSchema = insertTransactionSchema.omit({
  id: true,
  date: true,
  cashierId: true,
});

const updateTransactionInputSchema = updateTransactionSchema.extend({
  id: z.string().min(1, "Transaction ID is required"),
});

export const getTransactions = authorized
  .route({ method: "GET", path: "/transactions" })
  .handler(async () => {
    return db.query.transactions.findMany({
      with: {
        items: true,
      },
    });
  });

export const updateTransaction = authorized
  .input(updateTransactionInputSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const [updated] = await db
      .update(transactions)
      .set(data)
      .where(eq(transactions.id, id))
      .returning();
    if (!updated) throw new Error("Transaction not found");
    return updated;
  });

export const createTransaction = authorized
  .input(createTransactionInputSchema)
  .handler(async ({ input, context }) => {
    const cashierId = context.user.id;
    const date = new Date().toISOString();

    const result = await db.transaction(async (tx) => {
      const [inserted] = await tx
        .insert(transactions)
        .values({
          date,
          subtotal: input.subtotal,
          total: input.total,
          paymentMethod: input.paymentMethod,
          cashierId,
          debtorName: input.debtorName ?? null,
        })
        .returning({ id: transactions.id });

      if (!inserted?.id) {
        throw new Error("Failed to create transaction");
      }

      const txnId = inserted.id;

      await tx.insert(transactionItems).values(
        input.items.map((item) => ({
          transactionId: txnId,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          priceAtSale: item.priceAtSale,
        })),
      );

      for (const item of input.items) {
        const [row] = await tx
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, item.productId));
        const newStock = Math.max(0, (row?.stock ?? 0) - item.quantity);
        await tx
          .update(products)
          .set({ stock: newStock })
          .where(eq(products.id, item.productId));
      }

      await tx.insert(eventLog).values({
        timestamp: date,
        action: "SALE",
        entity: "TRANSACTION",
        entityId: txnId,
        details: `Processed transaction #${txnId} - Total: ${input.total}`,
        performedBy: context.user.name ?? cashierId,
      });

      return {
        id: txnId,
        date,
        items: input.items,
        subtotal: input.subtotal,
        total: input.total,
        paymentMethod: input.paymentMethod,
        cashierId,
        debtorName: input.debtorName ?? undefined,
      };
    });

    return result;
  });
