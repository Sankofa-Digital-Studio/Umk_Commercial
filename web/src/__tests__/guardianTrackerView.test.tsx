import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { GuardianTrackerView } from "../components/GuardianTrackerView";
import {
  BEACON_TTL_MS,
  buildEphemeralResponderLink,
  formatBeaconRelativeTime,
  isBeaconActive,
  LiveSosBeacon,
} from "../services/liveBeaconService";

const mocks = vi.hoisted(() => ({
  loadBeacon: vi.fn(),
  persistLocation: vi.fn(),
  readDeviceLocation: vi.fn(),
}));

vi.mock("../services/liveBeaconService", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/liveBeaconService")>();
  return {
    ...actual,
    loadActiveSosBeacon: mocks.loadBeacon,
    persistBeaconLocation: mocks.persistLocation,
  };
});

vi.mock("../services/deviceLocationResolver", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../services/deviceLocationResolver")>();
  return { ...actual, readDeviceLocationWithDetails: mocks.readDeviceLocation };
});

const now = new Date("2026-11-03T08:00:00.000Z").getTime();
const beacon: LiveSosBeacon = {
  id: "9dbeb918-9930-4ce6-a2df-9a8bd34c78ef",
  status: "DISPATCHED",
  latitude: -26.2041,
  longitude: 28.0473,
  accuracy: 12,
  areaName: "Johannesburg Central / Gauteng",
  batteryPercentage: 71,
  isCharging: false,
  deviceModel: "Android",
  createdAt: new Date(now - 5 * 60_000).toISOString(),
  dispatchedAt: new Date(now - 4 * 60_000).toISOString(),
  responderToken: "b7c2abda-c66d-46f5-bc77-a08fb3afabcc",
  expiresAt: new Date(now + BEACON_TTL_MS - 4 * 60_000).toISOString(),
};

describe("Guardian Console live beacon truth", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.setSystemTime(now);
    window.history.replaceState({}, "", "/");
    mocks.readDeviceLocation.mockRejectedValue(new Error("GPS unavailable"));
  });

  it("never presents Live, Active, a reference or triggered time without a verified beacon", async () => {
    mocks.loadBeacon.mockResolvedValue(null);
    render(<GuardianTrackerView />);
    expect(await screen.findByText("INACTIVE")).toBeInTheDocument();
    expect(screen.getByText(/NO ACTIVE EMERGENCY BEACON/i)).toBeInTheDocument();
    expect(screen.getByText("Not triggered")).toBeInTheDocument();
    expect(screen.queryByText(/Ref:/i)).not.toBeInTheDocument();
  });

  it("renders persisted reference, real relative time and telemetry for a verified active beacon", async () => {
    mocks.loadBeacon.mockResolvedValue(beacon);
    render(<GuardianTrackerView beaconToken={beacon.responderToken} />);
    expect(await screen.findByText("LIVE")).toBeInTheDocument();
    expect(screen.getByText("EMERGENCY SOS BEACON ACTIVE")).toBeInTheDocument();
    expect(screen.getByText(`Ref: ${beacon.id}`)).toBeInTheDocument();
    expect(screen.getByText("4 minutes ago")).toBeInTheDocument();
    expect(screen.getByText("71%")).toBeInTheDocument();
  });

  it("only creates responder links for active, unexpired records", () => {
    expect(isBeaconActive(beacon, now)).toBe(true);
    expect(buildEphemeralResponderLink(beacon, "https://example.test", now))
      .toBe(`https://example.test/?track=${beacon.responderToken}`);
    const expired = { ...beacon, expiresAt: new Date(now).toISOString() };
    expect(isBeaconActive(expired, now)).toBe(false);
    expect(buildEphemeralResponderLink(expired, "https://example.test", now)).toBeNull();
    expect(formatBeaconRelativeTime(beacon.dispatchedAt, now)).toBe("4 minutes ago");
  });

  it("keeps persisted location details closed until requested", async () => {
    mocks.loadBeacon.mockResolvedValue(beacon);
    render(<GuardianTrackerView />);
    const toggle = await screen.findByRole("button", { name: /Verified beacon location/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Johannesburg Central / Gauteng")).toBeInTheDocument();
  });

  it("prompts the owner at 500m, opens the anchor card, persists once, and reports HTTP success", async () => {
    const currentLocation = {
      latitude: -26.2141,
      longitude: 28.0473,
      accuracy: 8,
      district: "City of Johannesburg Metropolitan Municipality",
      region: "Gauteng Central (Region F)",
      city: "Johannesburg",
      town: "Johannesburg Central",
      province: "Gauteng",
      formattedDisplay: "Johannesburg Central, Gauteng",
      source: "GPS_DEVICE" as const,
      timestamp: now,
    };
    const updatedBeacon = {
      ...beacon,
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      areaName: currentLocation.formattedDisplay,
    };
    mocks.loadBeacon.mockResolvedValue(beacon);
    mocks.readDeviceLocation.mockResolvedValue(currentLocation);
    mocks.persistLocation.mockResolvedValue(updatedBeacon);
    const scrollIntoView = vi.fn();
    Element.prototype.scrollIntoView = scrollIntoView;

    render(<GuardianTrackerView />);

    const refresh = await screen.findByRole("button", { name: /Refresh saved coordinates/i });
    expect(mocks.readDeviceLocation).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: /Verified beacon location/i })).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(refresh);
    expect(screen.getByRole("button", { name: /Verified beacon location/i })).toHaveAttribute("aria-expanded", "true");
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(mocks.persistLocation).toHaveBeenCalledTimes(1));
    expect(mocks.persistLocation).toHaveBeenCalledWith(beacon.id, {
      latitude: currentLocation.latitude,
      longitude: currentLocation.longitude,
      accuracy: currentLocation.accuracy,
      areaName: currentLocation.formattedDisplay,
    });
    expect(await screen.findByTestId("http-toast-success")).toHaveTextContent("HTTP 200");
    expect(screen.queryByRole("button", { name: /Refresh saved coordinates/i })).not.toBeInTheDocument();
  });

  it("keeps responder-token consoles read-only and never requests device GPS", async () => {
    mocks.loadBeacon.mockResolvedValue(beacon);
    render(<GuardianTrackerView beaconToken={beacon.responderToken} />);

    expect(await screen.findByText("LIVE")).toBeInTheDocument();
    expect(mocks.loadBeacon).toHaveBeenCalledWith(beacon.responderToken);
    expect(mocks.readDeviceLocation).not.toHaveBeenCalled();
    expect(mocks.persistLocation).not.toHaveBeenCalled();
  });
});
