import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs'
import OptionalSessionReplay from '@/components/analytics/OptionalSessionReplay'
import SiteFooter from '@/components/SiteFooter'
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Northline Signal | Systematic Market Exposure",
  description: "A daily, rule-based market exposure system built to remove emotion and guesswork.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ClerkProvider>
          <OptionalSessionReplay />
          {children}
          <SiteFooter />
        </ClerkProvider>
      </body>
    </html>
  );
}
