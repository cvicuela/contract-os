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
  title: "ContractOS — AI Contract Intelligence Platform",
  description: "Upload any contract and get a full AI analysis — risk score, obligations, and an action plan — in under 30 seconds. Powered by Claude AI.",
  openGraph: {
    title: "ContractOS — AI Contract Intelligence Platform",
    description: "Upload any contract and get a full AI analysis — risk score, obligations, and an action plan — in under 30 seconds.",
    siteName: "ContractOS",
    type: "website",
    url: "https://contract-os-app.netlify.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ContractOS — AI Contract Intelligence Platform",
    description: "Upload any contract and get a full AI analysis in under 30 seconds.",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "ContractOS",
              applicationCategory: "BusinessApplication",
              description: "AI-powered contract intelligence platform. Upload contracts for instant risk scoring, obligation tracking, and improvement plans.",
              operatingSystem: "Web",
              offers: [
                { "@type": "Offer", price: "0", priceCurrency: "USD", name: "Free Trial" },
                { "@type": "Offer", price: "29", priceCurrency: "USD", name: "Starter", billingIncrement: "P1M" },
                { "@type": "Offer", price: "79", priceCurrency: "USD", name: "Professional", billingIncrement: "P1M" },
              ],
            }),
          }}
        />
      </head>
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
