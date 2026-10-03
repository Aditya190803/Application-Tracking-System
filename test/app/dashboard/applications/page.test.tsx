import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import ApplicationsPage from "@/app/dashboard/applications/page";
import { localDateString } from "@/lib/application-tracker";
import { EMPTY_APPLICATION, type TrackedApplication } from "@/types/applications";

const { addToast } = vi.hoisted(() => ({ addToast: vi.fn() }));
vi.mock("@stackframe/stack", () => ({ useUser: () => ({ id: "user-1" }) }));
vi.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams() }));
vi.mock("@/components/ui/toast", () => ({ useToast: () => ({ addToast }) }));

const application: TrackedApplication = {
  ...EMPTY_APPLICATION,
  _id: "app-1",
  _creationTime: 1,
  updatedAt: 1,
  companyName: "Acme",
  jobTitle: "Engineer",
  status: "applied",
  notes: "Ask about the team",
  followUpDate: localDateString(),
};

const mockFetch = vi.fn();
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

describe("application tracker interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockResolvedValue(json({ applications: [application] }));
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("edits a saved application without submitting storage metadata", async () => {
    const user = userEvent.setup();
    render(<ApplicationsPage />);
    await screen.findByText("Engineer");
    await user.click(screen.getByRole("button", { name: "Edit Engineer at Acme" }));
    const notes = screen.getByLabelText("Notes");
    await user.clear(notes);
    await user.type(notes, "Interview on Monday");
    mockFetch.mockResolvedValueOnce(
      json({ application: { ...application, notes: "Interview on Monday" } }),
    );
    await user.click(screen.getByRole("button", { name: "Save application" }));
    await screen.findByText("Interview on Monday");
    const [, options] = mockFetch.mock.calls[1];
    const submitted = JSON.parse(options.body);
    expect(options.method).toBe("PATCH");
    expect(submitted.notes).toBe("Interview on Monday");
    expect(submitted).not.toHaveProperty("_id");
    expect(submitted).not.toHaveProperty("updatedAt");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("marks a follow-up done and removes it from the due queue", async () => {
    const user = userEvent.setup();
    render(<ApplicationsPage />);
    await screen.findByText("Engineer");
    await user.click(screen.getByRole("button", { name: "Follow-ups due (1)" }));
    mockFetch.mockResolvedValueOnce(json({ application: { ...application, followUpDate: "" } }));
    await user.click(screen.getByRole("button", { name: "Done" }));
    await screen.findByText("No follow-ups due for these filters");
    expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toEqual({ followUpDate: "" });
  });

  it("requires a confirmation before deleting an application", async () => {
    const user = userEvent.setup();
    render(<ApplicationsPage />);
    await screen.findByText("Engineer");
    await user.click(screen.getByRole("button", { name: "Remove Engineer at Acme" }));
    expect(mockFetch).toHaveBeenCalledTimes(1);
    mockFetch.mockResolvedValueOnce(json({ success: true }));
    await user.click(screen.getByRole("button", { name: "Remove", exact: true }));
    await screen.findByText("Start with one opportunity");
    expect(mockFetch.mock.calls[1][1].method).toBe("DELETE");
  });

  it("keeps the selected stage and application unchanged when saving fails", async () => {
    render(<ApplicationsPage />);
    await screen.findByText("Engineer");
    mockFetch.mockResolvedValueOnce(json({ message: "Could not save stage" }, 500));
    fireEvent.change(screen.getByRole("combobox", { name: "Stage for Engineer at Acme" }), {
      target: { value: "offer" },
    });
    await waitFor(() => expect(addToast).toHaveBeenCalledWith("Could not save stage", "error"));
    expect(screen.getByRole("combobox", { name: "Stage for Engineer at Acme" })).toHaveValue(
      "applied",
    );
  });

  it("shows a recoverable load error without presenting it as an empty tracker", async () => {
    mockFetch.mockResolvedValueOnce(json({ message: "Storage unavailable" }, 500));
    const user = userEvent.setup();
    render(<ApplicationsPage />);
    await screen.findByRole("alert");
    expect(screen.queryByText("Start with one opportunity")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    await screen.findByText("Engineer");
  });
});
