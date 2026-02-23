import type { Metadata } from "next";
import Stock from "@/components/pages/stock";

export const metadata: Metadata = {
  title: "Stock | Charity Corner",
  description: "Stock Inventory",
};

export default function StockPage() {
  return <Stock />;
}
