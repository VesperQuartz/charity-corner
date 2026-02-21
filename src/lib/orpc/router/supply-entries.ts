import { eq } from "drizzle-orm";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
  insertSupplyEntrySchema,
  products,
  supplyEntries,
  updateSupplyEntrySchema,
} from "@/repo/schema";
import { z } from "zod";

// Accept date as YYYY-MM-DD string (form uses that)
const createSupplyEntryInputSchema = insertSupplyEntrySchema.omit({ id: true }).extend({
  date: z.string().min(1, "Date is required"),
});
const updateSupplyEntryInputSchema = updateSupplyEntrySchema.extend({
  id: z.string().min(1, "Supply entry ID is required"),
});
const deleteSupplyEntryInputSchema = z.object({ id: z.string().min(1) });

export const getSupplyEntries = authorized
  .route({ method: "GET", path: "/supply-entries" })
  .handler(async () => {
    const rows = await db.query.supplyEntries.findMany({
      with: {
        product: { columns: { name: true } },
        vendor: { columns: { name: true } },
      },
    });
    return rows.map((r) => {
      const { product, vendor, ...entry } = r;
      return {
        ...entry,
        productName: product.name,
        vendorName: vendor.name,
      };
    });
  });

export const createSupplyEntry = authorized
  .input(createSupplyEntryInputSchema)
  .handler(async ({ input }) => {
    return db.transaction(async (tx) => {
      const [entry] = await tx.insert(supplyEntries).values(input).returning();
      if (!entry) throw new Error("Failed to create supply entry");

      const [product] = await tx
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, entry.productId));
      const newStock = (product?.stock ?? 0) + entry.quantity;
      await tx
        .update(products)
        .set({
          stock: newStock,
          costPrice: entry.costPrice,
          sellingPrice: entry.sellingPrice,
          lastSupplyDate: entry.date,
          vendorId: entry.vendorId,
        })
        .where(eq(products.id, entry.productId));

      return entry;
    });
  });

export const updateSupplyEntry = authorized
  .input(updateSupplyEntryInputSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    return db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(supplyEntries)
        .where(eq(supplyEntries.id, id));
      if (!existing) throw new Error("Supply entry not found");

      const quantityDiff = (data.quantity ?? existing.quantity) - existing.quantity;
      const [updated] = await tx
        .update(supplyEntries)
        .set(data)
        .where(eq(supplyEntries.id, id))
        .returning();
      if (!updated) throw new Error("Failed to update");

      if (quantityDiff !== 0) {
        const [product] = await tx
          .select({ stock: products.stock })
          .from(products)
          .where(eq(products.id, existing.productId));
        const newStock = Math.max(0, (product?.stock ?? 0) + quantityDiff);
        await tx
          .update(products)
          .set({
            stock: newStock,
            ...(data.costPrice != null && { costPrice: data.costPrice }),
            ...(data.sellingPrice != null && { sellingPrice: data.sellingPrice }),
          })
          .where(eq(products.id, existing.productId));
      } else if (data.costPrice != null || data.sellingPrice != null) {
        await tx
          .update(products)
          .set({
            ...(data.costPrice != null && { costPrice: data.costPrice }),
            ...(data.sellingPrice != null && { sellingPrice: data.sellingPrice }),
          })
          .where(eq(products.id, existing.productId));
      }

      return updated;
    });
  });

export const deleteSupplyEntry = authorized
  .input(deleteSupplyEntryInputSchema)
  .handler(async ({ input }) => {
    return db.transaction(async (tx) => {
      const [entry] = await tx
        .select()
        .from(supplyEntries)
        .where(eq(supplyEntries.id, input.id));
      if (!entry) throw new Error("Supply entry not found");

      const [product] = await tx
        .select({ stock: products.stock })
        .from(products)
        .where(eq(products.id, entry.productId));
      const newStock = Math.max(0, (product?.stock ?? 0) - entry.quantity);
      await tx
        .update(products)
        .set({ stock: newStock })
        .where(eq(products.id, entry.productId));

      await tx.delete(supplyEntries).where(eq(supplyEntries.id, input.id));
      return { success: true };
    });
  });
