import { LoaderCircle, Shield, Trash2, User as UserIcon } from "lucide-react";
import React from "react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface UserListProps {
  isLoading: boolean;
  users: User[];
  currentUser: any;
  onDeleteUser: (userId: string, name: string) => void;
}

export const UserList = ({
  isLoading,
  users,
  currentUser,
  onDeleteUser,
}: UserListProps) => {
  return (
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
            {isLoading ? (
              <tr>
                <td colSpan={3} className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <LoaderCircle className="mb-4 animate-spin opacity-20" size={48} />
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
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                          user.role === "admin" ? "bg-gray-800" : "bg-pink-500"
                        }`}
                      >
                        {user.role === "admin" ? <Shield size={14} /> : <UserIcon size={14} />}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        user.role === "admin" ? "bg-gray-100 text-gray-700" : "bg-pink-100 text-pink-700"
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {user.id !== currentUser?.id && (
                      <button
                        type="button"
                        onClick={() => onDeleteUser(user.id, user.name)}
                        className="rounded-lg p-2 text-red-500 transition-colors hover:bg-red-50"
                        title="Delete User"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                    {user.id === currentUser?.id && (
                      <span className="text-xs font-medium text-green-600">Current User</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
