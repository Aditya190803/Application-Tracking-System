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
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("Denied", { status: 401 })));
    expect((await runDependencyHealthChecks()).ai.status).toBe("degraded");
  });
  it("reports a successful probe as healthy", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "test-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
    expect((await runDependencyHealthChecks()).ai.status).toBe("ok");
  });
  it("uses the gateway models endpoint and the same managed key", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "sk-managed-test");
    vi.stubEnv("AI_GATEWAY_BASE_URL", "https://gateway.example/v1/");
    const fetchMock = vi.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    expect((await runDependencyHealthChecks()).ai.status).toBe("ok");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://gateway.example/v1/models",
      expect.objectContaining({
        headers: { Authorization: "Bearer sk-managed-test" },
        signal: expect.any(AbortSignal),
      }),
    );
  });
  it("reports a missing key without making a probe", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await runDependencyHealthChecks()).ai.status).toBe("missing");
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
