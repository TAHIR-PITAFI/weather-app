import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroWeather",
  description: "Real-time weather, forecasts, and historical tracking.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased font-sans bg-[#080810] text-white" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" style={{ background: '#080810' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
