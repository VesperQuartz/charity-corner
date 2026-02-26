"use client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React from "react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { authClient } from "@/lib/auth-client";
import { CreateUserForm } from "./user-management/create-user-form";
import { UserList } from "./user-management/user-list";

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
    mutationFn: async (value: any) => {
      const res = await authClient.admin.createUser(
        {
          email: value.email,
          password: value.password,
          name: value.name,
          role: value.role,
          data: {
            username: value.username,
          },
        }
      );
      if (res.error) throw res.error;
      
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

  const handleCreateUser = async (value: any) => {
    startTransition(async () => {
      await createUserMutation.mutateAsync(value);
    });
  };

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
        <CreateUserForm onSubmit={handleCreateUser} isPending={isPending} />
        <UserList
          isLoading={usersQuery.isLoading}
          users={usersQuery.data as any ?? []}
          currentUser={currentUser}
          onDeleteUser={handleDeleteUser}
        />
      </div>
    </div>
  );
};

export default UserManagement;
