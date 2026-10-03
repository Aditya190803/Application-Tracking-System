import { assertSafeUrl } from "@/lib/safe-fetch";

export function isCareerPageRenderingConfigured(): boolean {
  return Boolean(process.env.FIRECRAWL_API_BASE_URL?.trim());
}

/** Optional rendering fallback for pages with no jobs in their initial HTML. */
export async function renderCareerPage(url: string): Promise<string> {
  await assertSafeUrl(url);
  const configured = process.env.FIRECRAWL_API_BASE_URL?.trim().replace(/\/+$/, "");
  if (!configured) throw new Error("Career page rendering is not configured");
  const endpoint = /\/v[12]$/.test(configured) ? `${configured}/scrape` : `${configured}/v2/scrape`;
  await assertSafeUrl(endpoint);
  const apiKey = process.env.FIRECRAWL_API_KEY;
  const response = await fetch(endpoint, {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(25000),
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
    },
    body: JSON.stringify({
      url,
      formats: ["html"],
      onlyMainContent: false,
      waitFor: 1000,
      timeout: 20000,
    }),
  });
  if (!response.ok)
    throw new Error(`Could not render this career page (service status ${response.status}).`);
  const payload = (await response.json()) as {
    success?: boolean;
    data?: { html?: unknown; metadata?: { sourceURL?: string } };
  };
  if (!payload.success || typeof payload.data?.html !== "string")
    throw new Error("The rendering service returned no readable page content.");
  if (payload.data.metadata?.sourceURL) await assertSafeUrl(payload.data.metadata.sourceURL);
  return payload.data.html.slice(0, 4 * 1024 * 1024);
}
