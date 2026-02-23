import type { Metadata } from "next";
import Register from "@/components/pages/register";

export const metadata: Metadata = {
  title: "Register | Charity Corner",
  description: "Create a new account",
};

export default function RegisterPage() {
  return <Register />;
}
