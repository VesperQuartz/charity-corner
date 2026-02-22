import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
  eventLog,
  insertProductSchema,
  products,
  updateProductSchema,
} from "@/repo/schema";
import { z } from "zod";

const createProductInputSchema = insertProductSchema.omit({ id: true });
const updateProductInputSchema = updateProductSchema.extend({
  id: z.string().min(1, "Product ID is required"),
});

export const getProducts = authorized
  .route({
    method: "GET",
    path: "/products",
  })
  .handler(async () => {
    return db.query.products.findMany();
  });

export const createProduct = authorized
  .input(createProductInputSchema)
  .handler(async ({ input, context }) => {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx.insert(products).values(input).returning();
      if (!created) throw new Error("Failed to create product");

      await tx.insert(eventLog).values({
        timestamp: new Date().toISOString(),
        action: "CREATE",
        entity: "PRODUCT",
        entityId: created.id,
        details: `Created product: ${input.name}`,
        performedBy: context.user.name || context.user.id,
      });

      return created;
    });
    return result;
  });

export const updateProduct = authorized
  .input(updateProductInputSchema)
  .handler(async ({ input, context }) => {
    const { id, ...data } = input;
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(products)
        .set(data)
        .where(eq(products.id, id))
        .returning();
      if (!updated) throw new Error("Product not found");

      await tx.insert(eventLog).values({
        timestamp: new Date().toISOString(),
        action: "UPDATE",
        entity: "PRODUCT",
        entityId: id,
        details: `Updated product: ${updated.name}`,
        performedBy: context.user.name || context.user.id,
      });

      return updated;
    });
    return result;
  });
