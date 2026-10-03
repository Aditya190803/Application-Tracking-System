"use client";

import { UserButton, useUser } from "@stackframe/stack";
import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Overview", href: "/dashboard" },
  { name: "Applications", href: "/dashboard/applications" },
  { name: "Resume library", href: "/dashboard/upload" },
  { name: "Match analysis", href: "/dashboard/analysis" },
  { name: "Cover letters", href: "/dashboard/cover-letter" },
  { name: "Resume builder", href: "/dashboard/resume-builder" },
  { name: "Job alerts", href: "/dashboard/watchlist" },
  { name: "History", href: "/dashboard/history" },
];

export function Brand() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="grid size-9 place-items-center rounded-lg bg-primary font-serif text-2xl font-bold leading-none text-primary-foreground"
      >
        a.
      </span>
      <span className="text-xl font-semibold tracking-tight">ats</span>
    </span>
  );
}

export function TopNav() {
  const user = useUser();
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const mobileMenuOpen = openPath === pathname;
  const isWorkspace = pathname.startsWith("/dashboard");
  const links = isWorkspace
    ? navigation
    : [
        { name: "How it works", href: "/how-it-works" },
        { name: "Contact", href: "/contact" },
      ];

  return (
    <header className="border-b border-border bg-background">
      <div className="mx-auto flex min-h-20 max-w-[1392px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-11">
        <Link
          href={user ? "/dashboard" : "/"}
          aria-label="ATS home"
          className="flex shrink-0 items-center gap-3"
        >
          <Brand />
          <span className="hidden border-l border-border pl-3 text-sm text-muted-foreground sm:block">
            {isWorkspace ? "Your workspace" : "Your next chapter"}
          </span>
        </Link>
        {!isWorkspace && (
          <nav aria-label="Main navigation" className="hidden items-center gap-7 md:flex">
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={pathname === item.href ? "page" : undefined}
                className="text-sm text-muted-foreground transition-colors hover:text-primary aria-[current=page]:text-primary"
              >
                {item.name}
              </Link>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-2 sm:gap-4">
          {user ? (
            <>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {user.displayName || "Personal account"}
              </span>
              <UserButton />
            </>
          ) : (
            <>
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/handler/login">Sign in</Link>
              </Button>
              <Button asChild>
                <Link href="/handler/signup">
                  Get started <span aria-hidden="true">↗</span>
                </Link>
              </Button>
            </>
          )}
          <Button
            variant="ghost"
            size="icon"
            className={isWorkspace ? "lg:hidden" : "md:hidden"}
            aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setOpenPath(mobileMenuOpen ? null : pathname)}
          >
            {mobileMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
      {isWorkspace && (
        <nav
          aria-label="Workspace navigation"
          className="mx-auto hidden max-w-[1392px] items-center gap-7 px-11 lg:flex"
        >
          {links.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className="workspace-nav-link"
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      )}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label={isWorkspace ? "Workspace navigation" : "Main navigation"}
          className={
            isWorkspace
              ? "grid gap-1 border-t border-border p-4 lg:hidden"
              : "grid gap-1 border-t border-border p-4 md:hidden"
          }
        >
          {links.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href + "/"));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpenPath(null)}
                aria-current={active ? "page" : undefined}
                className="rounded-lg px-4 py-3 text-sm text-muted-foreground hover:bg-muted aria-[current=page]:bg-secondary aria-[current=page]:text-primary"
              >
                {item.name}
              </Link>
            );
          })}
          {!user && (
            <Link href="/handler/login" className="px-4 py-3 text-sm">
              Sign in
            </Link>
          )}
        </nav>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex max-w-[1392px] flex-col justify-between gap-5 px-5 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:px-8 lg:px-11">
        <p>Small steps. Meaningful progress.</p>
        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6">
          <Link href="/how-it-works" className="hover:text-primary">
            Guide
          </Link>
          <Link href="/contact" className="hover:text-primary">
            Contact
          </Link>
          <Link href="/privacy" className="hover:text-primary">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-primary">
            Terms
          </Link>
        </nav>
        <p>© {new Date().getFullYear()} ATS</p>
      </div>
    </footer>
  );
}
