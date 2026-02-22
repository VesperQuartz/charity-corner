import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, bearer, openAPI, username } from "better-auth/plugins";
import { db } from "./database";
import { eventLog } from "@/repo/schema/event-log";
import { createId } from "@paralleldrive/cuid2";
import { ac, adminRole, customRole, userRole } from "./permission";

export const auth = betterAuth({
  baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  rateLimit: {
    window: 10,
    max: 100,
    enabled: true,
  },
  trustedOrigins: ["http://localhost:*"],
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 6,
    requireEmailVerification: false,
    autoSignIn: true,
  },
  emailVerification: {
    sendOnSignUp: true,
    sendOnSignIn: false,
    // sendVerificationEmail: async ({ user, url }) => {
    //   const mail = new MailServer(transporter);
    //   await mail.sendVerificationEmail({
    //     recipient: user.email,
    //     tokenUrl: url,
    //   });
    // },
    // afterEmailVerification: async (data) => {
    //   console.log(data);
    // },
  },
  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),
  plugins: [
    nextCookies(),
    username(),
    admin({
      ac,
      roles: {
        admin: adminRole,
        user: userRole,
        cashier: userRole,
        custom: customRole,
        superadmin: adminRole,
      },
      defaultRole: "cashier",
      adminRoles: ["admin", "superadmin"],
    }),
    openAPI(),
    bearer(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          if (ctx?.body?.role === "cashier") {
            return {
              data: { ...user },
            };
          }
          return { data: { ...user, role: "admin" } };
        },
        after: async (user) => {
          await db.insert(eventLog).values({
            id: `log_${createId()}`,
            timestamp: new Date().toISOString(),
            action: "CREATE",
            entity: "USER",
            entityId: user.id,
            details: `Created user: ${user.name} (${user.email})`,
            performedBy: "System/Admin",
          });
        },
      },
      delete: {
        after: async (user) => {
          await db.insert(eventLog).values({
            id: `log_${createId()}`,
            timestamp: new Date().toISOString(),
            action: "DELETE",
            entity: "USER",
            entityId: user.id,
            details: `Deleted user: ${user.name} (${user.email})`,
            performedBy: "System/Admin",
          });
        },
      },
    },
    session: {
      create: {
        after: async (session) => {
          const userRecord = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, session.userId),
          });
          await db.insert(eventLog).values({
            id: `log_${createId()}`,
            timestamp: new Date().toISOString(),
            action: "LOGIN",
            entity: "USER",
            entityId: session.userId,
            details: `User logged in: ${userRecord?.name || session.userId}`,
            performedBy: userRecord?.name || session.userId,
          });
        },
      },
      delete: {
        after: async (session) => {
          const userRecord = await db.query.user.findFirst({
            where: (u, { eq }) => eq(u.id, session.userId),
          });
          await db.insert(eventLog).values({
            id: `log_${createId()}`,
            timestamp: new Date().toISOString(),
            action: "LOGOUT",
            entity: "USER",
            entityId: session.userId,
            details: `User logged out: ${userRecord?.name || session.userId}`,
            performedBy: userRecord?.name || session.userId,
          });
        },
      },
    },
  },
});
