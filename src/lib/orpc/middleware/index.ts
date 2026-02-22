import { ORPCError } from "@orpc/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { base } from "@/lib/orpc/context";

export const authMiddleware = base.middleware(async ({ context, next }) => {
  const sessionData = await auth.api.getSession({
    headers: context.reqHeaders ?? new Headers(await headers()), // or reqHeaders if you're using the plugin
  });

  if (!sessionData?.session || !sessionData?.user) {
    throw new ORPCError("UNAUTHORIZED");
  }

  return next({
    context: {
      session: sessionData.session,
      user: sessionData.user,
    },
  });
});
