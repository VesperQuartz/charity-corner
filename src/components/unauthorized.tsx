"use client";
import { ShieldAlert } from "lucide-react";

export const UnauthorizedView = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center rounded-xl bg-gray-50 p-8 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-red-600">
        <ShieldAlert size={40} />
      </div>
      <h2 className="mb-2 text-2xl font-bold text-gray-800">Access Denied</h2>
      <p className="max-w-md text-gray-600">
        You do not have permission to perform this action. Please contact your
        administrator.
      </p>
    </div>
  );
};
