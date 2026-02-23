import type { Metadata } from "next";
import History from "@/components/pages/history";

export const metadata: Metadata = {
  title: "History | Charity Corner",
  description: "Sales History",
};

export default function HistoryPage() {
  return <History />;
}
