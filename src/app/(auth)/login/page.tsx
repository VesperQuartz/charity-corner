import type { Metadata } from "next";
import Login from "@/components/pages/login";

export const metadata: Metadata = {
  title: "Login | Charity Corner",
  description: "Login to your account",
};

export default function LoginPage() {
  return <Login />;
}
