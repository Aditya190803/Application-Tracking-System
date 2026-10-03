"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Loader2, X } from "lucide-react";
import { useState } from "react";

import {
  WatchPreferencesFields,
  watchPreferencesForm,
  watchPreferencesPayload,
} from "@/components/dashboard/WatchPreferencesFields";
import { Button } from "@/components/ui/button";
import { watchlistUpdateSchema } from "@/lib/contracts/api";
import type { WatchPreferences } from "@/types/watchlist";

export function WatchSettingsDialog({
  watch,
  onClose,
  onSave,
}: {
  watch: WatchPreferences & { companyName: string };
  onClose: () => void;
  onSave: (preferences: WatchPreferences) => Promise<void>;
}) {
  const [fields, setFields] = useState(() => watchPreferencesForm(watch));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open && !saving) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/50" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-[61] max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="mb-6 flex justify-between gap-3">
            <div>
              <Dialog.Title className="text-xl font-bold">
                Tracking settings for {watch.companyName}
              </Dialog.Title>
              <Dialog.Description className="mt-2 text-sm text-muted-foreground">
                Choose which roles you want to keep an eye on. Changes apply on the next scan and to
                the matching jobs shown here.
              </Dialog.Description>
            </div>
            <Dialog.Close asChild>
              <Button
                variant="ghost"
                className="h-11 w-11 shrink-0"
                disabled={saving}
                aria-label="Close tracking settings"
              >
                <X />
              </Button>
            </Dialog.Close>
          </div>
          <form
            className="space-y-5"
            onSubmit={async (event) => {
              event.preventDefault();
              setError(null);
              const payload = watchPreferencesPayload(fields);
              const parsed = watchlistUpdateSchema.safeParse(payload);
              if (!parsed.success) {
                setError(parsed.error.issues[0]?.message ?? "Check your filter terms");
                return;
              }
              setSaving(true);
              try {
                await onSave(payload);
              } catch (failure) {
                setError(
                  failure instanceof Error ? failure.message : "Could not save these settings",
                );
              } finally {
                setSaving(false);
              }
            }}
          >
            <fieldset disabled={saving}>
              <WatchPreferencesFields prefix="edit-watch" value={fields} onChange={setFields} />
            </fieldset>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button
                className="h-11"
                variant="outline"
                type="button"
                onClick={onClose}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button className="h-11" type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" />}
                {saving ? "Saving…" : "Save settings"}
              </Button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
