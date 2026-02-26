import { useForm } from "@tanstack/react-form";
import { LoaderCircle, UserPlus } from "lucide-react";
import React from "react";
import { FormError } from "@/components/error-form";
import type { UserRole } from "@/types";
import { z } from "zod";

const userFormSchema = z.object({
  name: z.string().min(1, "Full name is required").trim(),
  email: z.string().email("Invalid email address").trim(),
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cashier"]),
});

interface CreateUserFormProps {
  onSubmit: (value: z.infer<typeof userFormSchema>) => Promise<void>;
  isPending: boolean;
}

export const CreateUserForm = ({ onSubmit, isPending }: CreateUserFormProps) => {
  const userForm = useForm({
    defaultValues: {
      name: "",
      email: "",
      username: "",
      password: "",
      role: "cashier" as UserRole,
    },
    validators: {
      onSubmit: userFormSchema,
    },
    onSubmit: async ({ value }) => {
      await onSubmit(value);
      userForm.reset();
    },
  });

  return (
    <div className="h-112.5 overflow-y-scroll rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
      <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
        <UserPlus size={20} className="text-pink-600" /> Add New User
      </h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          userForm.handleSubmit();
        }}
        className="space-y-4"
      >
        <userForm.Field name="name">
          {(field) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="John Doe"
              />
              <FormError field={field} />
            </div>
          )}
        </userForm.Field>

        <userForm.Field name="email">
          {(field) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="john@example.com"
              />
              <FormError field={field} />
            </div>
          )}
        </userForm.Field>

        <userForm.Field name="username">
          {(field) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                type="text"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="jdoe"
              />
              <FormError field={field} />
            </div>
          )}
        </userForm.Field>

        <userForm.Field name="password">
          {(field) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                value={field.state.value}
                onChange={(e) => field.handleChange(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="••••••"
              />
              <FormError field={field} />
            </div>
          )}
        </userForm.Field>

        <userForm.Field name="role">
          {(field) => (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={field.state.value}
                onChange={(e) =>
                  field.handleChange(e.target.value as UserRole)
                }
                className="w-full rounded-lg border border-gray-200 bg-white p-2 outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value="cashier">Cashier</option>
                <option value="admin">Administrator</option>
              </select>
              <FormError field={field} />
            </div>
          )}
        </userForm.Field>

        <userForm.Subscribe
          selector={(state) => [state.canSubmit, state.isSubmitting]}
        >
          {([canSubmit, isSubmitting]) => (
            <button
              disabled={!canSubmit || isSubmitting || isPending}
              type="submit"
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-pink-600 py-2 font-bold text-white shadow-sm transition-colors hover:bg-pink-700"
            >
              Create Account
              {isPending && <LoaderCircle className="animate-spin" size={18} />}
            </button>
          )}
        </userForm.Subscribe>
      </form>
    </div>
  );
};
