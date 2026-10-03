import "./globals.css";

import type { Metadata } from "next";

import { SiteFooter, TopNav } from "@/components/layout";

export const metadata: Metadata = {
  title: "ATS - Application Tracking System",
  description:
    "Monitor career sites, build AI resumes in seven LaTeX formats, analyze job matches, write cover letters, track applications, and prepare for interviews.",
};

import { StackProvider, StackTheme } from "@stackframe/stack";
import { Suspense } from "react";

import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { ToastProvider } from "@/components/ui/toast";
import { stackServerApp } from "@/stack/server";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ConvexClientProvider>
          <StackProvider app={stackServerApp}>
            <StackTheme>
              <ToastProvider>
                <div className="relative min-h-dvh">
                  <a href="#main-content" className="skip-link">
                    Skip to content
                  </a>
                  <Suspense fallback={null}>
                    <div className="flex flex-col">
                      <TopNav />
                      <main id="main-content" tabIndex={-1} className="min-w-0 flex-1">
                        {children}
                      </main>
                      <SiteFooter />
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
