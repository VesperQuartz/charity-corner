import { poweredBy } from "hono/powered-by";
import { prettyJSON } from "hono/pretty-json";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { handle } from "hono/vercel";
import { pinoLogger } from "hono-pino";
import { createHandler as debugLog } from "hono-pino/debug-log";
import { pino } from "pino";
import { auth } from "@/lib/auth";
import { todo } from "@/routes/api/todo";
import { factory } from "@/routes/factory";

const app = factory.createApp().basePath("/api");

// app.use(logger());
console.log(process.env);
app.use(secureHeaders());
app.use(poweredBy());
app.use(prettyJSON()); // With options: prettyJSON({ space: 4 })
app.use("*", requestId());
app.use(
  pinoLogger({
    pino: pino({
      level: "info",
      transport: {
        target:
          process.env.NODE_ENV === "development"
            ? "hono-pino/debug-log"
            : "pino-pretty",
      },
      browser: {
        write: debugLog({
          colorEnabled: true,
        }),
      },
    }),
    contextKey: "logger" as const,
  }),
);

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }
  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.get("/healthcheck", async (ctx) => {
  const { logger } = ctx.var;
  logger.info("healthcheck");
  return ctx.json({ status: "ok" });
});

const routes = app.route("/", todo);

export const GET = handle(app);
export const POST = handle(app);
export const PUT = handle(app);
export const DELETE = handle(app);
export type AppType = typeof routes;
