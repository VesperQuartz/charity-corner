import { db } from "@/lib/database";
import { authorized } from "@/lib/orpc/context/authorized";

export const getProducts = authorized
  .route({
    method: "GET",
    path: "/products",
  })
  .handler(async () => {
    const products = await db.query.products.findMany();
    console.log("product", products);
    return products;
  });
