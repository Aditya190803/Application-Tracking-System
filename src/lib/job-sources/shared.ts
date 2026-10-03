const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  mdash: "—",
  ndash: "–",
  hellip: "…",
  rsquo: "'",
  lsquo: "'",
  ldquo: '"',
  rdquo: '"',
};

export function decodeEntities(input: string): string {
  return input
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) => String.fromCodePoint(Number.parseInt(dec, 10)))
    .replace(/&([a-z]+);/gi, (match, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? match);
}

/**
 * Flattens HTML to readable plain text. Block-level tags become newlines so a
 * job description keeps its paragraph and bullet structure, which matters
 * because this text is fed to the resume tailoring prompt.
 */
export function htmlToText(html: string, maxLength = 8000): string {
  const text = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ")
    .replace(/<\/(p|div|section|article|h[1-6]|tr|ul|ol)>/gi, "\n\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<li\b[^>]*>/gi, "- ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, " ");

  return decodeEntities(text)
    .replace(/[ \t ]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/^[ \t]+|[ \t]+$/gm, "")
    .trim()
    .slice(0, maxLength);
}

export function collapseWhitespace(input: string): string {
  return decodeEntities(input.replace(/<[^>]+>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

/** "acme-corp" / "acme_corp" -> "Acme Corp", for a default company name. */
export function humanizeSlug(slug: string): string {
  const cleaned = slug
    .replace(/[-_]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .trim();

  if (!cleaned) return slug;

  return cleaned
    .split(" ")
    .filter(Boolean)
    .map((word) => (word.length <= 3 ? word.toUpperCase() : word[0].toUpperCase() + word.slice(1)))
    .join(" ");
}

export function firstPathSegment(url: URL): string | null {
  const segment = url.pathname.split("/").filter(Boolean)[0];
  return segment ? decodeURIComponent(segment) : null;
}

export function toAbsoluteUrl(href: string, base: URL): string | null {
  try {
    const resolved = new URL(href, base);
    if (resolved.protocol !== "http:" && resolved.protocol !== "https:") {
      return null;
    }
    resolved.hash = "";
    return resolved.toString();
  } catch {
    return null;
  }
}

export function truncate(value: string | undefined, max: number): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : undefined;
}
