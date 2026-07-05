import type { Metadata } from "next";
import { Geist, Geist_Mono, Source_Serif_4 } from "next/font/google";
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

// Serif italic reserved for interpretive sentences (.text-interpretive).
const interpretive = Source_Serif_4({
  variable: "--font-interpretive",
  subsets: ["latin"],
  style: ["italic"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Longbrunch | Signal Before The Open",
  description: "AI-driven weekly SPY signals built for one clear decision before the open.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${interpretive.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t)}catch(e){document.documentElement.setAttribute('data-theme','dark')}})()`,
          }}
        />
      </head>
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
