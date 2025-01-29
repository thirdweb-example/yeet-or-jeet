import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { CustomizedConnectButton } from "../components/blocks/CustomConnectButton";
import { ThemeToggleButton } from "../components/blocks/toggle-theme";
import Link from "next/link";
import { Providers } from "../components/providers/Providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Yeet or Jeet",
  description: "Instant Trading Decisions",
};

// 3 minutes
export const maxDuration = 3 * 60;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-dvh flex flex-col bg-background text-foreground`}
      >
        <Providers>
          <header className="border-b border-border">
            <div className="container max-w-6xl mx-auto flex justify-between items-center py-3 px-4">
              <Link
                className="text-3xl font-extrabold tracking-tight flex items-center gap-1.5"
                href="/"
              >
                YoJ
              </Link>

              <div className="flex items-center gap-3">
                <CustomizedConnectButton />
                <ThemeToggleButton />
              </div>
            </div>
          </header>

          <div className="grow flex flex-col">{children}</div>

          <footer className="border-t border-border py-4">
            <div className="container max-w-6xl mx-auto text-center text-muted-foreground px-5">
              <Link
                className="text-sm hover:text-foreground"
                href="https://thirdweb.com/"
                target="_blank"
              >
                Powered by thirdweb
              </Link>
            </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
