import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Kunda Properties — Gambia Real Estate for Diaspora", template: "%s | Kunda Properties" },
  description: "The trusted platform for Gambians in the diaspora to find, buy, and secure property back home.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${playfair.variable} font-sans antialiased`}>
        <Providers>
          {children}
          <Toaster position="top-right" toastOptions={{ duration: 4000, style: { background: "#1a5c3e", color: "#fff", borderRadius: "8px" }, error: { style: { background: "#c41a1a" } } }} />
        </Providers>
      </body>
    </html>
  );
}
