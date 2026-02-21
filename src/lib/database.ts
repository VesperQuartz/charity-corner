import "dotenv/config";
import { drizzle } from "drizzle-orm/libsql";
import { env } from "@/env/server";
import * as schema from "@/repo/schema";

export const db = drizzle({
  connection: {
    url: env.DATABASE_URL,
    authToken: env.AUTH_TOKEN,
  },
  schema,
});

export type Db = typeof db;
