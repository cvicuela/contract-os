import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Sidebar from "./components/Sidebar";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import UserMenu from "@/components/UserMenu";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ContractOS",
  description: "Contract Intelligence Platform powered by Claude AI",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="h-full flex antialiased">
        <SessionProvider session={session}>
          <Sidebar />
          <div className="flex-1 flex flex-col min-h-0 bg-gray-50">
            {/* Top bar */}
            <header className="flex items-center justify-between py-3 px-6 bg-white border-b border-gray-100 shrink-0">
              <div>{/* Page title injected by individual pages */}</div>
              <UserMenu />
            </header>

            {/* Main content */}
            <main className="flex-1 overflow-y-auto">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
