import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

import {
  analyzeResume,
  generateInterviewQuestions,
  generateTailoredResumeData,
} from "@/lib/gemini";

/**
 * The module calls AI Gateway's OpenAI-compatible `POST /chat/completions`
 * with plain `fetch`, so we stub `fetch` rather than a provider SDK.
 */
function mockCompletion(content: string) {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      choices: [{ message: { role: "assistant", content } }],
    }),
    text: async () => "",
  } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal("fetch", fetchMock);
});

function lastRequestBody() {
  const [, init] = fetchMock.mock.calls[0];
  return JSON.parse((init as RequestInit).body as string);
}

describe("gemini", () => {
  it("validates interview output and retries a malformed response", async () => {
    const questions = ["behavioral", "technical", "role"].map((category) => ({
      category,
      question: "Tell me about a project",
      guidance: "Use a real example",
    }));
    fetchMock
      .mockResolvedValueOnce(mockCompletion("not json"))
      .mockResolvedValueOnce(mockCompletion(JSON.stringify({ questions })));
    expect(await generateInterviewQuestions("Resume", "Job", "Engineer")).toEqual({ questions });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal);
  });

  it("rejects unusable interview output after a bounded retry", async () => {
    fetchMock.mockResolvedValue(mockCompletion('{"questions":[]}'));
    await expect(generateInterviewQuestions("Resume", "Job", "Engineer")).rejects.toThrow();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it("should call AI Gateway with correct parameters for overview", async () => {
    fetchMock.mockResolvedValue(mockCompletion("Analysis result"));

    const result = await analyzeResume("resume test", "job test", "overview");

    expect(result).toBe("Analysis result");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/chat/completions");
    expect((init as RequestInit).method).toBe("POST");
    expect(lastRequestBody().model).toBe(process.env.MODEL_NAME || "claude-sonnet-5");
  });

  it("sends an output budget large enough to survive reasoning tokens", async () => {
    // Reasoning models may charge reasoning tokens against max_tokens; small budgets
    // are consumed entirely by reasoning and return empty content.
    fetchMock.mockResolvedValue(mockCompletion("Analysis result"));

    await analyzeResume("resume", "job", "overview");

    expect(lastRequestBody().max_tokens).toBeGreaterThanOrEqual(2048);
  });

  it("reads only `content` and ignores `reasoning_content`", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        choices: [
          {
            message: {
              role: "assistant",
              content: "Real answer",
              reasoning_content: "internal scratch work that must not leak",
            },
          },
        ],
      }),
      text: async () => "",
    } as unknown as Response);

    const result = await analyzeResume("resume", "job", "overview");

    expect(result).toBe("Real answer");
    expect(result).not.toContain("scratch work");
  });

  it("should throw error if the model returns an empty response", async () => {
    fetchMock.mockResolvedValue(mockCompletion(""));

    await expect(analyzeResume("resume", "job", "overview")).rejects.toThrow(
      "AI returned an empty response",
    );
  });

  it("should throw a descriptive error on a non-OK response", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
      text: async () => "unauthorized",
    } as unknown as Response);

    await expect(analyzeResume("resume", "job", "overview")).rejects.toThrow(/401/);
  });

  it("should handle coverLetter specific options", async () => {
    fetchMock.mockResolvedValue(mockCompletion("Cover letter content"));

    const result = await analyzeResume("resume", "job", "coverLetter", {
      tone: "friendly",
      length: "concise",
    });

    expect(result).toBe("Cover letter content");
    expect(lastRequestBody().temperature).toBe(0.8);
  });

  it("should use correct prompt for professional tone and standard length", async () => {
    fetchMock.mockResolvedValue(mockCompletion("Professional content"));

    await analyzeResume("R", "J", "coverLetter", {
      tone: "professional",
      length: "standard",
    });

    const prompt = lastRequestBody().messages[0].content;
    expect(prompt).toContain("professional tone");
    expect(prompt).toContain("300 words");
    expect(prompt).toContain("4 paragraphs");
  });

  it("should parse structured JSON for tailored resume generation", async () => {
    fetchMock.mockResolvedValue(
      mockCompletion(
        JSON.stringify({
          summary: "summary",
          skills: ["TypeScript"],
          experience: [],
          projects: [],
          education: [],
          certifications: [],
          additional: [],
          keywordsUsed: ["typescript"],
        }),
      ),
    );

    const result = await generateTailoredResumeData("resume", "job");
    expect(result.summary).toBe("summary");
    expect(result.skills).toEqual(["TypeScript"]);
  });

  it("instructs general resume generation to use supplied facts without inventing a target job", async () => {
    fetchMock.mockResolvedValue(
      mockCompletion(
        JSON.stringify({
          summary: "Career summary",
          skills: [],
          experience: [],
          projects: [],
          education: [],
          certifications: [],
          additional: [],
          keywordsUsed: [],
        }),
      ),
    );
    await generateTailoredResumeData("Candidate's career details", "");
    const prompt = lastRequestBody().messages[0].content;
    expect(prompt).toContain("There is no target job description");
    expect(prompt).toContain("Do not invent employers");
    expect(prompt).toContain("Candidate's career details");
  });
});
