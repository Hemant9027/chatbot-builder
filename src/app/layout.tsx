import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "InfyCrest GuestAI — Your AI Guest Assistant. Every Hour of Every Day.",
    template: "%s · InfyCrest GuestAI",
  },
  description:
    "Help guests find answers, capture booking inquiries, and reduce repetitive questions with an AI assistant personalized for your property.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-white text-ink-900 antialiased">{children}</body>
    </html>
  );
}
