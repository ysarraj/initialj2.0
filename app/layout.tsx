import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "InitialJ - Learn Japanese Kanji & Vocabulary",
  description: "Master Japanese kanji and vocabulary for JLPT exams through spaced repetition. Currently in beta - all levels are free.",
  keywords: ["Japanese", "Kanji", "Vocabulary", "JLPT", "Learning", "SRS", "Spaced Repetition"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
