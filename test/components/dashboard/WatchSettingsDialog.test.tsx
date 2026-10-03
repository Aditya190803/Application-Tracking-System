import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vite-plus/test";

import { WatchSettingsDialog } from "@/components/dashboard/WatchSettingsDialog";

afterEach(cleanup);
describe("tracking settings", () => {
  it("submits edited filters and the email preference", async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    render(
      <WatchSettingsDialog
        watch={{ companyName: "Acme", roleKeywords: ["Engineer"], emailAlerts: true }}
        onClose={vi.fn()}
        onSave={onSave}
      />,
    );
    expect(screen.getByRole("dialog")).toHaveAccessibleName("Tracking settings for Acme");
    fireEvent.change(screen.getByLabelText("Role keywords"), {
      target: { value: "Developer, Engineer" },
    });
    fireEvent.change(screen.getByLabelText("Locations"), { target: { value: "Remote" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        roleKeywords: ["Developer", "Engineer"],
        locations: ["Remote"],
        excludeKeywords: [],
        emailAlerts: false,
      }),
    );
  });

  it("keeps entered settings when saving fails", async () => {
    const onClose = vi.fn();
    render(
      <WatchSettingsDialog
        watch={{ companyName: "Acme" }}
        onClose={onClose}
        onSave={vi.fn().mockRejectedValue(new Error("Storage unavailable"))}
      />,
    );
    fireEvent.change(screen.getByLabelText("Locations"), { target: { value: "Remote" } });
    fireEvent.click(screen.getByRole("button", { name: "Save settings" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Storage unavailable");
    expect(screen.getByLabelText("Locations")).toHaveValue("Remote");
    expect(onClose).not.toHaveBeenCalled();
  });
});
