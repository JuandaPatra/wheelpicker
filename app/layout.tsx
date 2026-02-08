import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Wheel Picker - Random Selection Spinner",
  description: "A fun and interactive spinning wheel for random selections. Add your items, customize colors, and let the wheel decide!",
  keywords: ["wheel picker", "random picker", "spinner", "decision maker", "random selection"],
  authors: [{ name: "Wheel Picker" }],
  openGraph: {
    title: "Wheel Picker - Random Selection Spinner",
    description: "A fun and interactive spinning wheel for random selections.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        {children}
      </body>
    </html>
  );
}
