"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const signUp = async (_prev: unknown, form: FormData) => {
  const { email, password } = Object.fromEntries(form.entries());
  await auth.api.signInEmail({
    headers: await headers(),
    body: {
      email: String(email),
      password: String(password),
      callbackURL: "/",
      rememberMe: true,
    },
  });
  return redirect("/");
};
