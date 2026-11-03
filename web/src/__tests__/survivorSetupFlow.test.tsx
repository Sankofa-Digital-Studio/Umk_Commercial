// @vitest-environment jsdom
import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SafetyPlanTab } from "../components/safehaven/SafetyPlanTab";
import { UtilityCheatSheetModal } from "../components/calculator/UtilityCheatSheetModal";
import { UatProfile } from "../services/uatProfileService";

vi.mock("../components/GoogleMapsSafeHavenView", () => ({ GoogleMapsSafeHavenView: () => <div>Map</div> }));
vi.mock("../components/EscapeGoBagChecklist", () => ({ EscapeGoBagChecklist: () => <div>Go bag</div> }));
vi.mock("../components/SouthAfricanLegalRights", () => ({ SouthAfricanLegalRights: () => <div>Rights</div> }));

const profile: UatProfile = {
  isUatMode: false,
  onboardingCompleted: false,
  preferredDisguise: "MUNICIPAL_PREPAID",
  personal: { fullName: "Lerato M", safeWord: "LAVENDER", saIdNumber: "" },
  socials: { alertEmail: "", twitterHandle: "", instagramHandle: "", facebookProfile: "" },
  contacts: [{ id: "6a0b9bc2-56f0-4a7e-a2af-4aab04d7e9d1", name: "Thandi M", relationship: "Sister", phone: "0821234567", email: "", isPrimary: true }],
};

const renderPlan = (overrides: Partial<React.ComponentProps<typeof SafetyPlanTab>> = {}) => {
  const onUpdateProfile = vi.fn().mockResolvedValue(undefined);
  render(
    <SafetyPlanTab
      uatProfile={profile}
      onUpdateProfile={onUpdateProfile}
      isUatMode={false}
      onToggleUat={vi.fn()}
      permissionsStatus={{ geolocation: "prompt", storage: "not_persisted", notifications: "default" }}
      isLocating={false}
      onRefreshLocation={vi.fn()}
      onRequestStorage={vi.fn()}
      onRequestNotifications={vi.fn()}
      onEditProfile={vi.fn()}
      onManageIceContacts={vi.fn()}
      onOpenLifeline={vi.fn()}
      {...overrides}
    />
  );
  return onUpdateProfile;
};

describe("Survivor three-step setup UI", () => {
  it("keeps secondary cards closed, opens the wizard anchor, and exposes back-to-top", () => {
    renderPlan({ focusSection: "profile" });
    expect(screen.getByTestId("profile-expansion-card").querySelector("button")!).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("ice-expansion-card").querySelector("button")!).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: "Back to top" })).toBeInTheDocument();
  });

  it("closes the profile card only after the persisted save resolves", async () => {
    let resolveSave!: () => void;
    const onUpdateProfile = vi.fn(() => new Promise<void>((resolve) => { resolveSave = resolve; }));
    renderPlan({ focusSection: "profile", onUpdateProfile });
    fireEvent.click(screen.getByRole("button", { name: /Save Personal Profile/i }));
    expect(screen.getByTestId("profile-expansion-card").querySelector("button")!).toHaveAttribute("aria-expanded", "true");
    resolveSave();
    await waitFor(() => expect(screen.getByTestId("profile-expansion-card").querySelector("button")!).toHaveAttribute("aria-expanded", "false"));
  });

  it("edits and persists an existing ICE contact instead of duplicating it", async () => {
    const onUpdateProfile = renderPlan({ focusSection: "ice" });
    fireEvent.click(screen.getByRole("button", { name: "Edit Thandi M" }));
    const nameInput = screen.getByDisplayValue("Thandi M");
    fireEvent.change(nameInput, { target: { value: "Thandi Updated" } });
    fireEvent.click(screen.getByRole("button", { name: /Update ICE Guardian/i }));

    await waitFor(() => expect(onUpdateProfile).toHaveBeenCalledWith(expect.objectContaining({
      contacts: [expect.objectContaining({ id: profile.contacts[0].id, name: "Thandi Updated" })],
    })));
    expect(screen.getByTestId("ice-expansion-card").querySelector("button")!).toHaveAttribute("aria-expanded", "false");
  });

  it("marks Direct Unlock distinctly from shield and code entry", () => {
    const onUnlock = vi.fn();
    render(<UtilityCheatSheetModal isOpen onClose={vi.fn()} onUnlockSafeHaven={onUnlock} />);
    fireEvent.click(screen.getByRole("button", { name: "Direct Unlock" }));
    expect(onUnlock).toHaveBeenCalledWith("direct");
  });
});
