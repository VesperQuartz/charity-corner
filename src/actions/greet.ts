"use server";

import { z } from "zod";
import { actionClient } from "./safe-action";

const inputSchema = z.object({
  name: z.string().min(1),
});

export const greetAction = actionClient
  .inputSchema(inputSchema)
  .action(async ({ parsedInput, ctx }) => {
    console.log(ctx);
    return {
      message: `Hello, ${parsedInput.name}!`,
    };
  });
