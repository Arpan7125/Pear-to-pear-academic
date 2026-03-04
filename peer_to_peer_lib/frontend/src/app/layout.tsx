import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";
import AppShell from "@/components/AppShell";

export const metadata: Metadata = {
  title: "Knowledge Exchange — P2P Academic Library",
  description:
    "A decentralized peer-to-peer academic resource sharing platform built with Go",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="">
      <body>
        {/* Ambient mesh gradient layers */}
        <div className="mesh-bg" aria-hidden="true" />
        <div className="mesh-bg-extra" aria-hidden="true" />
        <div className="grid-pattern" aria-hidden="true" />

        <AuthProvider>
          <AppShell>{children}</AppShell>
        </AuthProvider>
      </body>
    </html>
  );
}
