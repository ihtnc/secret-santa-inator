import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "./components/Footer";
import { Analytics } from "@vercel/analytics/next"
import { DarkModeProvider } from "./components/DarkModeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Secret Santa-inator",
  description: "A fun and interactive Secret Santa organizer for groups and families",
  keywords: ["Secret Santa", "gift exchange", "Christmas", "holiday", "organizer"],
  authors: [{ name: "Secret Santa-inator" }],
  icons: {
    icon: [
      { url: "/icon-16.svg", sizes: "16x16", type: "image/svg+xml" },
      { url: "/icon.svg", sizes: "32x32", type: "image/svg+xml" },
    ],
    apple: { url: "/apple-icon.svg", sizes: "180x180", type: "image/svg+xml" },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#DC2626",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                if (localStorage.getItem('darkMode') === 'true' || (!localStorage.getItem('darkMode') && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark')
                } else {
                  document.documentElement.classList.remove('dark')
                }
              } catch (_) {}
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-full flex flex-col bg-surface text-primary`}
      >
        <DarkModeProvider>
          <main className="flex-1 min-w-md">
            {children}
          </main>
          <Footer />
          <Analytics/>
        </DarkModeProvider>
      </body>
    </html>
  );
}
