import {
  adminClient,
  inferAdditionalFields,
  usernameClient,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import { env } from "@/env/client";
import { ac, adminRole, customRole, userRole } from "@/lib/permission";
import type { auth } from "./auth";

export const authClient = createAuthClient({
  baseURL: env.NEXT_PUBLIC_BASE_URL,
  plugins: [
    adminClient({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
        cashier: userRole,
        custom: customRole,
        superadmin: adminRole,
      },
      defaultRole: "user",
      adminRoles: ["admin", "superadmin", "ADMIN"],
    }),
    inferAdditionalFields<typeof auth>(),
    usernameClient(),
  ],
});
