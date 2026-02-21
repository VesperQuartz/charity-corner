import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
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
  .handler(async ({ input }) => {
    const [created] = await db.insert(products).values(input).returning();
    if (!created) throw new Error("Failed to create product");
    return created;
  });

export const updateProduct = authorized
  .input(updateProductInputSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const [updated] = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    if (!updated) throw new Error("Product not found");
    return updated;
  });
