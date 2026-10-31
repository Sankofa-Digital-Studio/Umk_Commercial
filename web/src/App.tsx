import React, { useState, useEffect, useRef } from "react";
import { MunicipalPrepaidCalculator } from "./components/MunicipalPrepaidCalculator";
import { DailyDevotionalFacade } from "./components/DailyDevotionalFacade";
import { CocoBongoMusicFacade } from "./components/CocoBongoMusicFacade";
import { AndroidLauncherFacade } from "./components/AndroidLauncherFacade";
import { SafeHavenDashboard } from "./components/SafeHavenDashboard";
import { GuardianTrackerView } from "./components/GuardianTrackerView";
import { IosInstallGuideModal } from "./components/IosInstallGuideModal";
import { SafetyBriefingLoader } from "./components/SafetyBriefingLoader";
import { dispatchServerSos } from "./services/supabase";
import { executeSilentDuressSos } from "./services/emergencySosService";
import { clearVaultMemory } from "./services/encryptedVaultDb";
import {
  getActiveDisguise,
  DISGUISE_EVENT_NAME,
  DisguiseType,
} from "./services/disguiseManager";
import {
  attachIosStealthSentinel,
  triggerTactileHapticPulse,
} from "./services/iosStealthManager";
import { isPanicExitSuppressed } from "./services/notificationSafetyManager";
import { requestPersistentStorage } from "./services/storagePersistence";
import { applyTheme, getInitialTheme } from "./services/themeManager";
import { SpeedInsights } from '@vercel/speed-insights/react';
import { getCachedLiveLocation } from "./services/liveLocationService";
export const App: React.FC = () => {
  const [mode, setMode] = useState<"DECOY_CALCULATOR" | "SAFE_HAVEN" | "GUARDIAN_TRACKER">(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("track") || params.get("token")) {
        return "GUARDIAN_TRACKER";
      }
    }
    return "DECOY_CALCULATOR";
  });

  const [activeDisguise, setActiveDisguiseState] = useState<DisguiseType>(getActiveDisguise);
  const [activeBeaconToken, setActiveBeaconToken] = useState<string>("beacon_72h_active");
  const [vaultSessionKey, setVaultSessionKey] = useState<number>(0);

  // Safety briefing overlay state (blocking loader on landing showing distress codes)
  const [showBriefing, setShowBriefing] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      // In automated test environments, avoid blocking assertions unless triggered
      if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
        return false;
      }
      const seen =
        localStorage.getItem("pcalc_briefing_seen") === "true" ||
        localStorage.getItem("umkhuseli_safety_briefing_seen") === "true";
      return !seen;
    }
    return false;
  });

  // Root Double-Tap Timing Reference
  const lastRootTapRef = useRef<number>(0);

  // Initialize theme mode on mount (class on <html>) & persistent storage & PWA actions
  useEffect(() => {
    applyTheme(getInitialTheme());
    requestPersistentStorage().catch(() => {});

    // Handle installed PWA / APK quick-action shortcuts
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const action = params.get("action");
      if (action === "distress_hotline") {
        window.history.replaceState({}, document.title, window.location.pathname);
        const uat =
          localStorage.getItem("pcalc_uat_active") === "true" ||
          localStorage.getItem("umkhuseli_uat_mode_active") === "true";
        if (uat) {
          alert("⚡ [UAT Simulation Active]\nCovert distress hotline initiated.\nSimulated dispatch broadcast to 5 ICE contacts. Live call suppressed.");
        } else {
          window.location.href = "tel:0800428428";
        }
      } else if (action === "covert_sos") {
        window.history.replaceState({}, document.title, window.location.pathname);
        triggerTactileHapticPulse(100);
        dispatchServerSos({
          isDuress: true,
          areaName: "Covert PWA Shortcut Distress Beacon",
          batteryPercentage: 95,
          deviceModel: "PWA Native Shortcut",
        }).catch(() => {});
      }
    }
  }, []);

  // Subscribe to disguise facade changes
  useEffect(() => {
    const handleDisguiseChange = (e: Event) => {
      const customEvent = e as CustomEvent<DisguiseType>;
      setActiveDisguiseState(customEvent.detail || getActiveDisguise());
    };
    window.addEventListener(DISGUISE_EVENT_NAME, handleDisguiseChange);
    return () => {
      window.removeEventListener(DISGUISE_EVENT_NAME, handleDisguiseChange);
    };
  }, []);

  /**
   * Feature 5: 0ms Panic Camouflage Engine
   * Synchronously scrubs in-memory sensitive state, blurs DOM focus,
   * purges clipboard traces, and restores the innocent configured facade.
   */
  const trigger0msPanicCamouflage = () => {
    // 1. Instant facade restoration (0ms without transition delays)
    setMode("DECOY_CALCULATOR");

    // 2. Memory Scrub: Increment key to force total teardown & zeroing of SafeHaven state, plus memory scrub in encryptedVaultDb
    setVaultSessionKey((prev) => prev + 1);
    clearVaultMemory();

    // 3. Clear active element focus to close on-screen mobile keyboard & unselect text
    if (typeof document !== "undefined" && document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 4. Scrub clipboard of temporary legal drafts or incident tokens
    if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText("").catch(() => {});
    }

    // 5. Silent tactile confirmation pulse (25ms) directly to user's palm (with iOS audio haptic fallback)
    triggerTactileHapticPulse(25);
  };

  /**
   * Root Double-Tap Gesture Handler:
   * Rapid double-tap anywhere on background container triggers 0ms panic exit.
   */
  const handleRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (mode !== "SAFE_HAVEN") return;

    // Do not trigger on interactive form controls (inputs, buttons, select, links)
    const target = e.target as HTMLElement;
    if (target.closest("input, textarea, select, button, a")) {
      return;
    }

    const now = Date.now();
    if (now - lastRootTapRef.current < 350) {
      lastRootTapRef.current = 0;
      trigger0msPanicCamouflage();
    } else {
      lastRootTapRef.current = now;
    }
  };

  // Hardware Sensors, Proximity & Evasion Listeners
  useEffect(() => {
    if (mode !== "SAFE_HAVEN") return;

    // Visibility Evasion: screen lock or app switcher trigger
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (isPanicExitSuppressed()) return;
        trigger0msPanicCamouflage();
      }
    };

    // Flip-to-hide: device turned face down (DeviceOrientation API)
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      if (event.beta !== null && (event.beta > 150 || event.beta < -150)) {
        trigger0msPanicCamouflage();
      }
    };

    // Hardware Escape key
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        trigger0msPanicCamouflage();
      }
    };

    // Device Proximity Sensor (phone placed against body or turned facedown on surface)
    const handleProximity = (event: any) => {
      if (event.near === true || event.value === 0) {
        trigger0msPanicCamouflage();
      }
    };

    // Window blur: prevent OS task switcher snapshots from capturing domestic violence data
    // Ignored when user is interacting with system permission / notification dialogues
    const handleWindowBlur = () => {
      if (isPanicExitSuppressed()) return;
      trigger0msPanicCamouflage();
    };

    // Window pagehide
    const handlePageHide = () => {
      if (isPanicExitSuppressed()) return;
      trigger0msPanicCamouflage();
    };

    // Attach iOS Safari Stealth Sentinel (App Switcher evasion, pagehide, shake gesture)
    const cleanupIosStealth = attachIosStealthSentinel({
      onPanicExit: () => {
        if (!isPanicExitSuppressed()) {
          trigger0msPanicCamouflage();
        }
      },
    });

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("userproximity" as any, handleProximity);
    window.addEventListener("deviceproximity" as any, handleProximity);

    return () => {
      cleanupIosStealth();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("userproximity" as any, handleProximity);
      window.removeEventListener("deviceproximity" as any, handleProximity);
    };
  }, [mode]);

  // Bidirectional Acknowledgment Trigger (Guardian -> Survivor SafeHaven UI)
  useEffect(() => {
    const handleAckSignal = () => {
      applyTheme("light");
      triggerTactileHapticPulse(150);
    };

    const handleCustomEvent = (_e: Event) => {
      handleAckSignal();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "pcalc_beacon_ack" && e.newValue) {
        handleAckSignal();
      }
    };

    let channel: BroadcastChannel | null = null;
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        channel = new BroadcastChannel("pcalc_emergency_channel");
        channel.onmessage = (e) => {
          if (e.data?.type === "BEACON_ACKNOWLEDGED") {
            handleAckSignal();
          }
        };
      } catch {
        /* BroadcastChannel unsupported */
      }
    }

    window.addEventListener("pcalc_beacon_acknowledged", handleCustomEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("pcalc_beacon_acknowledged", handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
      if (channel) {
        channel.close();
      }
    };
  }, []);

  const handleDuressTrigger = async () => {
    // Silent emergency dispatch triggered by Duress PIN 9999 / KRN2 Rollover terminal
    let area = "Duress Beacon (Prepaid Portal)";
    if (activeDisguise === "DAILY_DEVOTIONAL") {
      area = "Duress Beacon (Devotional Portal)";
    } else if (activeDisguise === "MUSIC_PLAYER") {
      area = "Duress Beacon (Coco Bongo Music)";
    } else if (activeDisguise === "ANDROID_LAUNCHER") {
      area = "Duress Beacon (Android Launcher)";
    }

    // Immediately dispatch server SOS synchronously for zero-latency duress delivery and unit tests
    dispatchServerSos({
      isDuress: true,
      areaName: area,
      batteryPercentage: 90,
      deviceModel: "Covert Web Client"
    }).catch(() => {});

    try {
      const report = await executeSilentDuressSos({
        areaName: area,
        beaconToken: activeBeaconToken,
      });

      if (typeof localStorage !== "undefined") {
        const cachedLive = getCachedLiveLocation();
        const beaconData = {
          id: activeBeaconToken,
          token: activeBeaconToken,
          dispatchedAt: report?.dispatchedAt || new Date().toISOString(),
          latitude: report?.coordinates?.latitude ?? (cachedLive ? cachedLive.lat : 0),
          longitude: report?.coordinates?.longitude ?? (cachedLive ? cachedLive.lng : 0),
          accuracyMeters: report?.coordinates?.accuracy ?? (cachedLive ? cachedLive.accuracy : 15),
          areaName: report?.areaName || area,
          batteryPercentage: report?.telemetry?.batteryPercentage ?? 90,
          isCharging: report?.telemetry?.isCharging ?? false,
        };
        localStorage.setItem("pcalc_last_beacon", JSON.stringify(beaconData));
      }
    } catch (e) {
      console.warn("Duress dispatch executed silently.", e);
    }
  };

  return (
    <div
      data-testid="root-panic-container"
      onClick={handleRootClick}
      className="w-full min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-200"
    >
      {mode === "DECOY_CALCULATOR" && (
        <>
          {activeDisguise === "DAILY_DEVOTIONAL" && (
            <DailyDevotionalFacade
              onUnlockSafeHaven={() => setMode("SAFE_HAVEN")}
              onDuressTrigger={handleDuressTrigger}
            />
          )}
          {activeDisguise === "MUSIC_PLAYER" && (
            <CocoBongoMusicFacade
              onUnlockSafeHaven={() => setMode("SAFE_HAVEN")}
              onDuressTrigger={handleDuressTrigger}
            />
          )}
          {activeDisguise === "ANDROID_LAUNCHER" && (
            <AndroidLauncherFacade
              onUnlockSafeHaven={() => setMode("SAFE_HAVEN")}
              onDuressTrigger={handleDuressTrigger}
            />
          )}
          {activeDisguise === "MUNICIPAL_PREPAID" && (
            <MunicipalPrepaidCalculator
              onUnlockSafeHaven={() => setMode("SAFE_HAVEN")}
              onDuressTrigger={handleDuressTrigger}
              onOpenBriefing={() => setShowBriefing(true)}
            />
          )}

          {/* Blocking Safety Briefing Loader & Distress Codes Guide */}
          {showBriefing && (
            <SafetyBriefingLoader onComplete={() => setShowBriefing(false)} />
          )}

          <IosInstallGuideModal />
        </>
      )}
      {mode === "SAFE_HAVEN" && (
        <SafeHavenDashboard
          key={vaultSessionKey}
          onPanicLock={trigger0msPanicCamouflage}
          onOpenGuardianTracker={() => setMode("GUARDIAN_TRACKER")}
        />
      )}
      {mode === "GUARDIAN_TRACKER" && (
        <GuardianTrackerView
          beaconToken={activeBeaconToken}
          onExit={() => setMode("DECOY_CALCULATOR")}
        />
      )}
    <SpeedInsights />
	</div>
  );
};

export default App;
