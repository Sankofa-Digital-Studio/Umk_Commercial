import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UssdSimulationModal } from "../components/UssdSimulationModal";
import { startAudibleSiren, stopAudibleSiren, isSirenActive } from "../services/audibleSirenService";

describe("Audible Siren Deterrent & USSD Simulation", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    stopAudibleSiren();
  });

  it("activates and stops audible siren cleanly without errors", () => {
    // Mock Web Audio API
    const mockOscillator = {
      type: "sine",
      frequency: {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        cancelScheduledValues: vi.fn(),
      },
      connect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };

    const mockGain = {
      gain: {
        setValueAtTime: vi.fn(),
      },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };

    const mockAudioContext = {
      currentTime: 0,
      createOscillator: vi.fn(() => mockOscillator),
      createGain: vi.fn(() => mockGain),
      destination: {},
      close: vi.fn(),
    };

    vi.stubGlobal("AudioContext", vi.fn(() => mockAudioContext));

    const stopFn = startAudibleSiren();
    expect(isSirenActive()).toBe(true);

    stopFn();
    expect(isSirenActive()).toBe(false);
  });

  it("renders UssdSimulationModal and handles option 1 Emergency Callback", () => {
    const handleClose = vi.fn();
    render(
      <UssdSimulationModal
        isOpen={true}
        onClose={handleClose}
        ussdCode="*120*7867#"
        serviceTitle="TEARS Foundation Helpline"
      />
    );

    expect(screen.getByText("*120*7867#")).toBeDefined();
    expect(screen.getByText("ZERO AIRTIME")).toBeDefined();
    expect(screen.getByText(/Welcome to TEARS Foundation Helpline/i)).toBeDefined();

    // Type 1 and Send
    const input = screen.getByPlaceholderText(/Enter 1, 2, or 3/i);
    fireEvent.change(input, { target: { value: "1" } });

    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    // Response displayed
    expect(screen.getByText(/Emergency Alert Initiated/i)).toBeDefined();
    expect(screen.getByText(/priority callback request has been queued/i)).toBeDefined();

    // Click OK to close
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("asks for location before USSD option 2 claims a nearest centre", () => {
    render(
      <UssdSimulationModal
        isOpen={true}
        onClose={vi.fn()}
        ussdCode="*134*7355#"
        serviceTitle="TEARS Crisis USSD"
      />
    );

    const input = screen.getByPlaceholderText(/Enter 1, 2, or 3/i);
    fireEvent.change(input, { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText(/Live location is not available/i)).toBeDefined();
    expect(screen.getByText(/enable device location/i)).toBeDefined();
    expect(screen.queryByText(/Chris Hani Baragwanath TCC/i)).toBeNull();
  });

  it("uses cached live GPS for USSD option 2 nearest-centre discovery", () => {
    localStorage.setItem(
      "umkhuseli_last_known_gps",
      JSON.stringify({
        lat: -33.9249,
        lng: 18.4241,
        accuracy: 12,
        areaName: "City of Cape Town / Western Cape Metro",
        metro: "Cape Town",
        province: "Western Cape",
        timestamp: Date.now(),
      })
    );

    render(
      <UssdSimulationModal
        isOpen={true}
        onClose={vi.fn()}
        ussdCode="*134*7355#"
        serviceTitle="TEARS Crisis USSD"
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/Enter 1, 2, or 3/i), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(screen.getByText(/Nearest 24\/7 Safe Haven/i)).toBeDefined();
    expect(screen.getByText(/Victoria Hospital TCC/i)).toBeDefined();
  });
});
