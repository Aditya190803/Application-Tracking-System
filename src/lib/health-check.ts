import { getAiGatewayConfig } from "@/lib/ai-gateway";
import { getClient } from "@/lib/convex-server";
import { stackServerApp } from "@/stack/server";

interface ServiceHealth {
  status: "ok" | "degraded" | "missing";
  latencyMs?: number;
  details?: string;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: NodeJS.Timeout | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error("timeout")), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}

export async function runDependencyHealthChecks(): Promise<{
  ai: ServiceHealth;
  convex: ServiceHealth;
  auth: ServiceHealth;
}> {
  const aiStart = Date.now();
  const { apiKey, baseUrl } = getAiGatewayConfig();
  let ai: ServiceHealth = { status: apiKey ? "degraded" : "missing" };
  if (apiKey) {
    try {
      const response = await withTimeout(
        fetch(`${baseUrl}/models`, {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(2000),
        }),
        2000,
      );
      if (!response.ok) throw new Error("AI endpoint rejected the probe");
      ai = { status: "ok", latencyMs: Date.now() - aiStart };
    } catch {
      ai = {
        status: "degraded",
        latencyMs: Date.now() - aiStart,
        details: "AI Gateway endpoint probe failed",
      };
    }
  }

  const convexStart = Date.now();
  let convex: ServiceHealth = {
    status: process.env.NEXT_PUBLIC_CONVEX_URL ? "degraded" : "missing",
  };
  if (process.env.NEXT_PUBLIC_CONVEX_URL) {
    try {
      const client = getClient();
      await withTimeout(
        client.query("functions:getUserStats", { userId: "__healthcheck__" }),
        2000,
      );
      convex = { status: "ok", latencyMs: Date.now() - convexStart };
    } catch {
      convex = {
        status: "degraded",
        latencyMs: Date.now() - convexStart,
        details: "Convex query probe failed",
      };
    }
  }

  const authStart = Date.now();
  let auth: ServiceHealth = process.env.STACK_SECRET_SERVER_KEY
    ? { status: "degraded" }
    : { status: "missing" };
  if (process.env.STACK_SECRET_SERVER_KEY) {
    try {
      await withTimeout(stackServerApp.getUser(), 2000);
      auth = { status: "ok", latencyMs: Date.now() - authStart };
    } catch {
      auth = {
        status: "degraded",
        latencyMs: Date.now() - authStart,
        details: "Auth provider probe failed",
      };
    }
  }

  return { ai, convex, auth };
}
