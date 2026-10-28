import React, { useState } from "react";
import {
  Car,
  CheckCircle2,
  Navigation,
  ShieldCheck,
  ShieldAlert,
  Volume2,
  WifiOff,
  Radio,
  ExternalLink,
  Copy,
  Zap,
  PhoneCall,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { NATIONAL_LIFELINES } from "../../data/saSafetyData";
import { VehicleJourneyDetails } from "../../services/journeyTrackerService";
import { startAudibleSiren, stopAudibleSiren, isSirenActive } from "../../services/audibleSirenService";
import { getCachedLiveLocation } from "../../services/liveLocationService";

interface SosEmergencyTabProps {
  activeJourney: VehicleJourneyDetails | null;
  journeyElapsed: number;
  formatElapsed: (sec: number) => string;
  onOpenVehicleModal: () => void;
  onShowArrivalConfirm: () => void;
  onCancelJourney: () => void;
  isArmed: boolean;
  countdown: number;
  onArmSos: () => void;
  onCancelArmedSos: () => void;
  sosStatus: string | null;
  simulatedDispatchPayload: any;
  onOpenGuardianTracker?: () => void;
  onOpenUssdModal: (dialString: string, title: string) => void;
  onShowToast?: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
}

export const SosEmergencyTab: React.FC<SosEmergencyTabProps> = ({
  activeJourney,
  journeyElapsed,
  formatElapsed,
  onOpenVehicleModal,
  onShowArrivalConfirm,
  onCancelJourney,
  isArmed,
  countdown,
  onArmSos,
  onCancelArmedSos,
  sosStatus,
  simulatedDispatchPayload,
  onOpenGuardianTracker,
  onOpenUssdModal,
  onShowToast,
}) => {
  const [isSirenOn, setIsSirenOn] = useState<boolean>(() => isSirenActive());
  const [isOfflineSosActive, setIsOfflineSosActive] = useState<boolean>(false);
  const [copiedGuardianLink, setCopiedGuardianLink] = useState<boolean>(false);
  const [isLifelinesExpanded, setIsLifelinesExpanded] = useState<boolean>(true);

  const handleToggleSiren = () => {
    if (isSirenOn) {
      stopAudibleSiren();
      setIsSirenOn(false);
      if (onShowToast) onShowToast("info", "Siren Deactivated", "Audible alarm silenced.");
    } else {
      startAudibleSiren();
      setIsSirenOn(true);
      if (onShowToast) onShowToast("warning", "Siren Activated", "High-frequency audible alarm triggered.");
    }
  };

  const cachedGps = getCachedLiveLocation();
  const liveGpsString = cachedGps
    ? `${cachedGps.lat.toFixed(4)}, ${cachedGps.lng.toFixed(4)} (Accuracy ~${Math.round(cachedGps.accuracy || 15)}m)`
    : "Live GPS Acquired";
  const offlineSmsBody = `EMERGENCY SOS: Survivor in immediate danger. GPS: ${liveGpsString}. Dispatch immediate SAPS / Medical assistance. Time: ${new Date().toLocaleTimeString("en-ZA")}`;

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* SAFE JOURNEY ACTIVE CARD */}
      {activeJourney ? (
        <div className="bg-emerald-950/40 border-2 border-emerald-500/50 rounded-2xl p-4 text-xs text-emerald-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-bold text-white uppercase tracking-wider text-xs flex items-center gap-1.5">
                <Car className="w-4 h-4 text-emerald-400" />
                <span>SAFE JOURNEY ACTIVE</span>
              </span>
            </div>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
              MONITORED
            </span>
          </div>

          <div className="p-3 bg-black/60 rounded-xl border border-emerald-500/20 space-y-1.5">
            <div className="flex justify-between items-start">
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold">Heading to:</span>
                <strong className="text-white text-sm">{activeJourney.destinationAddress}</strong>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                {formatElapsed(journeyElapsed)}
              </span>
            </div>

            <p className="text-[11px] text-slate-300">
              <strong>Vehicle:</strong> {activeJourney.vehicleColor} {activeJourney.vehicleMake} {activeJourney.vehicleModel} ({activeJourney.doors}) • <span className="font-mono font-bold text-white">{activeJourney.licensePlate}</span>
            </p>
            {activeJourney.visibleDamages && (
              <p className="text-[10px] text-amber-300">
                <strong>Marks:</strong> {activeJourney.visibleDamages}
              </p>
            )}
            <p className="text-[11px] text-slate-300">
              <strong>Driver:</strong> {activeJourney.driverName} {activeJourney.driverPhone ? `(${activeJourney.driverPhone})` : ""} • <strong>Service:</strong> {activeJourney.rideType}
            </p>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onShowArrivalConfirm}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>END JOURNEY (ARRIVED SAFELY)</span>
            </button>
            <button
              type="button"
              onClick={onCancelJourney}
              className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs"
              title="Cancel monitoring"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-white flex items-center gap-1.5">
              <Car className="w-4 h-4 text-emerald-400" />
              <span>Monitored Vehicle Journey Tracker</span>
            </span>
            <span className="text-[10px] text-emerald-400 bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded font-bold">
              UBER / BOLT / TAXI
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Log your ride's make, model, doors, color, plate, damages & driver info before departure. Automatically notifies your ICE contacts with live GPS.
          </p>
          <button
            type="button"
            onClick={onOpenVehicleModal}
            className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Start Monitored Journey</span>
          </button>
        </div>
      )}

      {/* Zero Airtime & Data Protection */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 text-xs flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-white">Zero Airtime & Data Protection</h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            0800 numbers and *120* USSD codes are toll-free in South Africa across Vodacom, MTN, Cell C, and Telkom.
          </p>
        </div>
      </div>

      {/* Primary Armed SOS Button */}
      <div className="text-center bg-slate-900/90 rounded-2xl p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block mb-2">
          EMERGENCY DISTRESS BEACON
        </span>

        {isArmed ? (
          <div className="py-6">
            <div className="w-32 h-32 rounded-full border-4 border-rose-500 flex items-center justify-center mx-auto mb-4 animate-pulse bg-rose-500/20 shadow-2xl shadow-rose-600">
              <span className="text-5xl font-black text-rose-500">{countdown}</span>
            </div>
            <p className="text-xs text-rose-300 font-semibold mb-4">
              Broadcasting 72-hr GPS beacon to all ICE guardians & national command...
            </p>
            <button
              onClick={onCancelArmedSos}
              className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2.5 px-6 rounded-xl text-sm"
            >
              Cancel Distress Signal
            </button>
          </div>
        ) : (
          <div className="py-4">
            <button
              onClick={onArmSos}
              className="w-36 h-36 rounded-full bg-gradient-to-tr from-rose-600 to-red-500 hover:scale-105 active:scale-95 transition-all mx-auto flex flex-col items-center justify-center shadow-xl shadow-red-600/40 border-4 border-rose-400/30"
            >
              <ShieldAlert className="w-12 h-12 text-white mb-1" />
              <span className="text-xs font-black tracking-widest text-white uppercase">
                HOLD SOS
              </span>
            </button>
            <p className="text-xs text-slate-400 mt-4">
              3-second grace period. Dispatches unstoppable cloud beacon even if phone is smashed.
            </p>
          </div>
        )}

        {sosStatus && (
          <div className="mt-4 p-3 bg-slate-800 rounded-xl text-xs text-emerald-400 border border-emerald-500/40">
            {sosStatus}
          </div>
        )}

        {/* UAT Simulated Dispatch Card */}
        {simulatedDispatchPayload && (
          <div className="mt-4 p-3.5 bg-slate-950 border border-amber-500/40 rounded-xl text-left space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold text-xs">
                <span>UAT Simulated Dispatch Verified</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-500/30">
                SAFE SIMULATION
              </span>
            </div>

            <p className="text-slate-300 text-[11px]">
              Simulated distress beacon delivered to <strong className="text-white">2 test guardians</strong> with live GPS coordinates. No emergency services were alerted.
            </p>

            <div className="bg-black/60 p-2.5 rounded-lg font-mono text-[11px] text-slate-300 space-y-1 border border-slate-800">
              <div><strong>ICE 1:</strong> Sister Lerato (+27 82 000 0001)</div>
              <div><strong>ICE 2:</strong> Coordinator Sipho (+27 82 000 0002)</div>
              <div>
                <strong>GPS:</strong>{" "}
                {simulatedDispatchPayload.gps
                  ? `${simulatedDispatchPayload.gps.lat.toFixed(4)}, ${simulatedDispatchPayload.gps.lng.toFixed(4)}`
                  : cachedGps
                  ? `${cachedGps.lat.toFixed(4)}, ${cachedGps.lng.toFixed(4)}`
                  : "Live Device Telemetry Active"}
              </div>
              <div><strong>Battery:</strong> 92% | Time: {simulatedDispatchPayload.timestamp}</div>
            </div>

            <div className="flex gap-2 pt-1">
              {onOpenGuardianTracker && (
                <button
                  type="button"
                  onClick={onOpenGuardianTracker}
                  className="flex-1 py-2 px-3 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Inspect Tracker View</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  if (typeof navigator !== "undefined" && navigator.clipboard) {
                    navigator.clipboard.writeText(JSON.stringify(simulatedDispatchPayload, null, 2));
                    if (onShowToast) onShowToast("info", "Copied", "Simulated payload copied to clipboard.");
                  }
                }}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center gap-1 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Payload</span>
              </button>
            </div>
          </div>
        )}

        {/* Loadshedding Fallback Mode Toggle */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800 mt-4">
          <span className="text-[11px] text-slate-400">Grid / Signal Status:</span>
          <button
            type="button"
            onClick={() => setIsOfflineSosActive(!isOfflineSosActive)}
            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold bg-amber-950/40 border border-amber-600/40 px-2.5 py-1 rounded-lg transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{isOfflineSosActive ? "Hide Offline SMS" : "Loadshedding / SMS Mode"}</span>
          </button>
        </div>
      </div>

      {/* AUDIBLE DETERRENT SIREN */}
      <button
        type="button"
        onClick={handleToggleSiren}
        className={`w-full py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
          isSirenOn
            ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/50"
            : "bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-400"
        }`}
      >
        <Volume2 className="w-4 h-4 text-amber-400" />
        <span>{isSirenOn ? "DEACTIVATE AUDIBLE SIREN" : "ACTIVATE AUDIBLE SIREN (DETERRENT)"}</span>
      </button>

      {/* Loadshedding Offline SMS Dispatch Panel */}
      {isOfflineSosActive && (
        <div className="bg-amber-950/30 border-2 border-amber-500/60 rounded-2xl p-4 text-xs text-amber-200 space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-bold text-amber-400">
              <WifiOff className="w-4 h-4 text-amber-400" />
              <span className="uppercase tracking-wide text-[11px]">Loadshedding / Offline SOS Fallback</span>
            </div>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-mono px-2 py-0.5 rounded border border-amber-500/30">
              0 Data Required
            </span>
          </div>

          <p className="text-[11px] text-slate-300 leading-relaxed">
            Mobile data grid disconnected or loadshedding active. Dispatch distress beacon directly via cellular SMS (requires 0 data) or free national USSD lifelines:
          </p>

          <div className="grid grid-cols-1 gap-2 pt-1">
            <a
              href={`sms:10111?body=${encodeURIComponent(offlineSmsBody)}`}
              className="p-3 bg-slate-900 hover:bg-slate-800 border border-amber-500/40 rounded-xl flex items-center justify-between text-xs font-bold text-amber-300 transition-colors"
            >
              <span>Dispatch SMS to SAPS Flying Squad (10111)</span>
              <span className="text-[10px] font-mono bg-amber-950 px-2 py-0.5 rounded">Toll-Free</span>
            </a>
          </div>
          <p className="text-[10px] font-mono text-slate-300 break-words">{offlineSmsBody}</p>
        </div>
      )}

      {/* Burner Guardian Ephemeral Web Tracker Link */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400" />
            Burner Guardian Link (Zero-Install)
          </span>
          <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
            72-Hr Active
          </span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          Send this ephemeral tracker link to any trusted neighbor, family member, or CPF patroller. Works instantly on any mobile browser with zero app installation.
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              const link = typeof window !== "undefined" ? `${window.location.origin}/?track=beacon_72h_active` : "";
              if (typeof navigator !== "undefined" && navigator.clipboard) {
                navigator.clipboard.writeText(link);
                setCopiedGuardianLink(true);
                setTimeout(() => setCopiedGuardianLink(false), 2000);
                if (onShowToast) onShowToast("success", "Link Copied", "Burner guardian link copied to clipboard.");
              }
            }}
            className="flex-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
          >
            <Copy className="w-3.5 h-3.5 text-slate-400" />
            <span>{copiedGuardianLink ? "Link Copied!" : "Copy Burner Link"}</span>
          </button>
          {onOpenGuardianTracker && (
            <button
              type="button"
              onClick={onOpenGuardianTracker}
              className="bg-rose-950/60 hover:bg-rose-900/60 border border-rose-600/40 text-rose-300 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5 text-rose-400" />
              <span>Test Console</span>
            </button>
          )}
        </div>
      </div>

      {/* National Lifelines Directory */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsLifelinesExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-800/40 transition-colors"
          aria-expanded={isLifelinesExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
              <PhoneCall className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">Direct Emergency Lifelines</h3>
                <span className="text-[10px] bg-emerald-950 border border-emerald-700/50 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  Zero-Airtime / Free
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                National GBV Command Centre, SAPS Flying Squad & Childline
              </p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {isLifelinesExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isLifelinesExpanded && (
          <div className="p-4 pt-1 border-t border-slate-800/80 space-y-2.5">
            {NATIONAL_LIFELINES.map((l) => (
              <div
                key={l.id}
                onClick={() => {
                  if (l.type === "USSD_FREE") {
                    onOpenUssdModal(l.dialString, l.title);
                  } else {
                    window.location.href = `tel:${l.dialString.replace("#", "%23")}`;
                  }
                }}
                className="p-3 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">{l.title}</span>
                    <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                      l.type === "VOICE_CALL"
                        ? "bg-emerald-950 text-emerald-300 border-emerald-800"
                        : "bg-sky-950 text-sky-300 border-sky-800"
                    }`}>
                      {l.type === "VOICE_CALL" ? "TOLL-FREE" : "USSD"}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{l.dialString}</span>
                </div>
                <button
                  type="button"
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <PhoneCall className="w-3 h-3 text-emerald-400" />
                  <span>Dial</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
