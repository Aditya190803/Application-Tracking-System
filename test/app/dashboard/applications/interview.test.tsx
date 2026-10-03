import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import InterviewPage from "@/app/dashboard/applications/[id]/interview/page";

vi.mock("@stackframe/stack", () => ({ useUser: () => ({ id: "owner" }) }));
vi.mock("next/navigation", () => ({ useParams: () => ({ id: "app-1" }) }));
vi.mock("@/components/resume/ResumeSelect", () => ({
  ResumeSelect: ({ onSelect }: { onSelect: (text: string) => void }) => (
    <button onClick={() => onSelect("My saved resume")}>Use saved resume</button>
  ),
}));
const questions = ["behavioral", "technical", "role"].map((category, i) => ({
  id: `q${i}`,
  category,
  question: `Question ${i}?`,
  guidance: "Use a real example",
  answer: "",
}));
const interview = { revision: "rev-1", inputHash: "hash", generatedAt: 1, questions };
const application = { _id: "app-1", jobTitle: "Engineer", companyName: "Acme", interview };
const fetchMock = vi.fn();
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}
beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue(json({ application }));
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("interview preparation interactions", () => {
  it("restores saved questions and explicitly saves edited answers", async () => {
    render(<InterviewPage />);
    await screen.findByText("1. Question 0?");
    fireEvent.change(screen.getAllByLabelText("Your answer notes")[0], {
      target: { value: "Situation: my project" },
    });
    expect(screen.getByText(/Unsaved changes/)).toBeInTheDocument();
    fetchMock.mockResolvedValueOnce(
      json({
        interview: {
          ...interview,
          revision: "rev-2",
          questions: questions.map((q, i) => ({
            ...q,
            answer: i === 0 ? "Situation: my project" : "",
          })),
        },
      }),
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Save answer notes" })[0]);
    await screen.findByText("Answer notes saved.");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toEqual({
      expectedRevision: "rev-1",
      answers: questions.map((q, i) => ({
        id: q.id,
        answer: i === 0 ? "Situation: my project" : "",
      })),
    });
  });
  it("requires confirmation before regenerating and clears answers only on success", async () => {
    render(<InterviewPage />);
    await screen.findByText("1. Question 0?");
    fireEvent.click(screen.getByText("Use saved resume"));
    fireEvent.change(screen.getByLabelText("Job description"), {
      target: { value: "Role requirements" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Regenerate questions" }));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    fetchMock.mockResolvedValueOnce(json({ interview: { ...interview, revision: "new" } }));
    fireEvent.click(screen.getByRole("button", { name: "Replace preparation" }));
    await screen.findByText("Interview preparation generated and saved.");
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).forceRegenerate).toBe(true);
  });
  it("retains unsaved answers when saving fails", async () => {
    render(<InterviewPage />);
    await screen.findByText("1. Question 0?");
    fireEvent.change(screen.getAllByLabelText("Your answer notes")[0], {
      target: { value: "Keep my work" },
    });
    fetchMock.mockResolvedValueOnce(json({ message: "Changed in another session" }, 409));
    fireEvent.click(screen.getAllByRole("button", { name: "Save answer notes" })[0]);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Changed in another session"),
    );
    expect(screen.getAllByLabelText("Your answer notes")[0]).toHaveValue("Keep my work");
  });
});
