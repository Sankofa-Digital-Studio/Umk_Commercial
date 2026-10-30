import React, { useState, useMemo } from "react";
import {
  MapPin,
  RotateCcw,
  Navigation,
  PhoneCall,
  Info,
} from "lucide-react";
import {
  THUTHUZELA_CENTERS,
  SA_PROVINCES,
  sortCentresByDistance,
} from "../../data/saSafetyData";
import { First72HoursGuide } from "../First72HoursGuide";
import { GoogleMapsSafeHavenView } from "../GoogleMapsSafeHavenView";
import { TccServiceInfoModal } from "../TccServiceInfoModal";

interface TccCentresTabProps {
  userLocation: { lat: number; lng: number; accuracy?: number } | null;
  identifiedAreaName: string;
  isLocating: boolean;
  onRefreshLocation: () => void;
}

export const TccCentresTab: React.FC<TccCentresTabProps> = ({
  userLocation,
  identifiedAreaName,
  isLocating,
  onRefreshLocation,
}) => {
  const [selectedProvince, setSelectedProvince] = useState<string>("All");
  const [tccSearch, setTccSearch] = useState<string>("");
  const [serviceModal, setServiceModal] = useState<{
    isOpen: boolean;
    initialIndex: number;
    centreName?: string;
    contactNumber?: string;
  }>({
    isOpen: false,
    initialIndex: 0,
  });

  const filteredTcc = useMemo(() => {
    let list = sortCentresByDistance(
      THUTHUZELA_CENTERS,
      userLocation ? userLocation.lat : undefined,
      userLocation ? userLocation.lng : undefined
    );
    if (selectedProvince !== "All") {
      list = list.filter((c) => c.province === selectedProvince);
    }
    if (tccSearch.trim()) {
      const q = tccSearch.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.hospitalOrLocation.toLowerCase().includes(q) ||
          c.cityOrTown.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedProvince, tccSearch, userLocation]);

  const handleOpenServiceModal = (index: number, centreName: string, contactNumber: string) => {
    setServiceModal({
      isOpen: true,
      initialIndex: index,
      centreName,
      contactNumber,
    });
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-200">
      {/* Service Info Swipable Modal */}
      <TccServiceInfoModal
        isOpen={serviceModal.isOpen}
        initialIndex={serviceModal.initialIndex}
        centreName={serviceModal.centreName}
        contactNumber={serviceModal.contactNumber}
        onClose={() => setServiceModal((prev) => ({ ...prev, isOpen: false }))}
      />

      {/* The First 72 Hours Forensic Guide */}
      <First72HoursGuide />

      {/* Embedded Google Maps Safe Haven View */}
      <GoogleMapsSafeHavenView hideSelectedCard={true} />

      {/* Live GPS Telemetry & Accuracy Banner */}
      <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-bold">{identifiedAreaName}</span>
              <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-700/60 px-1.5 py-0.2 rounded font-mono font-bold">
                LIVE
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[10px]">
              {userLocation
                ? `GPS: ${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)} (±${Math.round(userLocation.accuracy || 15)}m)`
                : "Acquiring live GPS coordinates..."}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onRefreshLocation}
          disabled={isLocating}
          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded-lg font-bold text-[11px] shrink-0 border border-slate-700 flex items-center gap-1 transition-colors"
          title="Refresh GPS Coordinates"
        >
          <RotateCcw className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Centres Directory Filter and Search */}
      <div className="space-y-4 pt-2 border-t border-slate-800">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Select Province
          </span>
          <select
            value={selectedProvince}
            onChange={(e) => setSelectedProvince(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-400"
          >
            {SA_PROVINCES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        <input
          type="text"
          value={tccSearch}
          onChange={(e) => setTccSearch(e.target.value)}
          placeholder="Search hospital or town..."
          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
        />

        <div className="space-y-3">
          {filteredTcc.map((c) => (
            <div
              key={c.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2.5"
            >
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white">{c.name}</h3>
                    <span className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[9px] font-bold px-1.5 py-0.5 rounded">
                      24/7 OPEN
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{c.hospitalOrLocation}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="bg-amber-950 border border-amber-800 text-amber-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {c.province}
                  </span>
                  {c.distanceKm !== undefined && (
                    <span className="bg-sky-950 border border-sky-800 text-sky-400 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                      <Navigation className="w-3 h-3" />
                      <span>{c.distanceKm} km</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Forensic & Clinical Badges with interactive touch/click modal */}
              <div className="flex flex-wrap gap-1 text-[10px] text-slate-300">
                <button
                  type="button"
                  onClick={() => handleOpenServiceModal(0, c.name, c.contactNumber)}
                  className="bg-slate-950 hover:bg-slate-800 hover:border-amber-500/50 hover:text-amber-300 active:scale-95 px-2 py-1 rounded-lg border border-slate-800 text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                  title="Click to view Forensic Medical Exam legal & clinical details"
                >
                  <Info className="w-3 h-3 text-amber-400" />
                  <span>Forensic Medical Exam</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenServiceModal(1, c.name, c.contactNumber)}
                  className="bg-slate-950 hover:bg-slate-800 hover:border-rose-500/50 hover:text-rose-300 active:scale-95 px-2 py-1 rounded-lg border border-slate-800 text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                  title="Click to view HIV PEP Prophylaxis clinical details"
                >
                  <Info className="w-3 h-3 text-rose-400" />
                  <span>HIV PEP Prophylaxis</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenServiceModal(2, c.name, c.contactNumber)}
                  className="bg-slate-950 hover:bg-slate-800 hover:border-sky-500/50 hover:text-sky-300 active:scale-95 px-2 py-1 rounded-lg border border-slate-800 text-slate-300 transition-all flex items-center gap-1 cursor-pointer"
                  title="Click to view Trauma Counseling support details"
                >
                  <Info className="w-3 h-3 text-sky-400" />
                  <span>Trauma Counseling</span>
                </button>
              </div>

              <p className="text-xs text-slate-400 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <span>{c.address}</span>
              </p>

              <div className="flex gap-2 pt-1">
                <a
                  href={`tel:${c.contactNumber}`}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Call {c.contactNumber}</span>
                </a>
                {c.altContactNumber && (
                  <a
                    href={`tel:${c.altContactNumber}`}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 px-3 rounded-lg text-xs"
                  >
                    Alt Line
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
