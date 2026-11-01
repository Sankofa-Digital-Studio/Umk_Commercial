import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { GoogleMapsSafeHavenView } from "../components/GoogleMapsSafeHavenView";
import { THUTHUZELA_CENTERS } from "../data/saSafetyData";

describe("GoogleMapsSafeHavenView Component", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  // Test 1: Preserved baseline test
  it("renders Current Identified Area banner with Offline Maps and Find My Device buttons", () => {
    render(<GoogleMapsSafeHavenView />);

    expect(screen.getByText("Current Identified Area")).toBeDefined();
    expect(screen.getByRole("button", { name: /Offline Maps/i })).toBeDefined();
    expect(screen.getByRole("button", { name: /Find My Device/i })).toBeDefined();
    expect(screen.getByText(/TACTICAL GPS RADAR/i)).toBeDefined();
  });

  // Test 2: Preserved baseline test
  it("triggers offline map caching and displays confirmation feedback", () => {
    render(<GoogleMapsSafeHavenView />);

    const offlineBtn = screen.getByRole("button", { name: /Offline Maps/i });
    fireEvent.click(offlineBtn);

    expect(screen.getByText(/Offline municipal safety waypoints & TCC directory cached locally/i)).toBeDefined();
    expect(screen.getByText("Map Cached")).toBeDefined();
  });

  // Test 3: No static city/TCC is selected until GPS or an explicit user choice resolves it.
  it("renders a user-selected Thuthuzela Care Centre with address, direct call, and directions links", () => {
    render(<GoogleMapsSafeHavenView />);

    const firstCenter = THUTHUZELA_CENTERS[0];
    expect(screen.queryByText(firstCenter.name)).toBeNull();
    fireEvent.click(screen.getByTestId(`osm-pin-${firstCenter.id}`));
    expect(screen.getByText(firstCenter.name)).toBeDefined();
    expect(screen.getByText(firstCenter.address)).toBeDefined();
    expect(screen.getByRole("link", { name: new RegExp(`Call TCC \\(${firstCenter.contactNumber}\\)`) })).toBeDefined();
    expect(screen.getByRole("link", { name: /Directions/i })).toBeDefined();
  });

  // Test 4: Preserved baseline test
  it("triggers Find My Device location detection when clicked", () => {
    const mockGeolocation = {
      getCurrentPosition: vi.fn().mockImplementation((success) =>
        success({
          coords: {
            latitude: -26.2041,
            longitude: 28.0473,
            accuracy: 15,
          },
        })
      ),
    };

    vi.stubGlobal("navigator", {
      ...global.navigator,
      geolocation: mockGeolocation,
    });

    render(<GoogleMapsSafeHavenView />);

    const findDeviceBtn = screen.getByRole("button", { name: /Find My Device/i });
    fireEvent.click(findDeviceBtn);

    expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
  });

  // Test 5: Live interactive OpenStreetMap (OSM) viewer with zoom, pan, live center on user coordinates, and TCC pins
  it("renders live interactive OpenStreetMap (OSM) viewer with zoom, pan, live center, and TCC pins", () => {
    const onSelectMock = vi.fn();
    render(<GoogleMapsSafeHavenView onSelectCenter={onSelectMock} />);

    // Verify OSM viewer container
    expect(screen.getByTestId("interactive-osm-viewer")).toBeDefined();
    expect(screen.getByText(/LIVE OPENSTREETMAP \(OSM\)/i)).toBeDefined();
    expect(screen.getByText(/Free Live Map/i)).toBeDefined();

    // Verify Zoom In and Zoom Out buttons
    const zoomInBtn = screen.getByRole("button", { name: /Zoom in/i });
    const zoomOutBtn = screen.getByRole("button", { name: /Zoom out/i });
    expect(zoomInBtn).toBeDefined();
    expect(zoomOutBtn).toBeDefined();
    fireEvent.click(zoomInBtn);
    fireEvent.click(zoomOutBtn);

    // Verify Center on My Location button
    const centerBtn = screen.getByRole("button", { name: /Center on my location/i });
    expect(centerBtn).toBeDefined();
    fireEvent.click(centerBtn);

    // Verify Pan controls
    const panWestBtn = screen.getByRole("button", { name: /Pan West/i });
    const panNorthBtn = screen.getByRole("button", { name: /Pan North/i });
    expect(panWestBtn).toBeDefined();
    expect(panNorthBtn).toBeDefined();
    fireEvent.click(panWestBtn);
    fireEvent.click(panNorthBtn);

    // Verify interactive pins across provinces are present
    const baraPin = screen.getByTestId("osm-pin-gp_bara");
    const karlBremerPin = screen.getByTestId("osm-pin-wc_karl_bremer");
    expect(baraPin).toBeDefined();
    expect(karlBremerPin).toBeDefined();

    // Clicking a pin selects that center and calls callback
    fireEvent.click(karlBremerPin);
    expect(onSelectMock).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Karl Bremer TCC", province: "Western Cape" })
    );
    expect(screen.getByText("Karl Bremer TCC")).toBeDefined();
  });

  // Test 6: Scope selection (City, Province, Entire Country)
  it("supports scope selection across City / Metro, Province, and Entire Country", () => {
    render(<GoogleMapsSafeHavenView />);

    // Without a GPS fix the safe default is national; the user can explicitly choose a metro.
    fireEvent.click(screen.getByRole("button", { name: /City \/ Metro/i }));
    const capeTownBtn = screen.getByTestId("scope-city-Cape Town");
    fireEvent.click(capeTownBtn);

    // Switch to Province scope
    const provinceTab = screen.getByRole("button", { name: /Province/i });
    fireEvent.click(provinceTab);
    const kznBtn = screen.getByTestId("scope-province-KwaZulu-Natal");
    fireEvent.click(kznBtn);

    // Switch to Entire Country scope
    const countryTab = screen.getByRole("button", { name: /Entire Country/i });
    fireEvent.click(countryTab);
    expect(screen.getByText(/National Grid:/i)).toBeDefined();
    expect(screen.getByText(/Covers all 9 South African provinces/i)).toBeDefined();

    // Download Country scope
    const offlineBtn = screen.getByRole("button", { name: /Offline Maps/i });
    fireEvent.click(offlineBtn);

    const savedRaw = localStorage.getItem("umkhuseli_offline_map_package");
    expect(savedRaw).not.toBeNull();
    const savedPkg = JSON.parse(savedRaw!);
    expect(savedPkg.scopeType).toBe("country");
    expect(savedPkg.safeHavens.length).toBe(THUTHUZELA_CENTERS.length);
  });

  // Test 7: Expiry calculation (default 30 days) and armed notification schedule
  it("calculates 30-day expiry date and renders interactive Offline Map Status Card with armed notification schedule", () => {
    const mockNow = new Date("2026-10-27T10:00:00Z");
    vi.setSystemTime(mockNow);

    render(<GoogleMapsSafeHavenView />);

    const offlineBtn = screen.getByRole("button", { name: /Offline Maps/i });
    fireEvent.click(offlineBtn);

    // Verify immediate alert feedback
    expect(
      screen.getByText(/Offline map for Entire Country \(South Africa - National Grid & All 9 Provinces\) downloaded\. Expiry Date: .* Automatic reminder alerts armed\./i)
    ).toBeDefined();

    // Verify Offline Map Status Card
    const statusCard = screen.getByTestId("offline-map-status-card");
    expect(statusCard).toBeDefined();
    expect(screen.getByText("Cache Active")).toBeDefined();
    expect(screen.getByTestId("countdown-display").textContent).toContain("30 days");
    expect(screen.getByTestId("expiry-date-display")).toBeDefined();

    // Verify all 7 notification intervals are armed
    const intervals = ["7d", "5d", "3d", "24h", "12h", "6h", "1h"];
    intervals.forEach((id) => {
      const milestoneElem = screen.getByTestId(`timeline-milestone-${id}`);
      expect(milestoneElem).toBeDefined();
      expect(milestoneElem.textContent).toContain("Armed");
    });

    vi.useRealTimers();
  });

  // Test 8: Test Expiry Alert triggers for (7d, 5d, 3d, 24h, 12h, 6h, 1h)
  it("triggers test expiry alerts and updates notification schedule timeline (7d, 5d, 3d, 24h, 12h, 6h, 1h)", () => {
    render(<GoogleMapsSafeHavenView />);

    // Download first to get the active card
    const offlineBtn = screen.getByRole("button", { name: /Offline Maps/i });
    fireEvent.click(offlineBtn);

    // Test 7d alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-7d"));
    expect(screen.getByTestId("active-alert-banner")).toBeDefined();
    expect(screen.getByText(/\[Safety Reminder: 7 Days Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-7d").textContent).toContain("Triggered");

    // Test 5d alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-5d"));
    expect(screen.getByText(/\[Safety Reminder: 5 Days Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-5d").textContent).toContain("Triggered");

    // Test 3d alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-3d"));
    expect(screen.getByText(/\[Urgency Notice: 3 Days Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-3d").textContent).toContain("Triggered");

    // Test 24h alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-24h"));
    expect(screen.getByText(/\[Critical Alert: 24 Hours Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-24h").textContent).toContain("Triggered");

    // Test 12h alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-12h"));
    expect(screen.getByText(/\[Critical Alert: 12 Hours Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-12h").textContent).toContain("Triggered");

    // Test 6h alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-6h"));
    expect(screen.getByText(/\[Urgent Alert: 6 Hours Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-6h").textContent).toContain("Triggered");

    // Test 1h alert simulation
    fireEvent.click(screen.getByTestId("test-alert-btn-1h"));
    expect(screen.getByText(/\[Emergency Alert: 1 Hour Before Expiry\]/i)).toBeDefined();
    expect(screen.getByTestId("timeline-milestone-1h").textContent).toContain("Triggered");
  });

  // Test 9: Renew Map (+30 Days) and Delete Cache actions
  it("supports renewing map (+30 Days) and deleting offline cache", () => {
    render(<GoogleMapsSafeHavenView />);

    // Download package
    const offlineBtn = screen.getByRole("button", { name: /Offline Maps/i });
    fireEvent.click(offlineBtn);

    // Simulate 7d alert so timeline is modified
    fireEvent.click(screen.getByTestId("test-alert-btn-7d"));
    expect(screen.getByTestId("timeline-milestone-7d").textContent).toContain("Triggered");

    // Click Renew Map (+30 Days)
    const renewBtn = screen.getByRole("button", { name: /Renew Map \(\+30 Days\)/i });
    fireEvent.click(renewBtn);

    expect(screen.getByText(/renewed for \+30 days/i)).toBeDefined();
    // Schedule milestones should be reset back to Armed
    expect(screen.getByTestId("timeline-milestone-7d").textContent).toContain("Armed");

    // Click Delete Cache
    const deleteBtn = screen.getByRole("button", { name: /Delete Cache/i });
    fireEvent.click(deleteBtn);

    expect(screen.getByText("Offline map cache deleted.")).toBeDefined();
    expect(localStorage.getItem("umkhuseli_offline_map_package")).toBeNull();
    expect(screen.queryByTestId("offline-map-status-card")).toBeNull();
  });
});
