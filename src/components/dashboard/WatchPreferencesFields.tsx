"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseWatchTerms } from "@/lib/watchlist-filters";
import type { WatchPreferences } from "@/types/watchlist";

export interface WatchPreferencesForm {
  roleKeywords: string;
  locations: string;
  excludeKeywords: string;
  emailAlerts: boolean;
}

export function watchPreferencesForm(preferences: WatchPreferences = {}): WatchPreferencesForm {
  return {
    roleKeywords: (preferences.roleKeywords ?? []).join(", "),
    locations: (preferences.locations ?? []).join(", "),
    excludeKeywords: (preferences.excludeKeywords ?? []).join(", "),
    emailAlerts: preferences.emailAlerts ?? true,
  };
}

export function watchPreferencesPayload(form: WatchPreferencesForm): WatchPreferences {
  return {
    roleKeywords: parseWatchTerms(form.roleKeywords),
    locations: parseWatchTerms(form.locations),
    excludeKeywords: parseWatchTerms(form.excludeKeywords),
    emailAlerts: form.emailAlerts,
  };
}

export function WatchPreferencesFields({
  prefix,
  value,
  onChange,
}: {
  prefix: string;
  value: WatchPreferencesForm;
  onChange: (value: WatchPreferencesForm) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-roles`}>Role keywords</Label>
          <Input
            id={`${prefix}-roles`}
            maxLength={809}
            placeholder="Engineer, designer"
            value={value.roleKeywords}
            onChange={(event) => onChange({ ...value, roleKeywords: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-locations`}>Locations</Label>
          <Input
            id={`${prefix}-locations`}
            maxLength={809}
            placeholder="Remote, India"
            value={value.locations}
            onChange={(event) => onChange({ ...value, locations: event.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${prefix}-exclude`}>Exclude from job titles</Label>
          <Input
            id={`${prefix}-exclude`}
            maxLength={809}
            placeholder="Senior, manager"
            value={value.excludeKeywords}
            onChange={(event) => onChange({ ...value, excludeKeywords: event.target.value })}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Comma-separated terms, up to 10 per field. Any role keyword and any location can match.
        Leave a field blank to match everything; exclusions always take priority.
      </p>
      <label className="flex min-h-11 items-center gap-3 text-sm">
        <input
          type="checkbox"
          className="h-4 w-4 accent-primary"
          checked={value.emailAlerts}
          onChange={(event) => onChange({ ...value, emailAlerts: event.target.checked })}
        />
        Email me new matching roles
      </label>
      <p className="text-xs text-muted-foreground">
        Sites are checked daily on deployment, or with Scan now. The first scan creates a baseline.
        In-app jobs are saved even when email is off.
      </p>
    </div>
  );
}
