import { describe, expect, it } from "vite-plus/test";

import { type AlertJob, renderJobAlertEmail } from "@/lib/job-alert-email";

const jobs: AlertJob[] = [
  {
    id: "listing-1",
    title: "Senior Engineer",
    companyName: "Acme",
    url: "https://boards.greenhouse.io/acme/jobs/1",
    location: "Remote",
  },
];

describe("renderJobAlertEmail", () => {
  it("names the company when every role is from one place", () => {
    expect(renderJobAlertEmail(jobs, "https://ats.example.com").subject).toBe("1 new role at Acme");
  });

  it("counts companies when roles span several", () => {
    const subject = renderJobAlertEmail(
      [...jobs, { ...jobs[0], id: "listing-2", companyName: "Globex" }],
      "https://ats.example.com",
    ).subject;

    expect(subject).toBe("2 new roles across 2 companies");
  });

  it("links back to the analysis page with the listing id", () => {
    const { html, text } = renderJobAlertEmail(jobs, "https://ats.example.com/");
    const expected = "https://ats.example.com/dashboard/analysis?listing=listing-1";

    // The trailing slash on the base URL must not produce a double slash.
    expect(html).toContain(expected);
    expect(text).toContain(expected);
  });

  it("escapes markup in job fields", () => {
    const { html } = renderJobAlertEmail(
      [{ ...jobs[0], title: '<script>alert("x")</script>' }],
      "https://ats.example.com",
    );

    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
  });

  it("omits the location line when there is none", () => {
    const { text } = renderJobAlertEmail([{ ...jobs[0], location: undefined }], "https://a.test");
    expect(text).toContain("Acme — Senior Engineer\n");
  });
});
