import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import {
  eventLog,
  insertVendorSchema,
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
    await db.transaction(async (tx) => {
      await tx.delete(vendors).where(eq(vendors.id, input.id));

      await tx.insert(eventLog).values({
        timestamp: new Date().toISOString(),
        action: "DELETE",
        entity: "VENDOR",
        entityId: input.id,
        details: `Deleted vendor ID: ${input.id}`,
        performedBy: context.user.name || context.user.id,
      });
    });
    return { success: true };
  });
