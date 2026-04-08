import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { I18nProvider } from "@/i18n/context";
import ConditionalLayout from "./components/ConditionalLayout";

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
          <I18nProvider>
            <ConditionalLayout>
              {children}
            </ConditionalLayout>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
