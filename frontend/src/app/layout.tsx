import type { Metadata } from "next";

import AuthGate from "@/components/AuthGate";

import "./globals.css";

export const metadata: Metadata = {
  title: "Private PDF Tool",
  description: "A private workspace for simple PDF operations.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
