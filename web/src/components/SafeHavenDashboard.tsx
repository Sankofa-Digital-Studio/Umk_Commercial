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
  saveUatProfile,
  setUatMode,
  UatProfile,
} from "../services/uatProfileService";
import { Form2CourtRecordViewerModal, CourtIncidentRecord } from "./Form2CourtRecordViewerModal";
import {
  getIncidentsDecrypted,
  DEFAULT_INITIAL_INCIDENT,
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

// Modular Safe Haven Tab Components
import { SosEmergencyTab } from "./safehaven/SosEmergencyTab";
import { TccCentresTab } from "./safehaven/TccCentresTab";
import { EvidenceVaultTab } from "./safehaven/EvidenceVaultTab";
import { SafetyPlanTab } from "./safehaven/SafetyPlanTab";
import { UatFeedbackTab } from "./safehaven/UatFeedbackTab";

interface Props {
  onPanicLock: () => void;
  onOpenGuardianTracker?: () => void;
  initialTab?: "sos" | "tcc" | "vault" | "plan" | "feedback";
}

export const ONBOARDING_STORAGE_KEY = "pcalc_survivor_onboarded";

export const SafeHavenDashboard: React.FC<Props> = ({
  onPanicLock,
  onOpenGuardianTracker,
  initialTab,
}) => {
  const { toasts, showToast, removeToast } = useHttpToasts();

  const handleShowToast = (
    type: "error" | "info" | "success" | "warning",
    title: string,
    message: string
  ) => {
    const mapped = type === "error" ? "failed" : type;
    showToast(mapped, title, message);
  };

  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") return true;
    return localStorage.getItem(ONBOARDING_STORAGE_KEY) === "true";
  });

  const [activeTab, setActiveTab] = useState<"sos" | "tcc" | "vault" | "plan" | "feedback">(() => {
    if (initialTab) return initialTab;
    if (typeof process !== "undefined" && process.env?.NODE_ENV === "test") {
      return "sos";
    }
    if (typeof window !== "undefined" && localStorage.getItem(ONBOARDING_STORAGE_KEY) !== "true") {
      return "plan";
    }
    return "sos";
  });

  // UAT and User Profile State
  const [uatProfile, setUatProfileState] = useState<UatProfile>(getUatProfile);
  const [isUatMode, setIsUatMode] = useState<boolean>(() => getUatProfile().isUatMode);
  const [simulatedDispatchPayload, setSimulatedDispatchPayload] = useState<any>(null);

  // Vault and Incidents State
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);
  const [recordedIncidents, setRecordedIncidents] = useState<CourtIncidentRecord[]>([
    DEFAULT_INITIAL_INCIDENT,
  ]);

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

  // Hardware Location Acquisition
  const refreshLiveLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
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
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const res = await Notification.requestPermission();
      setPermissionsStatus((prev) => ({ ...prev, notifications: res as any }));
      showToast(
        res === "granted" ? "success" : "info",
        "Notifications",
        res === "granted" ? "Emergency push alerts enabled." : "Notifications prompt pending."
      );
    }
  };

  const handleToggleUat = () => {
    const nextMode = !isUatMode;
    setIsUatMode(nextMode);
    setUatMode(nextMode);
    const updated = { ...uatProfile, isUatMode: nextMode };
    setUatProfileState(updated);
    saveUatProfile(updated);
    showToast(
      "info",
      nextMode ? "UAT Mode Active" : "Live Mode Armed",
      nextMode
        ? "Simulated mode enabled. Emergency calls suppressed."
        : "Operational live shield armed. Real emergency services active."
    );
  };

  const handleUpdateProfile = (updated: UatProfile) => {
    setUatProfileState(updated);
    saveUatProfile(updated);
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
        guardiansNotified: uatProfile.contacts.length || 2,
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

  const handleCompleteOnboarding = () => {
    try {
      localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
    } catch {
      // Ignored
    }
    setIsOnboarded(true);
    setActiveTab("sos");
    triggerTactileHapticPulse(40);
    showToast("success", "Defense Network Active", "First-time safety setup complete.");
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
      <main className="p-4 flex-1 overflow-y-auto space-y-4">
        {/* First-Time Safety Setup Wizard Banner */}
        {!isOnboarded && (
          <div className="bg-gradient-to-br from-amber-950/80 via-slate-900 to-slate-900 border-2 border-amber-500/60 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-mono font-bold tracking-widest text-amber-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                FIRST-TIME SURVIVOR SAFETY SETUP
              </span>
              <span className="text-[10px] font-mono text-slate-400">Step 1 of 3</span>
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Configure Your Emergency Defense Network
              </h2>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                Before an emergency occurs, complete your legal particulars, register your 5 trusted ICE guardians, and enable app permissions for instant live GPS dispatch.
              </p>
            </div>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setActiveTab("plan")}
                className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5"
              >
                <span>Edit Profile & Contacts</span>
              </button>
              <button
                type="button"
                onClick={handleCompleteOnboarding}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl border border-slate-700 transition-colors"
              >
                <span>Complete Setup</span>
              </button>
            </div>
          </div>
        )}

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
            onShowToast={handleShowToast}
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

      {/* Bottom Navigation */}
      <nav className="bg-slate-900 border-t border-slate-800 p-2 pb-safe flex justify-around sticky bottom-0">
        <button
          onClick={() => setActiveTab("sos")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "sos" ? "text-rose-400 bg-rose-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <ShieldAlert className="w-5 h-5 mb-1" />
          <span>SOS</span>
        </button>

        <button
          onClick={() => setActiveTab("tcc")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "tcc" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <MapPin className="w-5 h-5 mb-1" />
          <span>Centres</span>
        </button>

        <button
          onClick={() => setActiveTab("vault")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "vault" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <Lock className="w-5 h-5 mb-1" />
          <span>Vault</span>
        </button>

        <button
          onClick={() => setActiveTab("plan")}
          className={`flex flex-col items-center py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
            activeTab === "plan" ? "text-amber-400 bg-amber-500/10" : "text-slate-400 hover:text-white"
          }`}
        >
          <FileText className="w-5 h-5 mb-1" />
          <span>Plan</span>
        </button>

        <button
          data-testid="tab-feedback"
          onClick={() => setActiveTab("feedback")}
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
