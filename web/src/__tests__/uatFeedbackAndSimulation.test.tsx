// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { SafeHavenDashboard } from "../components/SafeHavenDashboard";
import { submitUatFeedback, UAT_SIMULATED_GUARDIANS } from "../services/supabase";

describe("SafeHavenDashboard UAT Mode & In-App Feedback Suite", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.clear();
      window.localStorage.setItem("umkhuseli_onboarded_v23", "true");
    }
  });

  it("exports designated simulated UAT test guardians with non-emergency test numbers", () => {
    expect(UAT_SIMULATED_GUARDIANS.length).toBeGreaterThanOrEqual(2);
    expect(UAT_SIMULATED_GUARDIANS[0].mobileNumber1).toBe("+27820000001");
    expect(UAT_SIMULATED_GUARDIANS[1].mobileNumber1).toBe("+27820000002");
    expect(UAT_SIMULATED_GUARDIANS[0].isPrimary).toBe(true);
  });

  it("renders the UAT Test Mode toggle banner and toggles simulation state", () => {
    const onPanicLock = vi.fn();
    render(<SafeHavenDashboard onPanicLock={onPanicLock} />);

    const enableButton = screen.getByText(/Enable UAT Mode/i);
    expect(enableButton).toBeDefined();

    fireEvent.click(enableButton);
    expect(screen.getByText(/Exit Test Mode/i)).toBeDefined();
    expect(screen.getByText(/UAT Test Mode: Active/i)).toBeDefined();
    expect(screen.getByText(/Distress dispatches are safely simulated/i)).toBeDefined();
  });

  it("safely simulates distress dispatch in UAT mode without calling real emergency services", async () => {
    const onPanicLock = vi.fn();
    const onOpenGuardianTracker = vi.fn();
    render(
      <SafeHavenDashboard
        onPanicLock={onPanicLock}
        onOpenGuardianTracker={onOpenGuardianTracker}
      />
    );

    // Enable UAT Mode
    fireEvent.click(screen.getByText(/Enable UAT Mode/i));

    // Fast-forward or trigger SOS
    const holdSosButton = screen.getByText(/HOLD SOS/i);
    fireEvent.click(holdSosButton);

    // Countdown active
    expect(screen.getByText(/Broadcasting 72-hr GPS beacon/i)).toBeDefined();

    // Fast-forward countdown to 0 or wait
    await waitFor(
      () => {
        expect(screen.getByText(/UAT Simulated Dispatch Verified/i)).toBeDefined();
      },
      { timeout: 4500 }
    );

    expect(screen.getByText(/SAFE SIMULATION/i)).toBeDefined();
    expect(screen.getByText(/Sister Lerato \(\+27 82 000 0001\)/i)).toBeDefined();
    expect(screen.getByText(/Coordinator Sipho \(\+27 82 000 0002\)/i)).toBeDefined();

    // Click "Inspect Tracker View"
    const inspectBtn = screen.getByText(/Inspect Tracker View/i);
    fireEvent.click(inspectBtn);
    expect(onOpenGuardianTracker).toHaveBeenCalledTimes(1);
  });

  it("switches to the Feedback tab and submits anonymous UAT feedback with local outbox fallback", async () => {
    const onPanicLock = vi.fn();
    render(<SafeHavenDashboard onPanicLock={onPanicLock} />);

    // Click on Feedback tab in navigation
    const feedbackTabBtn = screen.getByTestId("tab-feedback");
    fireEvent.click(feedbackTabBtn);

    expect(screen.getByText(/Live Device UAT Feedback/i)).toBeDefined();
    expect(screen.getByText(/Feature Confidence & Stealth/i)).toBeDefined();

    // Fill in feedback form
    const aliasInput = screen.getByPlaceholderText(/Leave blank for full anonymity/i);
    fireEvent.change(aliasInput, { target: { value: "Tester-Alex-01" } });

    // Submit feedback
    const submitBtn = screen.getByText(/Submit Anonymous UAT Feedback/i);
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText(/Feedback transmitted securely|Feedback safely stored in offline outbox|Feedback saved locally/i)
      ).toBeDefined();
    });
  });
});
