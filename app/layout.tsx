import type { Metadata, Viewport } from "next";
import { Fraunces, Inter } from "next/font/google";
import "./globals.css";
import { RegisterServiceWorker } from "@ui/components/RegisterServiceWorker";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
});
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Nhanga — learn Shona by song",
  description: "One song a week. Sunday quiz. Built to remember.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#f6efe2",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${fraunces.variable} ${inter.variable}`}>
      <body>
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
