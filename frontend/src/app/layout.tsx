import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReduxProvider } from "@/body/redux/provider";
import GoogleAuthProviderWrapper from "@/body/auth/providers/GoogleAuthProvider";
import AuthGuard from "@/body/auth/components/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Real Estate - Hayalinizdeki Evi Bulun",
  description: "Türkiye'nin en kapsamlı gayrimenkul platformu. Binlerce satılık ve kiralık ev ilanı arasından size en uygun olanı bulun.",
  keywords: ["gayrimenkul", "ev", "daire", "satılık", "kiralık", "emlak"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReduxProvider>
          <GoogleAuthProviderWrapper>
            <AuthGuard>
              {children}
            </AuthGuard>
          </GoogleAuthProviderWrapper>
        </ReduxProvider>
      </body>
    </html>
  );
}
