import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "CriptoBoard — Live crypto market",
  description: "Real-time crypto market dashboard: prices, market caps and price history.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <div className="backdrop" aria-hidden />
        <header className="sticky top-0 z-30 border-b border-line bg-bg/70 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <Link href="/" className="group flex items-center gap-2.5">
              <span className="grid size-8 place-items-center rounded-lg bg-gradient-to-br from-accent to-accent-2 shadow-[0_0_24px_-4px_var(--accent)] transition-transform group-hover:rotate-6">
                <svg viewBox="0 0 24 24" className="size-4.5 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 17l6-6 4 4 8-8" />
                  <path d="M14 7h7v7" />
                </svg>
              </span>
              <span className="text-lg font-semibold tracking-tight">
                Cripto<span className="gradient-text">Board</span>
              </span>
            </Link>
            <span className="hidden text-xs text-muted sm:block">
              Data: CoinGecko · Live: Binance
            </span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">{children}</main>
        <footer className="border-t border-line py-6 text-center text-xs text-faint">
          Prices in USD. Not financial advice.
        </footer>
      </body>
    </html>
  );
}
