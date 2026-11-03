import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Smartphone,
  Monitor,
  BookOpen,
  Download,
  X,
  Check,
} from "lucide-react";

export interface UtilityCheatSheetModalProps {
  isOpen: boolean;
  onClose: (didClose?: boolean) => void;
  onUnlockSafeHaven?: (source?: "direct" | "covert") => void;
}

export const UtilityCheatSheetModal: React.FC<UtilityCheatSheetModalProps> = ({
  isOpen,
  onClose,
  onUnlockSafeHaven,
}) => {
  const [downloadStarted, setDownloadStarted] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose(true);
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleDownloadApk = () => {
    setDownloadStarted(true);
    setTimeout(() => setDownloadStarted(false), 3000);
  };

  const secretTriggers: [string, string][] = [
    [
      "Safe Haven Access",
      "Triple-tap the shield crest, or enter PIN 1234 / 8426 as purchase amount",
    ],
    [
      "Duress Alarm (9999)",
      "Shows fake STS error receipt while silently sending an emergency beacon to your guardians",
    ],
    [
      "Instant Panic Exit",
      "Double-tap background or press Escape / phone Back button — 0ms memory scrub",
    ],
    [
      "Form 2 Court Pack",
      "Compiles sworn affidavit formatted for SA Magistrates Court under ECTA Section 15",
    ],
    [
      "Quick Exit",
      "Tap ⚡ Quick Exit to leave this site instantly and open Google",
    ],
  ];

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="consumer-portal-title"
      data-testid="consumer-portal-modal"
      onClick={() => onClose(true)}
    >
      <div
        className="bg-slate-900 border border-slate-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        {/* Modal header */}
        <div className="bg-slate-800 border-b border-slate-700 px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-sky-400" aria-hidden="true" />
            <h3 className="font-bold text-white text-sm" id="consumer-portal-title">
              Consumer Portal & Mobile Downloads
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <a
              href="https://www.google.co.za"
              className="text-[11px] bg-rose-950 hover:bg-rose-900 border border-rose-600 text-rose-200 px-2.5 py-1 rounded-lg font-bold transition-colors cursor-pointer"
              title="Immediately leave this site"
            >
              ⚡ Quick Exit
            </a>
            <button
              type="button"
              onClick={() => onClose(true)}
              className="text-slate-300 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              aria-label="Close consumer portal modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-5 space-y-3.5 max-h-[75vh] overflow-y-auto text-xs">
          {/* Android APK */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sky-300 font-bold">
              <Smartphone className="w-4 h-4" aria-hidden="true" />
              <span>Android Smartphone — Direct APK</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              Installs as <strong className="text-white">PowerCalc SA</strong> — no Play Store record. Leaves your phone clean and unsuspicious.
            </p>
            <a
              href="/downloads/Umkhuseli_Safe_latest.apk"
              download="PowerCalc_SA_latest.apk"
              onClick={handleDownloadApk}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-sky-700 hover:bg-sky-600 text-white font-bold rounded-xl transition-all shadow-lg shadow-sky-700/20 active:scale-95 cursor-pointer"
            >
              {downloadStarted ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" aria-hidden="true" />
                  <span>Download Initiated (PowerCalc SA)</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" aria-hidden="true" />
                  <span>Download Android APK (PowerCalc SA v2.5.0)</span>
                </>
              )}
            </a>
          </div>

          {/* iOS PWA */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold">
              <Smartphone className="w-4 h-4" aria-hidden="true" />
              <span>Apple iPhone / iPad — Safari PWA</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              No App Store download or purchase history. In Safari tap the{" "}
              <strong className="text-white">Share</strong> button ➔{" "}
              <strong className="text-white">"Add to Home Screen"</strong>. Runs fullscreen with Face ID.
            </p>
          </div>

          {/* Desktop */}
          <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-2">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Monitor className="w-4 h-4" aria-hidden="true" />
              <span>Desktop / Laptop — Browser App</span>
            </div>
            <p className="text-slate-200 leading-relaxed font-medium">
              Works in Chrome, Edge, or Firefox. Click the <strong className="text-white">Install</strong> icon in the address bar for a standalone desktop app with no browser chrome.
            </p>
          </div>

          {/* Cheatsheet */}
          <div className="bg-slate-950 rounded-xl border border-sky-900/50 p-4 space-y-2.5">
            <div className="flex items-center justify-between font-bold text-white">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-sky-400" aria-hidden="true" />
                <span>Quick Access & Secret Triggers</span>
              </div>
              {onUnlockSafeHaven && (
                <button
                  type="button"
                  onClick={() => {
                    onClose(true);
                    onUnlockSafeHaven("direct");
                  }}
                  className="text-[10px] text-sky-400 hover:text-sky-300 underline font-normal"
                >
                  Direct Unlock
                </button>
              )}
            </div>
            <ul className="text-slate-200 space-y-2 pl-1 font-medium">
              {secretTriggers.map(([title, desc]) => (
                <li key={title} className="flex gap-2">
                  <span className="text-sky-400 font-bold flex-shrink-0 mt-0.5" aria-hidden="true">
                    ›
                  </span>
                  <span>
                    <strong className="text-white">{title}:</strong> {desc}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 px-5 py-3">
          <button
            type="button"
            onClick={() => onClose(true)}
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer active:scale-95"
          >
            Close Portal
          </button>
        </div>
      </div>
    </div>
  );
};
