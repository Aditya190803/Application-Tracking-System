import { existsSync } from "node:fs";

// Node preserves variables already set by the host. Never print credential values.
for (const file of [".env.local", ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}
const required = [
  "AI_GATEWAY_API_KEY",
  "NEXT_PUBLIC_CONVEX_URL",
  "CONVEX_DEPLOY_KEY",
  "NEXT_PUBLIC_STACK_PROJECT_ID",
  "NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY",
  "STACK_SECRET_SERVER_KEY",
  "NEXT_PUBLIC_APP_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "CRON_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
];
let failures = 0;
for (const key of required) {
  const present = Boolean(process.env[key]?.trim());
  console.log(`${present ? "OK" : "MISSING"} ${key}`);
  if (!present) failures++;
}
for (const key of ["NEXT_PUBLIC_APP_URL", "NEXT_PUBLIC_CONVEX_URL", "UPSTASH_REDIS_REST_URL"]) {
  if (!process.env[key]) continue;
  try {
    const url = new URL(process.env[key]);
    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    )
      throw new Error("invalid");
  } catch {
    console.log(`INVALID ${key}: use a public HTTPS URL without credentials`);
    failures++;
  }
}
if (process.env.ALLOW_IN_MEMORY_RATE_LIMIT === "true") {
  console.log(
    "INVALID ALLOW_IN_MEMORY_RATE_LIMIT: disable the process-local fallback for production",
  );
  failures++;
}
console.log(
  failures
    ? `Production configuration needs ${failures} correction(s).`
    : "Production configuration checks passed. Verify service access and the signed-in workflow before deployment.",
);
process.exitCode = failures ? 1 : 0;
