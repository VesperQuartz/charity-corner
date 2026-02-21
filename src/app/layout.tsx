import "../lib/orpc.server";
import type { Metadata } from "next";
import { Hanken_Grotesk } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";
import { ThemeProvider } from "next-themes";
import { AsyncProvider } from "@/providers/async";
import { LoadingProvider } from "@/providers/loader";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Charity Corner",
  description: "Charity Corner",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <body
        className={`${hanken.className} antialiased`}
        suppressHydrationWarning={true}
      >
        <AsyncProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <LoadingProvider>
              <NuqsAdapter
                defaultOptions={{
                  clearOnDefault: true,
                  limitUrlUpdates: {
                    method: "debounce",
                    timeMs: 50,
                  },
                  shallow: true,
                }}
              >
                {children}
              </NuqsAdapter>
            </LoadingProvider>
          </ThemeProvider>
        </AsyncProvider>
        <Toaster />
      </body>
    </html>
  );
}
