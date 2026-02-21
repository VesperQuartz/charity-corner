import { base } from "@/lib/orpc/context";
import { authMiddleware } from "@/lib/orpc/middleware/index";

export const authorized = base.use(authMiddleware);
