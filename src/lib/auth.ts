import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { admin, bearer, openAPI, username } from "better-auth/plugins";
import { env } from "@/env/server";
import { MailServer } from "@/services/mail";
import { db } from "./database";
import { transporter } from "./mail";
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
        custom: customRole,
        superadmin: adminRole,
      },
      defaultRole: "user",
      adminRoles: ["admin", "superadmin"],
    }),
    openAPI(),
    bearer(),
  ],
  databaseHooks: {
    user: {
      create: {
        before: async (user, ctx) => {
          console.log({
            user,
          });
          if (ctx?.body?.role === "user") {
            return {
              data: { ...user },
            };
          }
          return { data: { ...user, role: "ADMIN" } };
        },
      },
    },
  },
});
