import type { Metadata } from "next";
import POS from "@/components/pages/pos";

export const metadata: Metadata = {
  title: "POS | Charity Corner",
  description: "Point of Sale System",
};

export default function POSPage() {
  return <POS />;
}
