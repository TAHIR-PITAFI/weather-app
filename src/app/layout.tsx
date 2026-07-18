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
    <html lang="en" className="h-full antialiased font-sans" suppressHydrationWarning>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>{children}</body>
    </html>
  );
}
