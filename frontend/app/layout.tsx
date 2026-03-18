import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "PolitiScale — République Française",
  description:
    "Analyse comparative de faisabilité des programmes politiques français",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="antialiased bg-white text-[#161616]">
        {/* Bande tricolore */}
        <div className="flex h-1" aria-hidden="true">
          <div className="flex-1 bg-[#000091]" />
          <div className="flex-1 bg-white border-y border-[#e5e5e5]" />
          <div className="flex-1 bg-[#E1000F]" />
        </div>

        <header className="sticky top-0 z-50 border-b border-[#e5e5e5] bg-white">
          <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6">
            {/* Bloc marque */}
            <Link href="/" className="flex items-center gap-5">
              <div className="flex flex-col border-r-2 border-[#000091] pr-5 leading-tight">
                <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#161616]">
                  République
                </span>
                <span className="text-[11px] font-extrabold uppercase tracking-[0.04em] text-[#161616]">
                  Française
                </span>
                <span className="mt-0.5 text-[9px] italic text-[#666666]">
                  Liberté · Égalité · Fraternité
                </span>
              </div>
              <div>
                <span className="text-lg font-bold uppercase tracking-[0.12em] text-[#000091]">
                  PolitiScale
                </span>
                <p className="text-[11px] text-[#666666]">
                  Analyse de faisabilité des programmes
                </p>
              </div>
            </Link>

            {/* Navigation */}
            <nav className="flex items-center gap-1">
              <Link
                href="/"
                className="px-4 py-2 text-sm font-medium text-[#161616] transition-colors hover:bg-[#f6f6f6] hover:text-[#000091]"
              >
                Partis
              </Link>
              <Link
                href="/compare"
                className="px-4 py-2 text-sm font-medium text-[#161616] transition-colors hover:bg-[#f6f6f6] hover:text-[#000091]"
              >
                Comparer
              </Link>
              <Link
                href="/methodologie"
                className="px-4 py-2 text-sm font-medium text-[#161616] transition-colors hover:bg-[#f6f6f6] hover:text-[#000091]"
              >
                Méthodologie
              </Link>
            </nav>
          </div>
        </header>

        {children}
      </body>
    </html>
  );
}
