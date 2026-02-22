import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
    tokenStore: "nextjs-cookie",
    projectId: process.env.NEXT_PUBLIC_STACK_PROJECT_ID || "default-id",
    publishableClientKey: process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY || "default-key",
    secretServerKey: process.env.STACK_SECRET_SERVER_KEY || "default-secret",
});
