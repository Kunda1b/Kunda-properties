import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/components/providers";
import { Toaster } from "react-hot-toast";
import "./globals.css";
const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
export const metadata: Metadata = { title: { default: "Kunda Admin", template: "%s | Kunda Admin" }, robots: { index: false, follow: false } };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <Providers>{children}<Toaster position="top-right" toastOptions={{ style: { background: "#1a5c3e", color: "#fff", borderRadius: "8px" }, error: { style: { background: "#dc2626" } } }} /></Providers>
      </body>
    </html>
  );
}
