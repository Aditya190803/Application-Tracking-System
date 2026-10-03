import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { generateGatewayContent } from "@/lib/ai-gateway";

const fetchMock = vi.fn();
function completion(message: unknown) {
  return new Response(JSON.stringify({ choices: [{ message }] }), { status: 200 });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.stubEnv("AI_GATEWAY_API_KEY", "sk-test-managed-key");
  vi.stubEnv("AI_GATEWAY_BASE_URL", "");
  vi.stubEnv("MODEL_NAME", "");
  vi.stubEnv("AI_TIMEOUT_MS", "");
});
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

describe("AI Gateway transport", () => {
  it("uses the documented chat endpoint, managed key, and default model", async () => {
    fetchMock.mockResolvedValue(completion({ content: "Answer" }));
    expect(await generateGatewayContent("Resume prompt", 0.4)).toBe("Answer");
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://ai-gateway.adityamer.dev/v1/chat/completions");
    expect(init.method).toBe("POST");
    expect(init.headers).toEqual({
      "Content-Type": "application/json",
      Authorization: "Bearer sk-test-managed-key",
    });
    expect(JSON.parse(init.body)).toEqual({
      model: "claude-sonnet-5",
      messages: [{ role: "user", content: "Resume prompt" }],
      temperature: 0.4,
      max_tokens: 16384,
    });
    expect(init.signal).toBeInstanceOf(AbortSignal);
  });

  it("normalizes the base URL and preserves provider-prefixed model names", async () => {
    vi.stubEnv("AI_GATEWAY_BASE_URL", " https://gateway.example/v1/// ");
    vi.stubEnv("MODEL_NAME", "anti/gemini-3-flash");
    fetchMock.mockResolvedValue(completion({ content: "Answer" }));
    await generateGatewayContent("Prompt", 0.8);
    expect(fetchMock.mock.calls[0][0]).toBe("https://gateway.example/v1/chat/completions");
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).model).toBe("anti/gemini-3-flash");
  });

  it("requires a gateway key even if a legacy OpenCode key exists", async () => {
    vi.stubEnv("AI_GATEWAY_API_KEY", "  ");
    vi.stubEnv("OPENCODE_API_KEY", "legacy-only");
    await expect(generateGatewayContent("Prompt", 0.4)).rejects.toThrow("Set AI_GATEWAY_API_KEY");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("reports HTTP failures without exposing an upstream error body", async () => {
    const text = vi.fn().mockResolvedValue("Secret key and candidate resume text");
    fetchMock.mockResolvedValue({ ok: false, status: 401, text });
    await expect(generateGatewayContent("Candidate resume", 0.4)).rejects.toThrow(
      "AI Gateway API error (401). Check the gateway key and model access.",
    );
    expect(text).not.toHaveBeenCalled();
  });

  it("does not return provider reasoning when answer content is missing", async () => {
    fetchMock.mockResolvedValue(completion({ reasoning_content: "Private reasoning" }));
    expect(await generateGatewayContent("Prompt", 0.4)).toBe("");
  });

  it("aborts requests using the configured timeout", async () => {
    vi.stubEnv("AI_TIMEOUT_MS", "12000");
    const signal = new AbortController().signal;
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(signal);
    fetchMock.mockResolvedValue(completion({ content: "Answer" }));
    await generateGatewayContent("Prompt", 0.4);
    expect(timeout).toHaveBeenCalledWith(12000);
    expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
  });

  it.each(["not-a-number", "0", "-1", "1.5", "4294967296"])(
    "uses a bounded default for an invalid timeout (%s)",
    async (value) => {
      vi.stubEnv("AI_TIMEOUT_MS", value);
      const timeout = vi
        .spyOn(AbortSignal, "timeout")
        .mockReturnValue(new AbortController().signal);
      fetchMock.mockResolvedValue(completion({ content: "Answer" }));
      await generateGatewayContent("Prompt", 0.4);
      expect(timeout).toHaveBeenCalledWith(30000);
    },
  );

  it("preserves caller cancellation instead of replacing its signal", async () => {
    const controller = new AbortController();
    controller.abort();
    const error = new DOMException("Aborted", "AbortError");
    fetchMock.mockRejectedValue(error);
    await expect(generateGatewayContent("Prompt", 0.4, controller.signal)).rejects.toBe(error);
    expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
