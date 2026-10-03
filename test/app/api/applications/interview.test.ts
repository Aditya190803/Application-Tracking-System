import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import { GET, PATCH, POST } from "@/app/api/applications/[id]/interview/route";
import { getApplication, saveInterviewPreparation } from "@/lib/application-store";
import { checkRateLimit, getAuthenticatedUser } from "@/lib/auth";
import { generateInterviewQuestions } from "@/lib/gemini";

vi.mock("@/lib/application-store", () => ({
  getApplication: vi.fn(),
  saveInterviewPreparation: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ getAuthenticatedUser: vi.fn(), checkRateLimit: vi.fn() }));
vi.mock("@/lib/gemini", () => ({ generateInterviewQuestions: vi.fn() }));
vi.mock("@/lib/observability", () => ({ logError: vi.fn(), flushObservabilitySafely: vi.fn() }));
const context = { params: Promise.resolve({ id: "app-1" }) };
const questions = ["behavioral", "technical", "role"].map((category, i) => ({
  id: `q${i}`,
  category: category as "role",
  question: "A question?",
  guidance: "Use your own example",
  answer: "Keep this answer",
}));
const interview = { revision: "rev-1", inputHash: "hash", generatedAt: 1, questions };
const payload = {
  resumeText: "My experience",
  jobDescription: "Role requirements",
  expectedRevision: "",
};
function request(body: unknown, method = "POST") {
  return new NextRequest("http://localhost/api/applications/app-1/interview", {
    method,
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getAuthenticatedUser).mockResolvedValue("owner");
  vi.mocked(getApplication).mockResolvedValue({
    _id: "app-1",
    companyName: "Acme",
    jobTitle: "Engineer",
  } as never);
  vi.mocked(checkRateLimit).mockResolvedValue({ allowed: true, remaining: 5, resetIn: 60000 });
  vi.mocked(generateInterviewQuestions).mockResolvedValue({ questions });
  vi.mocked(saveInterviewPreparation).mockImplementation(async (_id, _user, _revision, value) => ({
    status: "saved",
    interview: value,
  }));
});
describe("interview API", () => {
  it("rejects signed-out access", async () => {
    vi.mocked(getAuthenticatedUser).mockResolvedValue(null);
    expect((await POST(request(payload), context)).status).toBe(401);
    expect((await GET(new NextRequest("http://localhost"), context)).status).toBe(401);
    expect(getApplication).not.toHaveBeenCalled();
  });
  it("never generates for an application outside the user's ownership", async () => {
    vi.mocked(getApplication).mockResolvedValue(null);
    expect((await POST(request(payload), context)).status).toBe(404);
    expect(getApplication).toHaveBeenCalledWith("app-1", "owner");
    expect(generateInterviewQuestions).not.toHaveBeenCalled();
  });
  it("validates inputs before spending an AI request", async () => {
    expect((await POST(request({ ...payload, resumeText: "" }), context)).status).toBe(400);
    expect(generateInterviewQuestions).not.toHaveBeenCalled();
  });
  it("rate limits expensive generation", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ allowed: false, remaining: 0, resetIn: 60000 });
    expect((await POST(request(payload), context)).status).toBe(429);
    expect(generateInterviewQuestions).not.toHaveBeenCalled();
  });
  it("persists generated questions with empty answers and reuses them without AI", async () => {
    const response = await POST(request(payload), context);
    const data = await response.json();
    expect(response.status).toBe(200);
    expect(data.interview.questions.every((q: { answer: string }) => q.answer === "")).toBe(true);
    expect(saveInterviewPreparation).toHaveBeenCalledWith(
      "app-1",
      "owner",
      "",
      expect.objectContaining({ revision: expect.any(String) }),
    );
    vi.mocked(getApplication).mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Engineer",
      interview: data.interview,
    } as never);
    const replay = await POST(request(payload), context);
    expect((await replay.json()).cached).toBe(true);
    expect(generateInterviewQuestions).toHaveBeenCalledTimes(1);
  });
  it("requires explicit replacement and prevents a stale generation save", async () => {
    vi.mocked(getApplication).mockResolvedValue({
      companyName: "Acme",
      jobTitle: "Engineer",
      interview,
    } as never);
    expect((await POST(request({ ...payload, expectedRevision: "rev-1" }), context)).status).toBe(
      409,
    );
    vi.mocked(saveInterviewPreparation).mockResolvedValue({ status: "conflict" });
    expect(
      (
        await POST(
          request({ ...payload, expectedRevision: "rev-1", forceRegenerate: true }),
          context,
        )
      ).status,
    ).toBe(409);
  });
  it("saves only answer notes, preserving generated content", async () => {
    vi.mocked(getApplication).mockResolvedValue({ interview } as never);
    const response = await PATCH(
      request(
        {
          expectedRevision: "rev-1",
          answers: questions.map((q) => ({ id: q.id, answer: "My real STAR example" })),
        },
        "PATCH",
      ),
      context,
    );
    expect(response.status).toBe(200);
    const saved = vi.mocked(saveInterviewPreparation).mock.calls[0][3];
    expect(saved.questions[0]).toEqual({ ...questions[0], answer: "My real STAR example" });
    expect(saved.revision).not.toBe("rev-1");
  });
  it("rejects unknown and duplicated question IDs", async () => {
    vi.mocked(getApplication).mockResolvedValue({ interview } as never);
    for (const ids of [
      ["q0", "q1", "other"],
      ["q0", "q0", "q2"],
    ]) {
      expect(
        (
          await PATCH(
            request(
              { expectedRevision: "rev-1", answers: ids.map((id) => ({ id, answer: "Answer" })) },
              "PATCH",
            ),
            context,
          )
        ).status,
      ).toBe(400);
    }
    expect(saveInterviewPreparation).not.toHaveBeenCalled();
  });
  it("coalesces concurrent generation requests", async () => {
    let resolve!: (value: { questions: typeof questions }) => void;
    vi.mocked(generateInterviewQuestions).mockReturnValue(
      new Promise((done) => {
        resolve = done;
      }),
    );
    const first = POST(request(payload), context);
    const second = POST(request(payload), context);
    await vi.waitFor(() => expect(generateInterviewQuestions).toHaveBeenCalledTimes(1));
    resolve({ questions });
    expect((await first).status).toBe(200);
    expect((await second).status).toBe(200);
    expect(saveInterviewPreparation).toHaveBeenCalledTimes(1);
  });
});
