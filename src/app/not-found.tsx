import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="workspace-page">
      <div className="mx-auto max-w-xl py-16">
        <p className="eyebrow mb-5">404 / A different path</p>
        <h1 className="editorial-title">Let’s find your way back.</h1>
        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          This page couldn’t be found. Your workspace is a good place to pick up your next step.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/dashboard">Open your workspace</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/">Back to home</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
