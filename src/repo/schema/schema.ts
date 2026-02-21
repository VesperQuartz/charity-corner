import { createId } from "@paralleldrive/cuid2";
import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const todo = sqliteTable("todo", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => createId()),
});
