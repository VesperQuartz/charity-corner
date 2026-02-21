import { hc } from "hono/client";
import type { AppType } from "@/app/api/[[...route]]/route";
import { env } from "@/env/client";

export const client = hc<AppType>(env.NEXT_PUBLIC_BASE_URL, {
  init: {
    credentials: "include",
  },
});
