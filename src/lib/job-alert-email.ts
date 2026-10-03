import { escapeHtml } from "@/lib/email";

export interface AlertJob {
  id: string;
  title: string;
  companyName: string;
  url: string;
  location?: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

function tailorUrl(appUrl: string, listingId: string): string {
  return `${appUrl.replace(/\/+$/, "")}/dashboard/analysis?listing=${encodeURIComponent(listingId)}`;
}

function buildSubject(jobs: AlertJob[]): string {
  const companies = new Set(jobs.map((job) => job.companyName));
  const plural = jobs.length === 1 ? "role" : "roles";

  if (companies.size === 1) {
    return `${jobs.length} new ${plural} at ${[...companies][0]}`;
  }

  return `${jobs.length} new ${plural} across ${companies.size} companies`;
}

/**
 * Renders the digest sent when a scan finds postings that were not on the
 * page before. Every job carries two actions: the posting itself, and a link
 * back into the app that opens the analysis page with the description already
 * filled in.
 */
export function renderJobAlertEmail(jobs: AlertJob[], appUrl: string): RenderedEmail {
  const subject = buildSubject(jobs);

  const cards = jobs
    .map((job) => {
      const location = job.location
        ? `<div style="margin:2px 0 0;font-size:13px;color:#6b7280;">${escapeHtml(job.location)}</div>`
        : "";

      return `
        <tr>
          <td style="padding:16px 0;border-bottom:1px solid #e5e7eb;">
            <div style="font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:#6b7280;">
              ${escapeHtml(job.companyName)}
            </div>
            <div style="margin:6px 0 0;font-size:17px;font-weight:600;color:#111827;">
              ${escapeHtml(job.title)}
            </div>
            ${location}
            <div style="margin:12px 0 0;">
              <a href="${escapeHtml(tailorUrl(appUrl, job.id))}"
                 style="display:inline-block;padding:9px 16px;border-radius:8px;background:#111827;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">
                Tailor my resume
              </a>
              <a href="${escapeHtml(job.url)}"
                 style="display:inline-block;margin-left:8px;padding:9px 16px;border-radius:8px;border:1px solid #d1d5db;color:#111827;font-size:14px;font-weight:600;text-decoration:none;">
                View posting
              </a>
            </div>
          </td>
        </tr>`;
    })
    .join("");

  const html = `<!doctype html>
<html>
  <body style="margin:0;padding:24px;background:#f9fafb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;">
      <tr>
        <td style="padding:28px 28px 8px;">
          <h1 style="margin:0;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(subject)}</h1>
          <p style="margin:8px 0 0;font-size:14px;line-height:1.5;color:#4b5563;">
            These postings appeared on the career pages you are watching since the last check.
          </p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cards}</table>
        </td>
      </tr>
      <tr>
        <td style="padding:20px 28px 28px;">
          <a href="${escapeHtml(`${appUrl.replace(/\/+$/, "")}/dashboard/watchlist`)}"
             style="font-size:13px;color:#6b7280;text-decoration:underline;">
            Manage your watchlist
          </a>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const text = [
    subject,
    "",
    ...jobs.flatMap((job) => [
      `${job.companyName} — ${job.title}${job.location ? ` (${job.location})` : ""}`,
      `Posting: ${job.url}`,
      `Tailor my resume: ${tailorUrl(appUrl, job.id)}`,
      "",
    ]),
    `Manage your watchlist: ${appUrl.replace(/\/+$/, "")}/dashboard/watchlist`,
  ].join("\n");

  return { subject, html, text };
}
