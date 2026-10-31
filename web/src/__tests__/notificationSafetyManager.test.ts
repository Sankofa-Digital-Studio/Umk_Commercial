import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  getNotificationControls,
  saveNotificationControls,
  sanitizeAlertTextForSafety,
  beginPermissionActionGuard,
  endPermissionActionGuard,
  isPanicExitSuppressed,
  DEFAULT_NOTIFICATION_CONTROLS,
} from "../services/notificationSafetyManager";

describe("Notification Safety & In-SafeHaven Action Guard", () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    endPermissionActionGuard();
  });

  it("loads default notification controls with confidential delivery", () => {
    const controls = getNotificationControls();
    expect(controls.deliveryLevel).toBe("CONFIDENTIAL");
    expect(controls.disguiseAsUtilityText).toBe(true);
    expect(controls.enableGuardianArrivalAlerts).toBe(true);
  });

  it("persists updated notification safety preferences", () => {
    saveNotificationControls({
      ...DEFAULT_NOTIFICATION_CONTROLS,
      deliveryLevel: "ULTRA_DISCREET",
      disguiseAsUtilityText: false,
    });
    const reloaded = getNotificationControls();
    expect(reloaded.deliveryLevel).toBe("ULTRA_DISCREET");
    expect(reloaded.disguiseAsUtilityText).toBe(false);
  });

  it("sanitizes alert text to municipal utility statements under disguise mode", () => {
    const sosAlert = sanitizeAlertTextForSafety(
      "SOS Distress Beacon Dispatched",
      "Live coordinates sent to 5 ICE contacts.",
      "DECOY_DISGUISED"
    );
    expect(sosAlert.isDisguised).toBe(true);
    expect(sosAlert.title).toContain("PowerCal SA");
    expect(sosAlert.message).toContain("tariff profile synchronized");
  });

  it("sanitizes alert text to ultra discreet STS statement in ULTRA_DISCREET mode", () => {
    const ultraAlert = sanitizeAlertTextForSafety(
      "Emergency SOS Active",
      "Perpetrator near. Beacon running.",
      "ULTRA_DISCREET"
    );
    expect(ultraAlert.isDisguised).toBe(true);
    expect(ultraAlert.title).toBe("Utility Notice");
    expect(ultraAlert.message).toBe("STS balance verified.");
  });

  it("guards user inside safe haven when system permission action is requested", () => {
    expect(isPanicExitSuppressed()).toBe(false);

    beginPermissionActionGuard(5000);
    expect(isPanicExitSuppressed()).toBe(true);

    endPermissionActionGuard();
    expect(isPanicExitSuppressed()).toBe(false);
  });
});
