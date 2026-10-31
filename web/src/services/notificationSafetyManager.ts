/**
 * Umkhuseli: The Protector (Sankofa Safe)
 * User Safety Notification Preferences & In-App Evasion Protection Service
 *
 * Implements:
 * 1. Granular Survivor Safety Notification Modes:
 *    - "ULTRA_DISCREET": Zero audio, zero banner, 0ms vibration, decoy notification text disguise.
 *    - "DECOY_DISGUISED": Push & in-app alerts masked as municipal electricity or proverb updates (e.g., "PowerCal SA: Tariff sync confirmed").
 *    - "CONFIDENTIAL": In-SafeHaven only toasts, suppressed on lockscreen / outside Safe Haven.
 *    - "FULL_ALERTS": Standard emergency toasts and audible haptic feedback.
 * 2. In-App Notification Delivery with Safety Filtering.
 * 3. Permission Request Intercept Guard (prevents OS prompts & permission popups from triggering window blur / panic exit).
 */

export type SafetyNotificationLevel = 
  | "ULTRA_DISCREET"   // Completely silent, stealth tactile only, zero lockscreen text
  | "DECOY_DISGUISED"  // Masked as municipal utility / loadshedding notifications
  | "CONFIDENTIAL"     // Only visible inside Safe Haven dashboard, never in decoy mode
  | "FULL_ALERTS";     // Audible / visible emergency push + toasts

export interface NotificationChannelControl {
  enableGuardianArrivalAlerts: boolean;
  enableJourneyDeviationAlerts: boolean;
  enableOfflineMapExpiryAlerts: boolean;
  enableEmergencyDispatchAcks: boolean;
  enableLegalVaultExportAlerts: boolean;
  deliveryLevel: SafetyNotificationLevel;
  disguiseAsUtilityText: boolean; // Replaces emergency text with PowerCalc utility statements
}

export const DEFAULT_NOTIFICATION_CONTROLS: NotificationChannelControl = {
  enableGuardianArrivalAlerts: true,
  enableJourneyDeviationAlerts: true,
  enableOfflineMapExpiryAlerts: true,
  enableEmergencyDispatchAcks: true,
  enableLegalVaultExportAlerts: true,
  deliveryLevel: "CONFIDENTIAL",
  disguiseAsUtilityText: true,
};

const STORAGE_KEY = "umkhuseli_notification_preferences";
const SUPPRESS_PANIC_SESSION_KEY = "umkhuseli_suppress_panic_flag";

/**
 * Loads user notification safety preferences from persistent local storage.
 */
export function getNotificationControls(): NotificationChannelControl {
  if (typeof window === "undefined" || !window.localStorage) {
    return DEFAULT_NOTIFICATION_CONTROLS;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_CONTROLS;
    return { ...DEFAULT_NOTIFICATION_CONTROLS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_NOTIFICATION_CONTROLS;
  }
}

/**
 * Saves user notification safety preferences.
 */
export function saveNotificationControls(controls: NotificationChannelControl): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(controls));
  } catch (e) {
    console.warn("Failed to persist notification controls:", e);
  }
}

/**
 * Disguises sensitive alert text if user is in an unsafe environment
 * or has requested disguised utility text.
 */
export function sanitizeAlertTextForSafety(
  title: string,
  message: string,
  level: SafetyNotificationLevel = "CONFIDENTIAL",
  forceDisguise: boolean = false
): { title: string; message: string; isDisguised: boolean } {
  if (level === "ULTRA_DISCREET") {
    return {
      title: "Utility Notice",
      message: "STS balance verified.",
      isDisguised: true,
    };
  }

  if (level === "DECOY_DISGUISED" || forceDisguise) {
    // Generate authentic PowerCal SA utility messages
    if (title.toLowerCase().includes("sos") || title.toLowerCase().includes("distress") || title.toLowerCase().includes("beacon")) {
      return {
        title: "PowerCal SA: Grid Telemetry",
        message: "Municipal tariff profile synchronized successfully.",
        isDisguised: true,
      };
    }
    if (title.toLowerCase().includes("arrival") || title.toLowerCase().includes("journey")) {
      return {
        title: "PowerCal SA: Service Zone",
        message: "Selected sub-station coverage area verified.",
        isDisguised: true,
      };
    }
    if (title.toLowerCase().includes("vault") || title.toLowerCase().includes("form 2") || title.toLowerCase().includes("legal")) {
      return {
        title: "PowerCal SA: Statement Export",
        message: "Municipal billing schedule exported to device storage.",
        isDisguised: true,
      };
    }
    return {
      title: "PowerCal SA",
      message: "System operational.",
      isDisguised: true,
    };
  }

  return { title, message, isDisguised: false };
}

/**
 * Temporarily flags window/document events to prevent permission dialogs
 * or system notification prompt focus loss from triggering the 0ms panic exit.
 */
let panicSuppressionTimer: any = null;

export function beginPermissionActionGuard(durationMs: number = 25000): void {
  if (typeof window !== "undefined") {
    (window as any).__umkhuseli_suppress_panic = true;
    try {
      sessionStorage.setItem(SUPPRESS_PANIC_SESSION_KEY, "true");
    } catch {}
    
    if (panicSuppressionTimer) clearTimeout(panicSuppressionTimer);
    panicSuppressionTimer = setTimeout(() => {
      endPermissionActionGuard();
    }, durationMs);
  }
}

export function endPermissionActionGuard(): void {
  if (typeof window !== "undefined") {
    (window as any).__umkhuseli_suppress_panic = false;
    try {
      sessionStorage.removeItem(SUPPRESS_PANIC_SESSION_KEY);
    } catch {}
    if (panicSuppressionTimer) {
      clearTimeout(panicSuppressionTimer);
      panicSuppressionTimer = null;
    }
  }
}

export function isPanicExitSuppressed(): boolean {
  if (typeof window === "undefined") return false;
  if ((window as any).__umkhuseli_suppress_panic === true) return true;
  try {
    return sessionStorage.getItem(SUPPRESS_PANIC_SESSION_KEY) === "true";
  } catch {
    return false;
  }
}
