import { ORPCError } from "@orpc/server";
import { eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
  eventLog,
  insertVendorSchema,
  products,
  supplyEntries,
  updateVendorSchema,
  vendors,
} from "@/repo/schema";

const createVendorInputSchema = insertVendorSchema.omit({ id: true });
const updateVendorInputSchema = updateVendorSchema.extend({
  id: z.string().min(1, "Vendor ID is required"),
});
const deleteVendorInputSchema = z.object({ id: z.string().min(1) });

export const getVendors = authorized
  .route({ method: "GET", path: "/vendors" })
  .handler(async () => {
    return db.query.vendors.findMany();
  });

export const createVendor = authorized
  .route({ method: "POST", path: "/vendors" })
  .input(createVendorInputSchema)
  .handler(async ({ input, context }) => {
    const result = await db.transaction(async (tx) => {
      const [created] = await tx.insert(vendors).values(input).returning();

      await tx.insert(eventLog).values({
        timestamp: new Date().toISOString(),
        action: "CREATE",
        entity: "VENDOR",
        entityId: created.id,
        details: `Created vendor: ${input.name}`,
        performedBy: context.user.name || context.user.id,
      });

      return created;
    });
    return result;
  });

export const updateVendor = authorized
  .input(updateVendorInputSchema)
  .handler(async ({ input, context }) => {
    const { id, ...data } = input;
    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(vendors)
        .set(data)
        .where(eq(vendors.id, id))
        .returning();
      if (!updated) throw new Error("Vendor not found");

      await tx.insert(eventLog).values({
        timestamp: new Date().toISOString(),
        action: "UPDATE",
        entity: "VENDOR",
        entityId: id,
        details: `Updated vendor: ${updated.name}`,
        performedBy: context.user.name || context.user.id,
      });

      return updated;
    });
    return result;
  });

export const deleteVendor = authorized
  .input(deleteVendorInputSchema)
  .handler(async ({ input, context }) => {
    try {
      await db.transaction(async (tx) => {
        // 1. Find all products belonging to this vendor
        const vendorProducts = await tx
          .select({ id: products.id })
          .from(products)
          .where(eq(products.vendorId, input.id));
        
        const productIds = vendorProducts.map((p) => p.id);

        // 2. Delete supply entries referencing these products
        if (productIds.length > 0) {
          await tx
            .delete(supplyEntries)
            .where(inArray(supplyEntries.productId, productIds));
        }

        // 3. Delete supply entries directly linked to this vendor
        await tx
          .delete(supplyEntries)
          .where(eq(supplyEntries.vendorId, input.id));

        // 4. Delete the products
        await tx.delete(products).where(eq(products.vendorId, input.id));
        
        // 5. Finally delete the vendor
        const [deleted] = await tx.delete(vendors).where(eq(vendors.id, input.id)).returning();
        if (!deleted) {
          throw new ORPCError("NOT_FOUND", { message: "Vendor not found" });
        }

        await tx.insert(eventLog).values({
          timestamp: new Date().toISOString(),
          action: "DELETE",
          entity: "VENDOR",
          entityId: input.id,
          details: `Deleted vendor: ${deleted.name} (ID: ${input.id})`,
          performedBy: context.user.name || context.user.id,
        });
      });
      return { success: true };
    } catch (error) {
      if (error instanceof ORPCError) throw error;
      console.error("Delete Vendor Error:", error);
      throw new ORPCError("INTERNAL_SERVER_ERROR", {
        message: error instanceof Error ? error.message : "Failed to delete vendor",
      });
    }
  });
