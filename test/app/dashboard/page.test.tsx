import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

import DashboardPage from "@/app/dashboard/page";
import { localDateString } from "@/lib/application-tracker";
import { EMPTY_APPLICATION } from "@/types/applications";

vi.mock("@stackframe/stack", () => ({ useUser: () => ({ id: "user-1", displayName: "Adi" }) }));

const mockFetch = vi.fn();
const stats = { resumeCount: 2, analysisCount: 4, coverLetterCount: 1, averageMatchScore: 82 };
const application = {
  ...EMPTY_APPLICATION,
  _id: "app-1",
  _creationTime: 1,
  updatedAt: 1,
  companyName: "Linear",
  jobTitle: "Product engineer",
  status: "interviewing",
  followUpDate: localDateString(),
};
function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status });
}

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("dashboard workspace", () => {
  it("uses saved applications for interview and follow-up links", async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(json(url === "/api/user-stats" ? stats : { applications: [application] })),
    );
    render(<DashboardPage />);
    expect(await screen.findByRole("heading", { name: "Product engineer" })).toBeInTheDocument();
    expect(screen.getByText("82%")).toBeInTheDocument();
    expect(screen.getByText("Follow up with Linear").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/applications?filter=due",
    );
    expect(screen.getByRole("link", { name: /Start practicing/ })).toHaveAttribute(
      "href",
      "/dashboard/applications/app-1/interview",
    );
    expect(screen.getByText("1 active opportunities · 1 in interviews")).toBeInTheDocument();
  });

  it("keeps applications visible when counts fail and retries the workspace", async () => {
    let failStats = true;
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(
        url === "/api/user-stats"
          ? json(failStats ? {} : stats, failStats ? 503 : 200)
          : json({ applications: [application] }),
      ),
    );
    render(<DashboardPage />);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Document counts couldn’t be loaded.",
    );
    expect(screen.getByRole("heading", { name: "Product engineer" })).toBeInTheDocument();
    expect(screen.queryByText("82%")).not.toBeInTheDocument();
    failStats = false;
    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("82%")).toBeInTheDocument();
    await waitFor(() => expect(screen.queryByRole("alert")).not.toBeInTheDocument());
  });

  it("offers a first step for an empty workspace without inventing a match score", async () => {
    mockFetch.mockImplementation((url: string) =>
      Promise.resolve(
        json(
          url === "/api/user-stats" ? { ...stats, averageMatchScore: null } : { applications: [] },
        ),
      ),
    );
    render(<DashboardPage />);
    expect(await screen.findByText("Every chapter starts somewhere.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Build your resume/ })).toHaveAttribute(
      "href",
      "/dashboard/resume-builder",
    );
    expect(screen.queryByText("0%")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Start practicing/ })).not.toBeInTheDocument();
  });
});
