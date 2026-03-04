import type { Metadata } from "next";
import { Fira_Mono } from "next/font/google";
import "./globals.css";

const firaMono = Fira_Mono({
  weight: ["400", "500", "700"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Device Telemetry Monitor",
  description: "OBD-II telemetry dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`min-h-screen text-gray-200 ${firaMono.className}`}>
        {children}
      </body>
    </html>
  );
}
