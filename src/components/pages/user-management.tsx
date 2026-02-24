/** biome-ignore-all lint/a11y/noLabelWithoutControl: TODO */
"use client";
import { useForm } from "@tanstack/react-form";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  LoaderCircle,
  Shield,
  Trash2,
  User as UserIcon,
  UserPlus,
} from "lucide-react";
import React, { Activity } from "react";
import { toast } from "react-hot-toast/headless";
import z from "zod";
import { FormError } from "@/components/error-form";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import type { UserRole } from "@/types";

const userFormSchema = z.object({
  name: z.string().min(1, "Full name is required").trim(),
  email: z.email("Invalid email address").trim(),
  username: z.string().min(1, "Username is required").trim(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["admin", "cashier"]),
});

const UserManagement = () => {
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();
  const [isPending, startTransition] = React.useTransition();

  const usersQuery = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await authClient.admin.listUsers({
        query: {
          limit: 100,
        },
      });
      if (res.error) throw res.error;
      return res.data.users;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (value: z.infer<typeof userFormSchema>) => {
      const res = await authClient.admin.createUser(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          role: value.role,
          data: {
            username: value.username,
          },
        },
        {
          onSuccess: () => {
            toast.success(`${value.role.toUpperCase()} created successfully`);
          },
          onError: (err) => {
            toast.error(
              err instanceof Error ? err.message : "Failed to create user",
            );
          },
        },
      );
      await authClient.admin.updateUser({
        userId: res.data?.user.id,
        data: {
          username: value.username,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User created successfully");
      userForm.reset();
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to create user");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await authClient.admin.removeUser({
        userId,
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted successfully");
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : "Failed to delete user");
    },
  });

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
      startTransition(async () => {
        await createUserMutation.mutateAsync(value);
      });
    },
  });

  const users = usersQuery.data ?? [];

  const handleDeleteUser = (userId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete user: ${name}?`)) {
      deleteUserMutation.mutate(userId);
    }
  };

  return (
    <div className="flex h-full animate-in flex-col gap-6 duration-300 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <p className="text-gray-500">Add and manage staff access</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create User Form */}
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
                  <Activity mode={isPending ? "visible" : "hidden"}>
                    <LoaderCircle className="animate-spin" size={18} />
                  </Activity>
                </button>
              )}
            </userForm.Subscribe>
          </form>
        </div>

        {/* User List */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 bg-gray-50 p-4">
            <h3 className="font-bold text-gray-800">System Users</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-700 uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {usersQuery.isLoading ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <LoaderCircle
                          className="mb-4 animate-spin opacity-20"
                          size={48}
                        />
                        <p className="text-lg">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-8 text-center">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${user.role === "admin" ? "bg-gray-800" : "bg-pink-500"}`}
                          >
                            {user.role === "admin" ? (
                              <Shield size={14} />
                            ) : (
                              <UserIcon size={14} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-gray-800">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-400">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${user.role === "admin" ? "bg-gray-100 text-gray-700" : "bg-pink-100 text-pink-700"}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {user.id !== currentUser?.id && (
                          <button
                            type="button"
                            onClick={() => handleDeleteUser(user.id, user.name)}
                            className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                        {user.id === currentUser?.id && (
                          <span className="text-xs font-medium text-green-600">
                            Current User
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
