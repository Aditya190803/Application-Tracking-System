"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";
import { ReactNode, useMemo } from "react";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL;

export function ConvexClientProvider({ children }: { children: ReactNode }) {
    const client = useMemo(() => {
        if (!CONVEX_URL) return null;
        return new ConvexReactClient(CONVEX_URL);
    }, []);

    if (!client) {
        // If no Convex URL is configured, render children without Convex
        return <>{children}</>;
    }

    return <ConvexProvider client={client}>{children}</ConvexProvider>;
}
