/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";
import { Shield, Trash2, User as UserIcon, UserPlus } from "lucide-react";
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useStore } from "@/context/StoreContext";
import { UserRole } from "@/types";

const UserManagement = () => {
  const { users, addUser, deleteUser, currentUser } = useAuth();
  const { logEvent } = useStore();
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<UserRole>(UserRole.CASHIER);

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newPassword) return;

    const newUserId = `user_${Date.now()}`;
    addUser({
      id: newUserId,
      name: newName,
      username: newUsername,
      password: newPassword,
      role: newRole,
    });

    logEvent(
      "CREATE",
      "USER",
      `Created user: ${newUsername} (${newRole})`,
      newUserId,
      currentUser?.name,
    );

    setNewName("");
    setNewUsername("");
    setNewPassword("");
    setNewRole(UserRole.CASHIER);
  };

  return (
    <div className="flex h-full animate-in flex-col gap-6 duration-300 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">User Management</h2>
        <p className="text-gray-500">Add and manage staff access</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Create User Form */}
        <div className="h-fit rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-gray-800">
            <UserPlus size={20} className="text-pink-600" /> Add New User
          </h3>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                required
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                required
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="jdoe"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                required
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-200 p-2 outline-none focus:ring-2 focus:ring-pink-500"
                placeholder="••••••"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value as UserRole)}
                className="w-full rounded-lg border border-gray-200 bg-white p-2 outline-none focus:ring-2 focus:ring-pink-500"
              >
                <option value={UserRole.CASHIER}>Cashier</option>
                <option value={UserRole.ADMIN}>Administrator</option>
              </select>
            </div>
            <button
              type="submit"
              className="mt-2 w-full rounded-lg bg-pink-600 py-2 font-bold text-white shadow-sm transition-colors hover:bg-pink-700"
            >
              Create Account
            </button>
          </form>
        </div>

        {/* User List */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-gray-100 bg-gray-50 p-4">
            <h3 className="font-bold text-gray-800">System Users</h3>
          </div>
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="sticky top-0 bg-gray-50 text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-6 py-3">User</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${user.role === UserRole.ADMIN ? "bg-gray-800" : "bg-pink-500"}`}
                        >
                          {user.role === UserRole.ADMIN ? (
                            <Shield size={14} />
                          ) : (
                            <UserIcon size={14} />
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{user.name}</p>
                          <p className="text-xs text-gray-400">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold ${user.role === UserRole.ADMIN ? "bg-gray-100 text-gray-700" : "bg-pink-100 text-pink-700"}`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {user.id !== currentUser?.id && (
                        <button
                          type="button"
                          onClick={() => {
                            if (
                              window.confirm(
                                "Are you sure you want to delete this user?",
                              )
                            ) {
                              deleteUser(user.id);
                              logEvent(
                                "DELETE",
                                "USER",
                                `Deleted user: ${user.username}`,
                                user.id,
                                currentUser?.name,
                              );
                            }
                          }}
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
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
