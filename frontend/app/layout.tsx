import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GreenLedger | P2P Renewable Energy Trading & REC Settlement",
  description: "Decentralized, demand-aware peer-to-peer renewable energy trading platform on Ethereum Sepolia",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#090d0b] text-[#f1f5f3] antialiased">
        {children}
      </body>
    </html>
  );
}
