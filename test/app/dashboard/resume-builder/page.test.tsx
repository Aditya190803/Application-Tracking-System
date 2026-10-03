import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import ResumeBuilderPage from "@/app/dashboard/resume-builder/page";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@stackframe/stack", () => ({ useUser: () => ({ id: "user-1" }) }));
vi.mock("@/hooks/useResumes", () => ({ useResumes: () => ({ resumes: [], isLoading: false }) }));
vi.mock("@/components/resume/ResumeSelect", () => ({
  ResumeSelect: () => <div>Saved resumes</div>,
}));

describe("resume maker content flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.sessionStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ history: [] }))),
    );
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("saves career notes and continues without a target job", async () => {
    render(<ResumeBuilderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Write Your Content" }));
    fireEvent.change(screen.getByLabelText("Your career details"), {
      target: { value: "Jordan Rivera. Developer, 2022–2025. TypeScript, React." },
    });
    fireEvent.click(screen.getByRole("button", { name: "Continue to Step 2" }));
    await waitFor(() => expect(push).toHaveBeenCalledWith("/dashboard/resume-builder/step-2"));
    const draft = JSON.parse(window.sessionStorage.getItem("resumeBuilderFlowDraftV1")!);
    expect(draft.source).toMatchObject({
      kind: "manual",
      inputMode: "content",
      resumeName: "My Resume",
      jobDescription: "",
    });
    expect(draft.source.resumeText).toContain("Jordan Rivera");
  });

  it("restores notes after navigating back", async () => {
    window.sessionStorage.setItem(
      "resumeBuilderFlowDraftV1",
      JSON.stringify({
        source: {
          kind: "manual",
          inputMode: "content",
          resumeText: "My career notes",
          resumeName: "Draft resume",
          jobDescription: "Target role",
        },
      }),
    );
    render(<ResumeBuilderPage />);
    expect(await screen.findByLabelText("Your career details")).toHaveValue("My career notes");
    expect(screen.getByLabelText("Job description (optional)")).toHaveValue("Target role");
  });

  it("rejects empty career notes", async () => {
    render(<ResumeBuilderPage />);
    fireEvent.click(screen.getByRole("button", { name: "Write Your Content" }));
    fireEvent.click(screen.getByRole("button", { name: "Continue to Step 2" }));
    expect(await screen.findByText("Add your career details first")).toBeInTheDocument();
    expect(push).not.toHaveBeenCalled();
  });
});
