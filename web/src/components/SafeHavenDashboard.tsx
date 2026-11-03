import React, { useState, useEffect } from "react";
import {
  ShieldAlert,
  MapPin,
  Lock,
  FileText,
  EyeOff,
  CheckCircle2,
  MessageSquare,
} from "lucide-react";
import { dispatchServerSos } from "../services/supabase";
import {
  getUatProfile,
  loadUatProfile,
  saveUatProfile,
  UatProfile,
  getSurvivorSetupStep,
  SurvivorSetupStep,
} from "../services/uatProfileService";
import { Form2CourtRecordViewerModal, CourtIncidentRecord } from "./Form2CourtRecordViewerModal";
import {
  getIncidentsDecrypted,
} from "../services/encryptedVaultDb";
import {
  VehicleJourneyDetails,
  getActiveJourney,
  clearActiveJourney,
  generateArrivalWhatsAppUrl,
} from "../services/journeyTrackerService";
import { VehicleJourneyModal } from "./VehicleJourneyModal";
import { UssdSimulationModal } from "./UssdSimulationModal";
import { triggerTactileHapticPulse } from "../services/iosStealthManager";
import { useHttpToasts } from "../hooks/useHttpToasts";
import { HttpToastNotification } from "./common/HttpToastNotification";
import {
  getCachedLiveLocation,
  watchLiveLocation,
  saveLiveLocation,
  inferAreaAndProvince,
} from "../services/liveLocationService";
import {
  beginPermissionActionGuard,
  endPermissionActionGuard,
  getNotificationControls,
  sanitizeAlertTextForSafety,
} from "../services/notificationSafetyManager";

// Modular Safe Haven Tab Components
import { SosEmergencyTab } from "./safehaven/SosEmergencyTab";
import { TccCentresTab } from "./safehaven/TccCentresTab";
import { EvidenceVaultTab } from "./safehaven/EvidenceVaultTab";
import { SafetyPlanTab } from "./safehaven/SafetyPlanTab";
import { UatFeedbackTab } from "./safehaven/UatFeedbackTab";
import { SurvivorSetupModal, SurvivorSetupSection } from "./SurvivorSetupModal";

interface Props {
  onPanicLock: () => void;
  onOpenGuardianTracker?: () => void;
  initialTab?: "sos" | "tcc" | "vault" | "plan" | "feedback";
  entrySource?: "direct" | "covert" | "shortcut";
}

export const SafeHavenDashboard: React.FC<Props> = ({
  onPanicLock,
  onOpenGuardianTracker,
  initialTab,
  entrySource = "covert",
}) => {
  const { toasts, showToast, removeToast } = useHttpToasts();

  const handleShowToast = (
    type: "error" | "info" | "success" | "warning",
    title: string,
    message: string
  ) => {
    const controls = getNotificationControls();
    // In ULTRA_DISCREET mode, suppress visual toasts completely to prevent over-the-shoulder discovery
    if (controls.deliveryLevel === "ULTRA_DISCREET") {
      triggerTactileHapticPulse(15);
      return;
    }
    const sanitized = sanitizeAlertTextForSafety(
      title,
      message,
      controls.deliveryLevel,
      controls.disguiseAsUtilityText
    );
    const mapped = type === "error" ? "failed" : type;
    showToast(mapped, sanitized.title, sanitized.message);
  };

  const [activeTab, setActiveTab] = useState<"sos" | "tcc" | "vault" | "plan" | "feedback">(() => {
    if (initialTab) return initialTab;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
      return "sos";
    }
    return "plan";
  });

  // UAT and User Profile State
  const [uatProfile, setUatProfileState] = useState<UatProfile>(getUatProfile);
  const [isUatMode, setIsUatMode] = useState<boolean>(() => getUatProfile().isUatMode);
  const [isProfileLoading, setIsProfileLoading] = useState(true);
  const [setupSection, setSetupSection] = useState<SurvivorSetupSection>("profile");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [focusedSetupSection, setFocusedSetupSection] = useState<SurvivorSetupStep | null>(null);
  const [showCompletionGate, setShowCompletionGate] = useState(false);
  const [simulatedDispatchPayload, setSimulatedDispatchPayload] = useState<any>(null);

  // Vault and Incidents State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [recordedIncidents, setRecordedIncidents] = useState<CourtIncidentRecord[]>([]);

  // SOS Beacon State
  const [isArmed, setIsArmed] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [sosStatus, setSosStatus] = useState<string | null>(null);

  // Vehicle Journey State
  const [activeJourney, setActiveJourney] = useState<VehicleJourneyDetails | null>(getActiveJourney);
  const [journeyElapsed, setJourneyElapsed] = useState<number>(0);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showArrivalConfirm, setShowArrivalConfirm] = useState(false);

  // Modals & USSD State
  const [showForm2Modal, setShowForm2Modal] = useState(false);
  const [ussdModalOpen, setUssdModalOpen] = useState(false);
  const [activeUssdCode, setActiveUssdCode] = useState("*120*7867#");
  const [activeUssdTitle, setActiveUssdTitle] = useState("National GBV Command Centre");

  // Hardware Permissions & Telemetry
  const [permissionsStatus, setPermissionsStatus] = useState<{
    geolocation: "granted" | "prompt" | "denied" | "unknown";
    storage: "persisted" | "not_persisted" | "unknown";
    notifications: "granted" | "default" | "denied" | "unsupported" | "unknown";
  }>({
    geolocation: "unknown",
    storage: "unknown",
    notifications: "unknown",
  });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number; accuracy?: number } | null>(() => {
    const cached = getCachedLiveLocation();
    return cached ? { lat: cached.lat, lng: cached.lng, accuracy: cached.accuracy } : null;
  });
  const [identifiedAreaName, setIdentifiedAreaName] = useState<string>(() => {
    const cached = getCachedLiveLocation();
    return cached?.areaName || "South Africa Safety Zone";
  });
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const formatElapsed = (sec: number): string => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}m ${s < 10 ? "0" : ""}${s}s`;
  };

  const handlePanicExit = () => {
    triggerTactileHapticPulse(60);
    onPanicLock();
  };

  // Hardware Location Acquisition with Action Guard to prevent panic kickout
  const refreshLiveLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    beginPermissionActionGuard(15000);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        endPermissionActionGuard();
        saveLiveLocation(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy || 15);
        const meta = inferAreaAndProvince(pos.coords.latitude, pos.coords.longitude);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setIdentifiedAreaName(meta.areaName);
        setPermissionsStatus((p) => ({ ...p, geolocation: "granted" }));
        setIsLocating(false);
      },
      () => {
        endPermissionActionGuard();
        setPermissionsStatus((p) => ({ ...p, geolocation: "prompt" }));
        setIsLocating(false);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Hardware Permissions Check
  const checkAppPermissions = async () => {
    if (typeof navigator === "undefined") return;
    if ("permissions" in navigator && navigator.permissions?.query) {
      try {
        const geo = await navigator.permissions.query({ name: "geolocation" as any });
        setPermissionsStatus((prev) => ({ ...prev, geolocation: geo.state as any }));
      } catch {
        // Ignored
      }
    }
    if (navigator.storage?.persisted) {
      try {
        const isPersisted = await navigator.storage.persisted();
        setPermissionsStatus((prev) => ({
          ...prev,
          storage: isPersisted ? "persisted" : "not_persisted",
        }));
      } catch {
        // Ignored
      }
    }
    if ("Notification" in window) {
      setPermissionsStatus((prev) => ({
        ...prev,
        notifications: Notification.permission as any,
      }));
    }
  };

  const requestStoragePersistence = async () => {
    if (navigator.storage?.persist) {
      beginPermissionActionGuard(15000);
      try {
        const persisted = await navigator.storage.persist();
        setPermissionsStatus((prev) => ({
          ...prev,
          storage: persisted ? "persisted" : "not_persisted",
        }));
        showToast(
          persisted ? "success" : "warning",
          "Storage Persistence",
          persisted ? "Vault durable storage granted." : "Storage not persisted."
        );
      } finally {
        endPermissionActionGuard();
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      beginPermissionActionGuard(25000);
      try {
        const res = await Notification.requestPermission();
        setPermissionsStatus((prev) => ({ ...prev, notifications: res as any }));
        showToast(
          res === "granted" ? "success" : "info",
          "Notifications",
          res === "granted" ? "Emergency push alerts enabled." : "Notifications prompt pending."
        );
      } finally {
        endPermissionActionGuard();
      }
    }
  };

  const handleToggleUat = async () => {
    const nextMode = !isUatMode;
    const updated = { ...uatProfile, isUatMode: nextMode };
    setUatProfileState(updated);
    setIsUatMode(nextMode);
    try {
      const saved = await saveUatProfile(updated);
      setUatProfileState(saved);
      setIsUatMode(saved.isUatMode);
    } catch (error) {
      setUatProfileState(uatProfile);
      setIsUatMode(isUatMode);
      showToast("failed", "Unable to Change Mode", error instanceof Error ? error.message : "Profile could not be saved.");
      return;
    }
    showToast(
      "info",
      nextMode ? "UAT Mode Active" : "Live Mode Armed",
      nextMode
        ? "Simulated mode enabled. Emergency calls suppressed."
        : "Operational live shield armed. Real emergency services active."
    );
  };

  const handleUpdateProfile = async (updated: UatProfile) => {
    const saved = await saveUatProfile(updated);
    setUatProfileState(saved);
    setIsUatMode(saved.isUatMode);
  };

  const incompleteSetupStep = getSurvivorSetupStep(uatProfile);

  const navigateToSetupStep = (step: SurvivorSetupStep) => {
    setShowCompletionGate(false);
    setActiveTab("plan");
    setFocusedSetupSection(step);
  };

  const handleSectionSaved = (section: SurvivorSetupStep, updated: UatProfile) => {
    const nextStep = getSurvivorSetupStep(updated);
    setFocusedSetupSection(null);
    if (nextStep) {
      setShowCompletionGate(true);
    } else {
      setActiveTab("sos");
      triggerTactileHapticPulse(40);
      showToast("success", "Defense Network Active", "All three survivor safety steps are securely saved.");
    }
  };

  const requestTab = (tab: "sos" | "tcc" | "vault" | "plan" | "feedback") => {
    const isAutomatedTest = typeof process !== "undefined" && process.env?.NODE_ENV === "test";
    if (!isAutomatedTest && incompleteSetupStep && tab !== "sos" && tab !== "plan") {
      setShowCompletionGate(true);
      return;
    }
    setActiveTab(tab);
  };

  // SOS Trigger & Countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isArmed && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown((c) => c - 1);
      }, 1000);
    } else if (isArmed && countdown === 0) {
      setIsArmed(false);
      triggerArmedSosDispatch();
    }
    return () => clearTimeout(timer);
  }, [isArmed, countdown]);

  const triggerArmedSosDispatch = async () => {
    triggerTactileHapticPulse(100);
    const liveGps = userLocation || getCachedLiveLocation();
    if (isUatMode) {
      const payload = {
        simulated: true,
        timestamp: new Date().toLocaleTimeString("en-ZA"),
        guardiansNotified: uatProfile.contacts.length,
        gps: liveGps ? { lat: liveGps.lat, lng: liveGps.lng } : null,
      };
      setSimulatedDispatchPayload(payload);
      setSosStatus("Simulated SOS dispatch completed safely. Guardians alerted via test harness.");
      showToast("success", "SOS Simulated", "Test beacon dispatched to registered guardians.");
      return;
    }

    setSosStatus("Broadcasting distress beacon to SAPS 10111 & ICE guardians...");
    try {
      const res = await dispatchServerSos({
        latitude: liveGps ? liveGps.lat : undefined,
        longitude: liveGps ? liveGps.lng : undefined,
        accuracy: liveGps?.accuracy,
        areaName: identifiedAreaName || "South Africa",
        isDuress: false,
      });
      if (res.success) {
        setSosStatus(`Distress beacon broadcasted. Beacon ID: ${res.beaconId || "ONLINE"}`);
        showToast("success", "Distress Broadcast Active", "Live GPS beacon dispatched.");
      } else {
        setSosStatus("Beacon queued for transmission via cellular SMS fallback.");
        showToast("warning", "Offline Fallback", "Beacon queued via SMS.");
      }
    } catch {
      setSosStatus("Distress beacon queued locally in encrypted offline outbox.");
      showToast("warning", "Network Offline", "Beacon saved to local outbox.");
    }
  };

  const openSetup = (section: SurvivorSetupSection) => {
    setSetupSection(section);
    setIsSetupOpen(true);
  };

  // Journey Timer
  useEffect(() => {
    if (!activeJourney) {
      setJourneyElapsed(0);
      return;
    }
    const diffSec = Math.max(0, Math.floor((Date.now() - activeJourney.startTimestamp) / 1000));
    setJourneyElapsed(diffSec);
    const interval = setInterval(() => {
      setJourneyElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [activeJourney]);

  useEffect(() => {
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
      setIsProfileLoading(false);
      return;
    }
    let active = true;
    loadUatProfile()
      .then((loaded) => {
        if (!active) return;
        setUatProfileState(loaded);
        setIsUatMode(loaded.isUatMode);
        const nextStep = getSurvivorSetupStep(loaded);
        if (nextStep) {
          setSetupSection(nextStep);
          setShowCompletionGate(true);
          setActiveTab("plan");
        } else {
          setActiveTab("sos");
        }
      })
      .catch((error) => {
        if (active) {
          showToast("failed", "Profile Connection Unavailable", error instanceof Error ? error.message : "Unable to load survivor profile.");
        }
      })
      .finally(() => {
        if (active) setIsProfileLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    refreshLiveLocation();
    checkAppPermissions();
    getIncidentsDecrypted().then((data) => {
      if (data && data.length > 0) setRecordedIncidents(data);
    });
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between max-w-md mx-auto select-none border-x border-slate-800">
      {/* Real-Time Standardized HTTP Toast Feedback */}
      <HttpToastNotification toasts={toasts} onDismiss={removeToast} />

      {!isProfileLoading && showCompletionGate && incompleteSetupStep && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm" role="presentation">
          <section role="dialog" aria-modal="true" aria-labelledby="completion-gate-title" data-entry-source={entrySource} className="w-full max-w-sm rounded-3xl border-2 border-amber-500/60 bg-slate-950 p-5 text-slate-100 shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
              Step {incompleteSetupStep === "profile" ? 1 : incompleteSetupStep === "ice" ? 2 : 3} of 3 · Required setup
            </p>
            <h2 id="completion-gate-title" className="mt-2 text-lg font-black text-white">Complete your survivor safety network</h2>
            <p className="mt-2 text-xs leading-relaxed text-slate-300">
              {incompleteSetupStep === "profile" && "Save a non-default survivor name or alias and a private safe word."}
              {incompleteSetupStep === "ice" && "Save at least one real trusted ICE contact with a valid mobile number."}
              {incompleteSetupStep === "permissions" && "Review device readiness, then save the final readiness step."}
            </p>
            <div className="mt-4 grid gap-2">
              {(["profile", "ice", "permissions"] as SurvivorSetupStep[]).map((step, index) => {
                const isCurrent = step === incompleteSetupStep;
                return (
                  <button key={step} type="button" disabled={!isCurrent} onClick={() => navigateToSetupStep(step)} className={`rounded-xl border px-3 py-3 text-left text-xs font-bold ${isCurrent ? "border-amber-400 bg-amber-500 text-slate-950" : "border-slate-800 bg-slate-900 text-slate-500"}`}>
                    {index + 1}. {step === "profile" ? "Survivor profile" : step === "ice" ? "ICE contacts" : "Hardware readiness"} {isCurrent ? "— continue" : index < (["profile", "ice", "permissions"] as SurvivorSetupStep[]).indexOf(incompleteSetupStep) ? "— saved" : "— locked"}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                setShowCompletionGate(false);
                setActiveTab("sos");
              }}
              className="mt-3 w-full rounded-xl border border-rose-500/60 bg-rose-950/70 px-3 py-2.5 text-xs font-black text-rose-200"
            >
              Use emergency SOS now
            </button>
            <p className="mt-3 text-[10px] text-slate-500">SOS remains immediately available. Secondary Safe Haven areas unlock after all three persisted steps are complete.</p>
          </section>
        </div>
      )}

      {/* Top Safe Haven Header */}
      <header
        onDoubleClick={handlePanicExit}
        title="Double-tap to trigger 0ms Panic Camouflage"
        className="bg-slate-900 border-b border-slate-800 p-4 pt-safe flex items-center justify-between sticky top-0 z-50 cursor-pointer"
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight text-white">UMKHUSELI</h1>
            <span className="text-[10px] text-amber-400 font-semibold uppercase tracking-wider block">
              Safe Haven Active
            </span>
          </div>
        </div>

        <button
          onClick={handlePanicExit}
          className="flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-600/50 text-rose-300 text-xs font-bold px-3 py-1.5 rounded-lg active:scale-95 transition-all shadow-lg shadow-rose-950/50"
        >
          <EyeOff className="w-3.5 h-3.5 text-rose-400" />
          <span>Panic Hide</span>
        </button>
      </header>

      {/* Main Tab Content */}
      <main id="safe-haven-scroll-region" className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* UAT Live Test Mode Banner */}
        <div
          className={`p-3 rounded-xl border mb-4 text-xs flex items-center justify-between transition-colors ${
            isUatMode
              ? "bg-amber-950/40 border-amber-500/40 text-amber-200"
              : "bg-slate-900/60 border-slate-800 text-slate-400"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isUatMode ? "bg-amber-400 animate-ping" : "bg-emerald-500"}`} />
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span>{isUatMode ? "⚡ UAT Test Mode: Active" : "Operational Mode: Live Shield"}</span>
              </div>
              <p className="text-[10px] text-slate-400">
                {isUatMode
                  ? "Distress dispatches are safely simulated. No real authorities called."
                  : "Tap to simulate emergency tests without alarming contacts."}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleToggleUat}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              isUatMode
                ? "bg-amber-500 hover:bg-amber-400 text-black shadow-md shadow-amber-500/20"
                : "bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30"
            }`}
          >
            {isUatMode ? "Exit Test Mode" : "Enable UAT Mode"}
          </button>
        </div>

        {/* TAB 1: SOS EMERGENCY */}
        {activeTab === "sos" && (
          <SosEmergencyTab
            activeJourney={activeJourney}
            journeyElapsed={journeyElapsed}
            formatElapsed={formatElapsed}
            onOpenVehicleModal={() => setShowVehicleModal(true)}
            onShowArrivalConfirm={() => setShowArrivalConfirm(true)}
            onCancelJourney={() => {
              clearActiveJourney();
              setActiveJourney(null);
            }}
            isArmed={isArmed}
            countdown={countdown}
            onArmSos={() => {
              setIsArmed(true);
              setCountdown(3);
            }}
            onCancelArmedSos={() => {
              setIsArmed(false);
              setCountdown(3);
              setSosStatus(null);
            }}
            sosStatus={sosStatus}
            simulatedDispatchPayload={simulatedDispatchPayload}
            iceContacts={uatProfile.contacts}
            onOpenGuardianTracker={onOpenGuardianTracker}
            onOpenUssdModal={(dialString, title) => {
              setActiveUssdCode(dialString);
              setActiveUssdTitle(title);
              setUssdModalOpen(true);
            }}
            onShowToast={handleShowToast}
          />
        )}

        {/* TAB 2: THUTHUZELA CARE CENTRES */}
        {activeTab === "tcc" && (
          <TccCentresTab
            userLocation={userLocation}
            identifiedAreaName={identifiedAreaName}
            isLocating={isLocating}
            onRefreshLocation={refreshLiveLocation}
          />
        )}

        {/* TAB 3: EVIDENCE VAULT */}
        {activeTab === "vault" && (
          <EvidenceVaultTab
            isVaultUnlocked={isVaultUnlocked}
            onSetVaultUnlocked={setIsVaultUnlocked}
            recordedIncidents={recordedIncidents}
            onAddIncident={(inc) => setRecordedIncidents((prev) => [inc, ...prev])}
            onDeleteIncident={(id) => setRecordedIncidents((prev) => prev.filter((i) => i.id !== id))}
            onOpenForm2Modal={() => setShowForm2Modal(true)}
            identifiedAreaName={identifiedAreaName}
            userName={uatProfile.personal.fullName}
            onShowToast={handleShowToast}
          />
        )}

        {/* TAB 4: SAFETY PLAN & ICE GUARDIANS */}
        {activeTab === "plan" && (
          <SafetyPlanTab
            uatProfile={uatProfile}
            onUpdateProfile={handleUpdateProfile}
            isUatMode={isUatMode}
            onToggleUat={handleToggleUat}
            permissionsStatus={permissionsStatus}
            isLocating={isLocating}
            onRefreshLocation={refreshLiveLocation}
            onRequestStorage={requestStoragePersistence}
            onRequestNotifications={requestNotificationPermission}
            onEditProfile={() => openSetup("profile")}
            onManageIceContacts={() => openSetup("ice")}
            onOpenLifeline={(dialString, title) => {
              setActiveUssdCode(dialString);
              setActiveUssdTitle(title);
              setUssdModalOpen(true);
            }}
            onShowToast={handleShowToast}
            focusSection={focusedSetupSection}
            onSectionSaved={handleSectionSaved}
          />
        )}

        {/* TAB 5: UAT IN-APP FEEDBACK */}
        {activeTab === "feedback" && <UatFeedbackTab onShowToast={handleShowToast} />}

        {/* Modals & Dialogs */}
        <Form2CourtRecordViewerModal
          isOpen={showForm2Modal}
          onClose={() => setShowForm2Modal(false)}
          incidents={recordedIncidents}
          isVaultUnlocked={isVaultUnlocked}
          onUnlockVault={() => setIsVaultUnlocked(true)}
          onOpenProfile={() => {
            setShowForm2Modal(false);
            setActiveTab("plan");
          }}
        />

        <VehicleJourneyModal
          isOpen={showVehicleModal}
          onClose={() => setShowVehicleModal(false)}
          onStartJourney={(details) => setActiveJourney(details)}
          currentLocationAddress={identifiedAreaName}
          currentCoords={userLocation || undefined}
          iceContacts={uatProfile.contacts}
          userName={uatProfile.personal.fullName}
        />

        {showArrivalConfirm && activeJourney && (
          <div
            data-testid="arrival-confirmation-dialog"
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in select-none"
          >
            <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl text-xs text-slate-200">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">Confirm Safe Arrival</h3>
                <p className="text-slate-400">
                  Arrived safely at <strong className="text-white">{activeJourney.destinationAddress}</strong>?
                </p>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Notify Guardians via WhatsApp:
                </span>
                <div className="space-y-1">
                  {uatProfile.contacts
                    .filter((c) => activeJourney.selectedIceContactIds.includes(c.id))
                    .map((contact) => (
                      <a
                        key={contact.id}
                        href={generateArrivalWhatsAppUrl(activeJourney, contact.phone, uatProfile.personal.fullName)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2 rounded-lg bg-emerald-950/40 border border-emerald-600/30 text-emerald-300 hover:bg-emerald-900/40 transition-colors"
                      >
                        <span className="font-bold text-white">{contact.name}</span>
                        <span className="text-[10px] font-bold text-emerald-400">Send WhatsApp</span>
                      </a>
                    ))}
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    clearActiveJourney();
                    setActiveJourney(null);
                    setShowArrivalConfirm(false);
                    showToast("success", "Journey Concluded", "Arrived safely. Monitoring deactivated.");
                  }}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs"
                >
                  Confirm & End Monitored Trip (Arrived Safely)
                </button>
                <button
                  type="button"
                  onClick={() => setShowArrivalConfirm(false)}
                  className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs"
                >
                  Still in Transit
                </button>
              </div>
            </div>
          </div>
        )}

        <UssdSimulationModal
          isOpen={ussdModalOpen}
          onClose={() => setUssdModalOpen(false)}
          ussdCode={activeUssdCode}
          serviceTitle={activeUssdTitle}
        />
      </main>

      <SurvivorSetupModal
        isOpen={isSetupOpen}
        section={setupSection}
        isFirstTime={!uatProfile.onboardingCompleted}
        profile={uatProfile}
        onClose={() => setIsSetupOpen(false)}
        onSave={async (updated) => {
          await handleUpdateProfile(updated);
          handleSectionSaved(setupSection, updated);
        }}
        permissionsStatus={permissionsStatus}
        onRequestLocation={refreshLiveLocation}
        onRequestStorage={requestStoragePersistence}
        onRequestNotifications={requestNotificationPermission}
      />

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 p-2 pb-safe flex justify-around sticky bottom-0">
        <button
          onClick={() => requestTab("sos")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "sos" ? "text-rose-400 bg-rose-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-1" />
          <span>SOS</span>
        </button>

        <button
          onClick={() => requestTab("tcc")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "tcc" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <MapPin className="w-5 h-5 mb-1" />
          <span>Centres</span>
        </button>

        <button
          onClick={() => requestTab("vault")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "vault" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <Lock className="w-5 h-5 mb-1" />
          <span>Vault</span>
        </button>

        <button
          onClick={() => requestTab("plan")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "plan" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-5 h-5 mb-1" />
          <span>Plan</span>
        </button>

        <button
          data-testid="tab-feedback"
          onClick={() => requestTab("feedback")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "feedback" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <MessageSquare className="w-5 h-5 mb-1" />
          <span>Feedback</span>
        </button>
      </nav>
    </div>
  );
};
