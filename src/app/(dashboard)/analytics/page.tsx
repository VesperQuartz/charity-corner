import type { Metadata } from "next";
import Analytics from "@/components/pages/analytics";

export const metadata: Metadata = {
  title: "Analytics | Charity Corner",
  description: "Business Analytics",
};

export default function AnalyticsPage() {
  return <Analytics />;
}
