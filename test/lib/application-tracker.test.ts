import { describe, expect, it } from "vite-plus/test";

import {
  applicationsCsv,
  applicationSummary,
  isFollowUpDue,
  localDateString,
} from "@/lib/application-tracker";
import { applicationCreateSchema, applicationUpdateSchema } from "@/lib/contracts/api";
import { EMPTY_APPLICATION, type TrackedApplication } from "@/types/applications";

const application: TrackedApplication = {
  ...EMPTY_APPLICATION,
  _id: "app-1",
  _creationTime: 1,
  updatedAt: 1,
  companyName: "Acme",
  jobTitle: "Engineer",
  status: "applied",
  followUpDate: "2026-10-03",
};

describe("application follow-ups", () => {
  it("includes today and overdue dates but excludes future dates and closed applications", () => {
    expect(isFollowUpDue(application, "2026-10-03")).toBe(true);
    expect(isFollowUpDue(application, "2026-10-04")).toBe(true);
    expect(isFollowUpDue(application, "2026-10-02")).toBe(false);
    expect(isFollowUpDue({ ...application, followUpDate: "" }, "2026-10-03")).toBe(false);
    for (const status of ["accepted", "rejected", "withdrawn"] as const) {
      expect(isFollowUpDue({ ...application, status }, "2026-10-03")).toBe(false);
    }
  });

  it("uses local calendar fields without shifting dates to UTC", () => {
    expect(localDateString(new Date(2026, 9, 3, 0, 1))).toBe("2026-10-03");
  });

  it("keeps active opportunities, interviews, offers and reminders distinct", () => {
    const result = applicationSummary(
      [
        application,
        { ...application, status: "interviewing" },
        { ...application, status: "offer" },
        { ...application, status: "accepted" },
        { ...application, status: "rejected" },
      ],
      "2026-10-03",
    );
    expect(result).toEqual({ total: 5, active: 3, interviews: 1, offers: 2, followUpsDue: 3 });
  });
});

describe("application input contracts", () => {
  it("accepts leap days and clearing optional fields", () => {
    expect(
      applicationCreateSchema.safeParse({
        ...EMPTY_APPLICATION,
        companyName: "Acme",
        jobTitle: "Engineer",
        appliedDate: "2024-02-29",
      }).success,
    ).toBe(true);
    expect(applicationUpdateSchema.safeParse({ followUpDate: "", notes: "" }).success).toBe(true);
  });

  it.each(["2026-02-29", "2026-04-31", "2026-13-01", "tomorrow"])(
    "rejects invalid date %s",
    (date) => {
      expect(applicationUpdateSchema.safeParse({ followUpDate: date }).success).toBe(false);
    },
  );

  it("rejects executable links, empty patches and ownership fields", () => {
    expect(applicationUpdateSchema.safeParse({ jobUrl: "javascript:alert(1)" }).success).toBe(
      false,
    );
    expect(
      applicationUpdateSchema.safeParse({ jobUrl: "https://user:secret@example.com/job" }).success,
    ).toBe(false);
    expect(applicationUpdateSchema.safeParse({}).success).toBe(false);
    expect(applicationUpdateSchema.safeParse({ userId: "another-user" }).success).toBe(false);
  });
});

describe("application CSV export", () => {
  it("preserves commas, quotes, multiline notes and Unicode", () => {
    const csv = applicationsCsv([
      { ...application, companyName: 'Acme, "India"', notes: "第一\nSecond line" },
    ]);
    expect(csv).toContain('"Acme, ""India"""');
    expect(csv).toContain('"第一\nSecond line"');
    expect(csv.startsWith("\uFEFF")).toBe(true);
  });

  it.each(['=HYPERLINK("bad")', "+cmd", "@SUM(1)", "-2+3", "  =1+1", "\t=1+1", "\n=1+1"])(
    "escapes spreadsheet formula %s",
    (notes) => {
      expect(applicationsCsv([{ ...application, notes }])).toContain(
        `"'${notes.replace(/"/g, '""')}"`,
      );
    },
  );
});
