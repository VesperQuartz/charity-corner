import {
  BodyLimitPlugin,
  CompressionPlugin,
  RPCHandler,
} from "@orpc/server/fetch";
import { BatchHandlerPlugin, CORSPlugin, RequestHeadersPlugin } from "@orpc/server/plugins";
import { headers } from "next/headers";
import router from "@/lib/orpc/router";

const handler = new RPCHandler(router, {
  plugins: [
    new RequestHeadersPlugin(),
    new CORSPlugin({
      origin: (origin) => origin,
      allowMethods: ["GET", "HEAD", "PUT", "POST", "DELETE", "PATCH"],
    }),
    new BatchHandlerPlugin(),
    new CompressionPlugin(),
    new BodyLimitPlugin({
      maxBodySize: 1024 * 1024 * 5, // 5MB
    }),
  ],
});

async function handleRequest(request: Request) {
  const { response } = await handler.handle(request, {
    prefix: "/api/rpc",
    context: {
      headers: await headers(),
    }, // Provide initial context if needed
  });

  return response ?? new Response("Not found", { status: 404 });
}

export const HEAD = handleRequest;
export const GET = handleRequest;
export const POST = handleRequest;
export const PUT = handleRequest;
export const PATCH = handleRequest;
export const DELETE = handleRequest;
