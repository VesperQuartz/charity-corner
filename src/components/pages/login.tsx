/** biome-ignore-all lint/a11y/noLabelWithoutControl: NOT IMPORTANT NOW */
"use client";

import { useForm } from "@tanstack/react-form";
import { ArrowRight, LoaderCircle, Lock, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { Activity } from "react";
import { toast } from "sonner";
import z from "zod";
import { FormError } from "@/components/error-form";
import { authClient } from "@/lib/auth-client";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Login = () => {
  const navigate = useRouter();
  const [loginState, loginAction] = React.useTransition();

  const loginForm = useForm({
    defaultValues: {
      username: "",
      password: "",
    },
    validators: {
      onSubmit: loginSchema,
    },
    onSubmit: (data) => {
      loginAction(async () => {
        try {
          await authClient.signIn.username(
            {
              username: data.value.username,
              password: data.value.password,
              callbackURL: "/",
            },
            {
              onError: (error) => {
                toast.error(
                  error.error.message
                    ? error.error.message
                    : "Something went wrong",
                );
              },
              onSuccess: () => {
                toast.success("Logged in successfully");
                navigate.push("/");
                loginForm.reset();
              },
            },
          );
        } catch (error) {
          console.error("Error-1", JSON.stringify(error, null, 2));
          console.log(error);
        }
      });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-sm animate-in overflow-hidden rounded-2xl bg-white shadow-xl duration-300 fade-in zoom-in">
        <div className="border-b border-gray-100 p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-pink-100 text-3xl font-bold text-pink-600">
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Charity Corner</h1>
          <p className="mt-2 text-sm text-gray-500">Point of Sale System</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            loginForm.handleSubmit();
          }}
          className="space-y-5 p-8"
        >
          {/* {error && ( */}
          {/*   <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm text-red-600"> */}
          {/*     {error} */}
          {/*   </div> */}
          {/* )} */}
          <loginForm.Field name="username">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <div className="relative">
                    <User
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      required
                      type="text"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Enter username"
                    />
                  </div>
                  <FormError field={field} />
                </div>
              );
            }}
          </loginForm.Field>
          <loginForm.Field name="password">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <div className="relative">
                    <Lock
                      className="absolute top-1/2 left-3 -translate-y-1/2 text-gray-400"
                      size={18}
                    />
                    <input
                      required
                      type="password"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 py-3 pr-4 pl-10 outline-none focus:ring-2 focus:ring-pink-500"
                      placeholder="Enter password"
                    />
                  </div>
                  <FormError field={field} />
                </div>
              );
            }}
          </loginForm.Field>
          <loginForm.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => {
              return (
                <button
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-gray-900 py-3 font-bold text-white shadow-lg transition-colors hover:bg-gray-800"
                >
                  Login <ArrowRight size={18} />{" "}
                  <Activity mode={loginState ? "visible" : "hidden"}>
                    <LoaderCircle className="animate-spin" />
                  </Activity>
                </button>
              );
            }}
          </loginForm.Subscribe>
          <div className="mb-1 flex items-center justify-center">
            <p className="text-sm text-gray-500">
              Don't have an account? <Link href="/register">Register</Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
