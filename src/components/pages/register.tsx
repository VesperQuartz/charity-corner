/** biome-ignore-all lint/a11y/noLabelWithoutControl: NOT IMPORTANT NOW */
"use client";

import { useForm } from "@tanstack/react-form";
import { LoaderCircle, Save, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { Activity } from "react";
import { toast } from "sonner";
import z from "zod";
import { FormError } from "@/components/error-form";
import { authClient } from "@/lib/auth-client";

const registerSchema = z.object({
  name: z.string().min(1, "Name is required").trim(),
  username: z.string().min(1, "Username is required").trim(),
  email: z.string().email("Invalid email").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

const Register = () => {
  const navigate = useRouter();
  const [regState, regAction] = React.useTransition();

  const registrationForm = useForm({
    defaultValues: {
      name: "",
      username: "",
      password: "",
      email: "",
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: (data) => {
      regAction(async () => {
        try {
          await authClient.signUp.email(
            {
              email: data.value.email,
              name: data.value.name,
              password: data.value.password,
              username: data.value.username,
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
                navigate.push("/");
              },
            },
          );
        } catch (error) {
          console.error("Error-1", JSON.stringify(error, null, 2));
        }
        console.log(data);
      });
    },
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md animate-in overflow-hidden rounded-2xl bg-white shadow-xl duration-300 fade-in zoom-in">
        <div className="bg-pink-600 p-3 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-2xl font-bold text-white">
            Initial System Setup
          </h1>
          <p className="mt-2 text-pink-100">
            Create the main Administrator account to get started.
          </p>
        </div>

        <form
          className="space-y-5 p-8"
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            registrationForm.handleSubmit();
            // handleSetup(e);
          }}
        >
          <registrationForm.Field name="name">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    id={field.name}
                    required
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="e.g. John Doe"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormError field={field} />
                </div>
              );
            }}
          </registrationForm.Field>
          <registrationForm.Field name="username">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Username
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="john.doe"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormError field={field} />
                </div>
              );
            }}
          </registrationForm.Field>
          <registrationForm.Field name="email">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="admin@admin.com"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormError field={field} />
                </div>
              );
            }}
          </registrationForm.Field>
          <registrationForm.Field name="password">
            {(field) => {
              return (
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <input
                    required
                    type="password"
                    className="w-full rounded-lg border border-gray-300 p-3 outline-none focus:ring-2 focus:ring-pink-500"
                    placeholder="••••••••"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FormError field={field} />
                </div>
              );
            }}
          </registrationForm.Field>
          <registrationForm.Subscribe
            selector={(state) => [state.canSubmit, state.isSubmitting]}
          >
            {([canSubmit, isSubmitting]) => {
              return (
                <button
                  disabled={!canSubmit || isSubmitting}
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 py-3 font-bold text-white shadow-md transition-colors hover:bg-pink-700"
                >
                  <Save size={20} /> Create Administrator{" "}
                  <Activity mode={regState ? "visible" : "hidden"}>
                    <LoaderCircle className="animate-spin" />
                  </Activity>
                </button>
              );
            }}
          </registrationForm.Subscribe>
        </form>
      </div>
    </div>
  );
};

export default Register;
