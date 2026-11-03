import React, { useState, useEffect, useRef } from "react";
import { CloudSun, MapPin } from "lucide-react";
import { getCachedLiveLocation } from "../../services/liveLocationService";

interface AndroidClockWidgetProps {
  onUnlockSafeHaven: () => void;
}

export const AndroidClockWidget: React.FC<AndroidClockWidgetProps> = ({ onUnlockSafeHaven }) => {
  const [currentTime, setCurrentTime] = useState<string>("12:00");
  const [currentDate, setCurrentDate] = useState<string>("");
  const tapTimesRef = useRef<number[]>([]);

  // Update clock every 10 seconds
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-ZA", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-ZA", {
          weekday: "short",
          day: "numeric",
          month: "short",
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Covert 3-tap gesture sensor: 3 taps within 800ms
  const handleClockTap = () => {
    const now = Date.now();
    tapTimesRef.current = [...tapTimesRef.current.filter((t) => now - t < 800), now];
    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      onUnlockSafeHaven();
    }
  };

  const cachedGps = getCachedLiveLocation();
  const locationLabel = cachedGps?.areaName ? cachedGps.areaName.split("/")[0].trim() : "Location off";

  return (
    <div
      data-testid="android-clock-widget"
      onClick={handleClockTap}
      className="cursor-pointer select-none py-6 px-4 text-center rounded-2xl active:scale-[0.99] transition-transform"
      role="button"
      tabIndex={0}
      aria-label={`Current time ${currentTime}, date ${currentDate}, tap three times for emergency safe haven.`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClockTap();
      }}
    >
      {/* Massive Clock */}
      <h1 className="text-6xl sm:text-7xl font-light tracking-tight text-white drop-shadow-md font-sans">
        {currentTime}
      </h1>

      {/* Date & Weather At-A-Glance Bar */}
      <div className="mt-2 flex items-center justify-center gap-2 text-sm text-slate-200/90 font-medium drop-shadow">
        <span>{currentDate}</span>
        <span className="text-slate-400">•</span>
        <div className="flex items-center gap-1">
          <CloudSun className="w-4 h-4 text-amber-300" />
          <span>24°C</span>
        </div>
        <span className="text-slate-400">•</span>
        <div className="flex items-center gap-1 text-slate-300">
          <MapPin className="w-3.5 h-3.5 text-sky-400" />
          <span className="truncate max-w-[120px]">{locationLabel}</span>
        </div>
      </div>
    </div>
  );
};
