import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TrackProvider } from "@/context/TrackContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "F1 — SOUND OF SPEED",
  description: "An interactive Formula 1 cinematic experience driven by music.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-neutral-950 text-white overflow-hidden`}>
        <TrackProvider>
          {children}
        </TrackProvider>
      </body>
    </html>
  );
}
