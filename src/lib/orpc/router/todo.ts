import { os } from "@orpc/server";
import { todoSchema } from "../schema";

export const createTodo = os.input(todoSchema).handler(() => {
  return [];
});

export const getTodo = os
  .route({
    method: "GET",
    path: "/todo",
  })
  .handler(() => {
    return [
      {
        name: "test-1",
      },
    ];
  });
