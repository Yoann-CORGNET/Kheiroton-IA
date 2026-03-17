import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
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
  title: "PolitiScale",
  description:
    "Analyse comparative de faisabilite des programmes politiques francais",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-zinc-950 text-zinc-100`}
      >
        <header className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="font-mono text-lg font-bold tracking-widest text-white">
              POLITISCALE
            </Link>
            <nav className="flex items-center gap-6 text-sm text-zinc-400">
              <Link href="/" className="transition-colors hover:text-white">
                Partis
              </Link>
              <Link href="/compare" className="transition-colors hover:text-white">
                Comparer
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
