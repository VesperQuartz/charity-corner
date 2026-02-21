import { z } from "zod";

export const envSchema = z.object({
  DATABASE_URL: z.string(),
  MAIL_EMAIL: z.string(),
  MAIL_PASS: z.string(),
  AUTH_TOKEN: z.string(),
});

export const env = envSchema.parse(process.env);
