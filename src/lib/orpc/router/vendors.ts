import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";
import { insertVendorSchema, updateVendorSchema, vendors } from "@/repo/schema";

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
  .handler(async ({ input }) => {
    console.log("Input", input);
    const [created] = await db.insert(vendors).values(input).returning();
    return created;
  });

export const updateVendor = authorized
  .input(updateVendorInputSchema)
  .handler(async ({ input }) => {
    const { id, ...data } = input;
    const [updated] = await db
      .update(vendors)
      .set(data)
      .where(eq(vendors.id, id))
      .returning();
    if (!updated) throw new Error("Vendor not found");
    return updated;
  });

export const deleteVendor = authorized
  .input(deleteVendorInputSchema)
  .handler(async ({ input }) => {
    await db.delete(vendors).where(eq(vendors.id, input.id));
    return { success: true };
  });
