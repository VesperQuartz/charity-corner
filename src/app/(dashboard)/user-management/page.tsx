import type { Metadata } from "next";
import UserManagement from "@/components/pages/user-management";

export const metadata: Metadata = {
  title: "User Management | Charity Corner",
  description: "Manage staff access",
};

export default function UserManagementPage() {
  return <UserManagement />;
}
