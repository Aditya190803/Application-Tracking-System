/**
 * Transactional email via Resend's REST API.
 *
 * Plain `fetch` rather than the SDK, matching how the AI provider is called in
 * `src/lib/gemini.ts` — one less dependency for a single endpoint.
 */

const RESEND_ENDPOINT = "https://api.resend.com/emails";

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export class EmailNotConfiguredError extends Error {
  constructor() {
    super("Email is not configured. Set RESEND_API_KEY and EMAIL_FROM.");
    this.name = "EmailNotConfiguredError";
  }
}

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

/** Sends one email. Throws on any non-2xx so callers never record a false send. */
export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new EmailNotConfiguredError();
  }

  const response = await fetch(RESEND_ENDPOINT, {
    method: "POST",
    signal: AbortSignal.timeout(15000),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend API error (${response.status})`);
  }

  const data = (await response.json()) as { id?: string };
  return { id: data.id ?? "" };
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
