import type { WatchPreferences } from "@/types/watchlist";

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/\s+/g, " ").trim();
}

export function matchesWatchFilters(
  listing: { title: string; location?: string },
  preferences: WatchPreferences,
): boolean {
  const title = normalize(listing.title);
  const location = normalize(listing.location ?? "");
  const roles = preferences.roleKeywords ?? [];
  const locations = preferences.locations ?? [];
  const exclusions = preferences.excludeKeywords ?? [];
  return (
    (roles.length === 0 || roles.some((keyword) => title.includes(normalize(keyword)))) &&
    (locations.length === 0 ||
      locations.some((keyword) => location.includes(normalize(keyword)))) &&
    !exclusions.some((keyword) => title.includes(normalize(keyword)))
  );
}

export function parseWatchTerms(value: string): string[] {
  return [
    ...new Set(
      value
        .split(",")
        .map((term) => term.trim())
        .filter(Boolean),
    ),
  ];
}
