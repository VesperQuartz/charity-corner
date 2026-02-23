import type { Metadata } from "next";
import VendorPage from "@/components/pages/vendor";

export const metadata: Metadata = {
  title: "Vendor Management | Charity Corner",
  description: "Manage vendors and supplies",
};

export default function VendorManagementPage() {
  return <VendorPage />;
}
