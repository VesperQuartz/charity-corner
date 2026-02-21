import { zValidator } from "@hono/zod-validator";
import z from "zod";
import { authMiddleware, factory } from "@/routes/factory";

export const todo = factory
  .createApp()
  .basePath("/todos")
  .use("*", authMiddleware)
  .post("/", zValidator("json", z.object({})), async (ctx) => {
    return ctx.json({ message: "Hello World" });
  });
