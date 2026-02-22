import "./globals.css";

import type { Metadata } from "next";
import { Fira_Code,Oxanium } from "next/font/google";

import { Sidebar, TopNav } from "@/components/layout";

const fontSans = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
});

const fontMono = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ATS - Application Tracking System",
  description: "Optimize your resume with AI-powered analysis, keyword extraction, ATS compatibility scoring, and cover letter generation.",
};

import { StackProvider, StackTheme } from "@stackframe/stack";
import { Suspense } from "react";

import { BackgroundAnimation } from "@/components/common/BackgroundAnimation";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ToastProvider } from "@/components/ui/toast";
import { stackServerApp } from "@/stack/server";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <ConvexClientProvider>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <ToastProvider>
                <div className="min-h-screen relative">
                  <BackgroundAnimation />
                  <Suspense fallback={null}>
                    <div className="flex flex-col">
                      <TopNav />
                      <div className="flex">
                        <Sidebar />
                        <main className="flex-1">
                          {children}
                        </main>
                      </div>
                    </div>
                  </Suspense>
                </div>
              </ToastProvider>
            </StackTheme>
          </StackProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
