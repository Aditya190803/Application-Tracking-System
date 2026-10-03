import { afterEach, describe, expect, it, vi } from "vite-plus/test";

vi.mock("@/lib/convex-server", () => ({
  getClient: () => ({ query: vi.fn().mockResolvedValue({}) }),
}));
vi.mock("@/stack/server", () => ({ stackServerApp: { getUser: vi.fn().mockResolvedValue(null) } }));
import { runDependencyHealthChecks } from "@/lib/health-check";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe("AI health probe", () => {
  it("reports an HTTP rejection as degraded", async () => {
    vi.stubEnv("OPENCODE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Denied", { status: 401 })));
    expect((await runDependencyHealthChecks()).ai.status).toBe("degraded");
  });
  it("reports a successful probe as healthy", async () => {
    vi.stubEnv("OPENCODE_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    expect((await runDependencyHealthChecks()).ai.status).toBe("ok");
  });
});
