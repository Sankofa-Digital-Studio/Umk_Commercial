import React, { useState, useRef, useEffect } from 'react';
import {
  Phone,
  MessageSquare,
  Camera,
  Compass,
  Settings,
  Image,
  CloudSun,
  Search,
  Wifi,
  Battery,
  Zap,
  Music,
  BookOpen,
  MapPin,
  X,
  ChevronLeft,
  Circle,
  Square,
} from 'lucide-react';
import { setActiveDisguise, getAllDisguises } from '../services/disguiseManager';
import { getCachedLiveLocation } from '../services/liveLocationService';

export interface AndroidLauncherFacadeProps {
  onUnlockSafeHaven: () => void;
  onDuressTrigger?: () => void;
}

export const AndroidLauncherFacade: React.FC<AndroidLauncherFacadeProps> = ({
  onUnlockSafeHaven,
  onDuressTrigger,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [safeSearchMsg, setSafeSearchMsg] = useState<string | null>(null);

  // Modals
  const [isDialerOpen, setIsDialerOpen] = useState<boolean>(false);
  const [isMessagesOpen, setIsMessagesOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [mmiDialogOpen, setMmiDialogOpen] = useState<boolean>(false);

  // Dialer
  const [dialerNumber, setDialerNumber] = useState<string>('');

  // Clock
  const [currentTime, setCurrentTime] = useState<string>('14:32');
  const [currentDate, setCurrentDate] = useState<string>('Tue, 27 Oct');
  const cachedLocation = getCachedLiveLocation();
  const launcherLocation = cachedLocation?.metro || 'Location off';

  // Clock widget 3-tap gesture tracking
  const widgetTapsRef = useRef<number[]>([]);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
      setCurrentDate(
        now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Search input change & submission
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const clean = val.trim();
    if (clean === '8426') {
      onUnlockSafeHaven();
    } else if (clean === '9999') {
      if (onDuressTrigger) {
        onDuressTrigger();
      }
      setSafeSearchMsg('SafeSearch filter active: No adult results displayed.');
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearchChange(searchQuery);
  };

  // Clock / Weather Widget 3-Tap Covert Sensor
  const handleWidgetClick = () => {
    const now = Date.now();
    widgetTapsRef.current = [
      ...widgetTapsRef.current.filter((t) => now - t < 800),
      now,
    ];
    if (widgetTapsRef.current.length >= 3) {
      widgetTapsRef.current = [];
      onUnlockSafeHaven();
    }
  };

  // Dialer digit entry
  const handleDialerDigit = (digit: string) => {
    const next = dialerNumber + digit;
    setDialerNumber(next);

    if (next === '*#8426#') {
      setIsDialerOpen(false);
      setDialerNumber('');
      onUnlockSafeHaven();
    } else if (next === '*#9999#') {
      if (onDuressTrigger) {
        onDuressTrigger();
      }
      setDialerNumber('');
      setMmiDialogOpen(true);
    }
  };

  const handleDialerCall = () => {
    const clean = dialerNumber.trim();
    if (clean === '*#8426#' || clean === '8426') {
      setIsDialerOpen(false);
      setDialerNumber('');
      onUnlockSafeHaven();
    } else if (clean === '*#9999#' || clean === '9999') {
      if (onDuressTrigger) {
        onDuressTrigger();
      }
      setDialerNumber('');
      setMmiDialogOpen(true);
    } else if (clean) {
      setMmiDialogOpen(true);
    }
  };

  const dismissAllModals = () => {
    setIsDialerOpen(false);
    setIsMessagesOpen(false);
    setIsSettingsOpen(false);
    setMmiDialogOpen(false);
  };

  const disguises = getAllDisguises();

  return (
    <div
      data-testid="android-launcher-facade"
      className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100 flex flex-col justify-between max-w-md mx-auto select-none border-x border-slate-800 font-sans relative overflow-hidden"
    >
      {/* Top Android Status Bar */}
      <header className="px-5 pt-3 pb-2 flex items-center justify-between text-xs font-mono text-slate-300">
        <div className="flex items-center gap-1.5 font-bold">
          <span>{currentTime}</span>
          <span className="text-slate-500">•</span>
          <span className="text-[11px] text-slate-400">Vodacom ZA 5G</span>
        </div>
        <div className="flex items-center gap-2">
          <Wifi className="w-3.5 h-3.5" />
          <div className="flex items-center gap-1">
            <span className="text-[10px]">88%</span>
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
      </header>

      {/* Main Home Screen Workspace */}
      <main className="p-4 flex-1 space-y-6">
        {/* Clock & Weather Widget (Sensor for Covert 3-Tap) */}
        <div
          data-testid="android-clock-widget"
          onClick={handleWidgetClick}
          className="pt-4 text-center cursor-pointer transition-transform active:scale-95 space-y-1"
          title="Digital Clock Widget"
        >
          <div className="text-5xl font-light tracking-tight text-white font-mono">
            {currentTime}
          </div>
          <div className="text-xs text-slate-400 font-medium flex items-center justify-center gap-2">
            <span>{currentDate}</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-amber-300">
              <CloudSun className="w-3.5 h-3.5" />
              <span>{launcherLocation} 22°C</span>
            </span>
          </div>
        </div>

        {/* Google-Style Pill Search Widget (Covert PIN Vector) */}
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="w-full bg-slate-900/90 border border-slate-800 rounded-full py-2.5 pl-10 pr-10 text-xs text-slate-200 shadow-lg flex items-center justify-between">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search Google or type URL..."
              aria-label="Google search bar"
              className="w-full bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                type="submit"
                className="absolute right-3.5 top-2.5 text-xs text-emerald-400 font-bold"
              >
                Go
              </button>
            )}
          </div>
        </form>

        {safeSearchMsg && (
          <div className="text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 p-2 rounded-lg text-center font-mono">
            {safeSearchMsg}
          </div>
        )}

        {/* Home Screen App Grid */}
        <div className="grid grid-cols-4 gap-y-6 gap-x-3 pt-4 text-center">
          {/* Phone */}
          <button
            type="button"
            onClick={() => setIsDialerOpen(true)}
            aria-label="Open Phone"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/25">
              <Phone className="w-6 h-6 fill-white" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Phone</span>
          </button>

          {/* Messages */}
          <button
            type="button"
            onClick={() => setIsMessagesOpen(true)}
            aria-label="Open Messages"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-sky-500 text-white flex items-center justify-center shadow-lg shadow-sky-500/25">
              <MessageSquare className="w-6 h-6 fill-white" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Messages</span>
          </button>

          {/* Camera */}
          <button
            type="button"
            onClick={() => {}}
            aria-label="Open Camera"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-500/25">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Camera</span>
          </button>

          {/* Gallery */}
          <button
            type="button"
            onClick={() => {}}
            aria-label="Open Gallery"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-500/25">
              <Image className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Gallery</span>
          </button>

          {/* PowerCalc */}
          <button
            type="button"
            onClick={() => setActiveDisguise('MUNICIPAL_PREPAID')}
            aria-label="Open PowerCalc"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-amber-400 flex items-center justify-center shadow-lg">
              <Zap className="w-6 h-6 fill-amber-400" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">PowerCalc</span>
          </button>

          {/* Coco Bongo */}
          <button
            type="button"
            onClick={() => setActiveDisguise('MUSIC_PLAYER')}
            aria-label="Open Coco Bongo"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-emerald-400 flex items-center justify-center shadow-lg">
              <Music className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Coco Bongo</span>
          </button>

          {/* Daily Bible */}
          <button
            type="button"
            onClick={() => setActiveDisguise('DAILY_DEVOTIONAL')}
            aria-label="Open Daily Bible"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-indigo-400 flex items-center justify-center shadow-lg">
              <BookOpen className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Daily Bible</span>
          </button>

          {/* Maps (Covert Trigger Vector to Safe Haven) */}
          <button
            type="button"
            onClick={onUnlockSafeHaven}
            aria-label="Open Maps"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-slate-700 text-rose-400 flex items-center justify-center shadow-lg">
              <MapPin className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Maps</span>
          </button>

          {/* Settings */}
          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            aria-label="Open Settings"
            className="flex flex-col items-center gap-1.5 focus:outline-none group active:scale-90 transition-transform"
          >
            <div className="w-14 h-14 rounded-2xl bg-slate-700 text-slate-200 flex items-center justify-center shadow-lg">
              <Settings className="w-6 h-6" />
            </div>
            <span className="text-[11px] text-slate-300 font-medium">Settings</span>
          </button>
        </div>
      </main>

      {/* Persistent Bottom Dock */}
      <footer className="p-4 border-t border-slate-900/80 bg-slate-950/80 backdrop-blur-md">
        <div className="flex items-center justify-around">
          <button
            type="button"
            onClick={() => setIsDialerOpen(true)}
            aria-label="Dock Phone"
            className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 active:scale-90 transition-transform"
          >
            <Phone className="w-5 h-5 fill-white" />
          </button>
          <button
            type="button"
            onClick={() => setIsMessagesOpen(true)}
            aria-label="Dock Messages"
            className="w-12 h-12 rounded-2xl bg-sky-500 flex items-center justify-center text-white shadow-lg shadow-sky-500/20 active:scale-90 transition-transform"
          >
            <MessageSquare className="w-5 h-5 fill-white" />
          </button>
          <button
            type="button"
            onClick={() => {}}
            aria-label="Dock Browser"
            className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-500/20 active:scale-90 transition-transform"
          >
            <Compass className="w-5 h-5 text-white" />
          </button>
          <button
            type="button"
            onClick={() => {}}
            aria-label="Dock Camera"
            className="w-12 h-12 rounded-2xl bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20 active:scale-90 transition-transform"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Android Navigation Bar */}
        <div className="flex items-center justify-around pt-4 text-slate-500">
          <button
            type="button"
            onClick={dismissAllModals}
            aria-label="Android Back"
            className="p-2 hover:text-slate-300"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={dismissAllModals}
            aria-label="Android Home"
            className="p-2 hover:text-slate-300"
          >
            <Circle className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={dismissAllModals}
            aria-label="Android Overview"
            className="p-2 hover:text-slate-300"
          >
            <Square className="w-4 h-4" />
          </button>
        </div>
      </footer>

      {/* Phone Dialer Modal */}
      {isDialerOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-sm font-mono font-bold text-slate-200">Phone Dialer</span>
            <button
              type="button"
              onClick={() => setIsDialerOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
              aria-label="Close dialer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="py-6 text-center space-y-2">
            <div className="h-12 flex items-center justify-center">
              <span className="text-3xl font-mono tracking-widest text-white font-bold">
                {dialerNumber || ' '}
              </span>
            </div>
          </div>

          {/* Keypad Grid with exact aria-labels */}
          <div className="grid grid-cols-3 gap-3 max-w-xs mx-auto w-full">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'].map((digit) => (
              <button
                key={digit}
                type="button"
                onClick={() => handleDialerDigit(digit)}
                aria-label={`Dial ${digit}`}
                className="h-14 rounded-full bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xl font-bold font-mono flex items-center justify-center border border-slate-800/80 transition"
              >
                {digit}
              </button>
            ))}
          </div>

          <div className="pt-6 flex items-center justify-center">
            <button
              type="button"
              data-testid="dialer-call-button"
              onClick={handleDialerCall}
              aria-label="Call dialed number"
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 transition"
            >
              <Phone className="w-7 h-7 fill-white" />
            </button>
          </div>
        </div>
      )}

      {/* MMI Decoy Carrier Dialog */}
      {mmiDialogOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-sm w-full p-5 shadow-2xl space-y-3">
            <h3 className="font-bold text-sm text-white font-mono">MMI code started</h3>
            <p className="text-xs text-slate-300">
              Call forwarding unconditional: Voice service connection updated successfully.
            </p>
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setMmiDialogOpen(false)}
                className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-lg"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Device Settings Modal */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">Device Settings</h2>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 py-4 space-y-4 overflow-y-auto text-xs">
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-500 font-mono block">DEVICE HARDWARE</span>
              <div className="text-white font-semibold">Model: Samsung Galaxy A53 5G</div>
              <div className="text-slate-400">Android 14 (One UI 6.0) • Build 2026.10</div>
            </div>

            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 space-y-2">
              <span className="text-[10px] text-slate-500 font-mono block">APPEARANCE</span>
              <div className="text-white font-semibold">Default Chameleon Disguise</div>
              <div className="space-y-1.5 pt-1">
                {disguises.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => {
                      setActiveDisguise(d.id);
                      setIsSettingsOpen(false);
                    }}
                    className="w-full text-left p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700/80 flex items-center justify-between text-xs"
                  >
                    <span className="text-slate-200">{d.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{d.id}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(false)}
            className="w-full bg-slate-800 py-2.5 rounded-xl text-xs font-bold text-white"
          >
            Close Settings
          </button>
        </div>
      )}

      {/* Messages Modal */}
      {isMessagesOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex flex-col justify-between p-6 max-w-md mx-auto">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <span className="text-sm font-bold text-white">Inbox (Messages)</span>
            <button
              type="button"
              onClick={() => setIsMessagesOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 py-4 space-y-2.5 overflow-y-auto">
            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>Vodacom Alert</span>
                <span className="text-[10px] text-slate-500 font-mono">10:14 AM</span>
              </div>
              <p className="text-xs text-slate-300">
                Your 2GB Data Bundle expires in 48 hours. Dial *135# to recharge or purchase Everyday-Gig bundles.
              </p>
            </div>

            <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span>{cachedLocation?.province || 'Municipal Services'}</span>
                <span className="text-[10px] text-slate-500 font-mono">Yesterday</span>
              </div>
              <p className="text-xs text-slate-300">
                Municipal account statement for electricity & water is ready. Thank you for paying on time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsMessagesOpen(false)}
            className="w-full bg-slate-800 py-2.5 rounded-xl text-xs font-bold text-white"
          >
            Back to Home
          </button>
        </div>
      )}
    </div>
  );
};
