import type { Metadata } from "next";
import Dashboard from "@/components/pages/dashboard";

export const metadata: Metadata = {
  title: "Dashboard | Charity Corner",
  description: "Charity Corner dashboard",
};

export default function DashboardPage() {
  return <Dashboard />;
}
