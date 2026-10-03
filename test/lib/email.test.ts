import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { sendEmail } from "@/lib/email";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});
describe("email delivery errors", () => {
  it("keeps provider response details out of errors and bounds delivery time", async () => {
    vi.stubEnv("RESEND_API_KEY", "test-key");
    vi.stubEnv("EMAIL_FROM", "test@example.com");
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("recipient and credential details", { status: 422 }));
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      sendEmail({ to: "recipient@example.com", subject: "Test", html: "Test", text: "Test" }),
    ).rejects.toThrow(/^Resend API error \(422\)$/);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });
});
