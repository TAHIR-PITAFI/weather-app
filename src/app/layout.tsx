import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AeroWeather",
  description: "Real-time weather, forecasts, and historical tracking.",
};

export const viewport: Viewport = {
  themeColor: "#080810",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-[#080810] text-white" suppressHydrationWarning>
      <body style={{ background: '#080810' }} suppressHydrationWarning>{children}</body>
    </html>
  );
}
