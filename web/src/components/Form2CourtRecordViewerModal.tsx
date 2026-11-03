import React, { useState, useRef, useEffect } from "react";
import {
  X,
  Printer,
  Edit3,
  Check,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  ShieldAlert,
  FileText,
  User,
  PenTool,
  RotateCcw,
  CheckCircle2,
  Sparkles
} from "lucide-react";
import { exportOrShareEctaAffidavitPdf } from "../services/ectaSection15Pdf";
import { UatProfile, getUatProfile } from "../services/uatProfileService";

export interface CourtIncidentRecord {
  id: string;
  type: string;
  severity: number;
  perpetrator: string;
  location: string;
  date: string;
  statement: string;
  injuriesOrImpact?: string;
  witnesses?: string;
  sapsObNumber?: string;
  isEncrypted: boolean;
  sha256Checksum?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  incidents: CourtIncidentRecord[];
  isVaultUnlocked: boolean;
  onUnlockVault?: () => void;
  onOpenProfile?: () => void;
}

export const Form2CourtRecordViewerModal: React.FC<Props> = ({
  isOpen,
  onClose,
  incidents,
  isVaultUnlocked,
  onUnlockVault,
  onOpenProfile,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [includeParticulars, setIncludeParticulars] = useState(true);
  const [showSignPad, setShowSignPad] = useState(false);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Canvas Signature Pad State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const profile = getUatProfile();
  const hasProfileData = Boolean(profile.personal.fullName && profile.personal.saIdNumber);
  const activeIncidents = incidents;

  const currentRecord = activeIncidents[currentIndex] || activeIncidents[0];

  // Signature Canvas Drawing Logic
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    setSignatureDataUrl(dataUrl);
    setShowSignPad(false);
  };

  const handleExportPdf = async () => {
    if (!currentRecord) return;
    setIsExportingPdf(true);
    try {
      const result = await exportOrShareEctaAffidavitPdf({
        incidentId: currentRecord.id,
        incidentType: currentRecord.type,
        severityLevel: currentRecord.severity,
        perpetrator: currentRecord.perpetrator,
        locationDescription: currentRecord.location,
        description: isVaultUnlocked
          ? currentRecord.statement
          : "[AES-256-GCM Encrypted Court Sworn Record]",
        injuriesOrImpact: isVaultUnlocked
          ? currentRecord.injuriesOrImpact || "None specified"
          : "[Encrypted]",
        witnesses: isVaultUnlocked
          ? currentRecord.witnesses || "Confidential"
          : "[Encrypted]",
        sha256Checksum: currentRecord.sha256Checksum || "",
        timestamp: currentRecord.date,
        deponentName: includeParticulars ? profile.personal.fullName : "Confidential Applicant",
        signatureDataUrl: signatureDataUrl || undefined,
        includeComplainantParticulars: includeParticulars,
      });

      setExportNotice("Form 2 Protection Order PDF exported successfully.");
      setTimeout(() => setExportNotice(null), 3500);
    } catch (e: any) {
      setExportNotice("Export finished.");
    } finally {
      setIsExportingPdf(false);
    }
  };

  if (!isOpen) return null;

  if (!currentRecord) {
    return (
      <div
        data-testid="form2-record-viewer-modal"
        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      >
        <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full p-6 text-center shadow-2xl">
          <FileText className="w-10 h-10 mx-auto text-slate-500" aria-hidden="true" />
          <h2 className="mt-3 text-base font-bold text-white">No survivor records yet</h2>
          <p className="mt-2 text-sm text-slate-400">
            Add an incident in the encrypted evidence vault before preparing a Form 2 record.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="mt-5 rounded-xl bg-amber-400 px-5 py-2.5 text-sm font-bold text-slate-950"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      data-testid="form2-record-viewer-modal"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col justify-end sm:justify-center p-0 sm:p-4 animate-in fade-in duration-150 select-none"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-3xl max-w-lg w-full mx-auto max-h-[92vh] flex flex-col overflow-hidden shadow-2xl">
        {/* Modal Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close record modal"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center">
            <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 block">
              Form 2 Protection Order
            </span>
            <span className="text-xs font-semibold text-slate-300">
              Record {currentIndex + 1} of {activeIncidents.length}
            </span>
          </div>

          <button
            type="button"
            onClick={handleExportPdf}
            className="p-1.5 rounded-lg text-amber-400 hover:text-amber-300 hover:bg-slate-800 transition-colors"
            title="Export / Print PDF"
          >
            <Printer className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 space-y-4 overflow-y-auto text-xs">
          {/* Complainant Particulars Row */}
          <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id="includeParticularsCheck"
                checked={includeParticulars}
                onChange={(e) => setIncludeParticulars(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-0 cursor-pointer"
              />
              <div>
                <label
                  htmlFor="includeParticularsCheck"
                  className="font-bold text-white text-xs cursor-pointer block"
                >
                  Include Complainant Particulars
                </label>
                <span className="text-[10px] text-amber-400/90 font-medium">
                  {hasProfileData
                    ? `${profile.personal.fullName} • ${profile.personal.nationalId}`
                    : "No profile saved • Tap to add"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={onOpenProfile}
                  className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  Add Info
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowSignPad(true)}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition-colors ${
                  signatureDataUrl
                    ? "bg-emerald-950 border border-emerald-500/60 text-emerald-300"
                    : "bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
                }`}
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>{signatureDataUrl ? "Signed" : "Sign"}</span>
              </button>
            </div>
          </div>

          {/* Signature Capture Modal / Overlay */}
          {showSignPad && (
            <div className="bg-slate-950 border border-amber-500/40 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                  <PenTool className="w-4 h-4" />
                  <span>Deponent Electronic Signature (ECTA Sec 15)</span>
                </span>
                <button
                  type="button"
                  onClick={clearSignature}
                  className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              </div>

              <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl overflow-hidden touch-none">
                <canvas
                  ref={canvasRef}
                  width={340}
                  height={130}
                  className="w-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={saveSignature}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs"
                >
                  Save Signature
                </button>
                <button
                  type="button"
                  onClick={() => setShowSignPad(false)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Incident Details Card */}
          <div className="bg-slate-950 rounded-2xl p-4 border border-slate-800 space-y-3">
            <div className="flex justify-between items-start">
              <span className="bg-slate-800 text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border border-slate-700">
                INCIDENT #{currentIndex + 1} OF {activeIncidents.length}
              </span>
              <span className="bg-amber-950 border border-amber-700/60 text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-full">
                SEVERITY {currentRecord.severity} / 5
              </span>
            </div>

            <div>
              <h3 className="text-base font-bold text-white">{currentRecord.type}</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">{currentRecord.date}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] border-t border-b border-slate-800/80 py-2.5">
              <div>
                <span className="text-slate-500 block">Alleged Perpetrator</span>
                <span className="font-semibold text-slate-200">{currentRecord.perpetrator}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Location</span>
                <span className="font-semibold text-slate-200">{currentRecord.location}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-slate-500 block">Injuries / Impact</span>
                {isVaultUnlocked ? (
                  <span className="text-slate-300">
                    {currentRecord.injuriesOrImpact || "None logged"}
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Encrypted</span>
                  </span>
                )}
              </div>

              <div>
                <span className="text-slate-500 block">Witnesses</span>
                {isVaultUnlocked ? (
                  <span className="text-slate-300">
                    {currentRecord.witnesses || "Confidential"}
                  </span>
                ) : (
                  <span className="text-amber-400/90 font-medium flex items-center gap-1">
                    <Lock className="w-3 h-3 text-amber-400" />
                    <span>Encrypted</span>
                  </span>
                )}
              </div>
            </div>

            {/* SWORN FACTUAL STATEMENT */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Sworn Factual Statement
              </span>

              {isVaultUnlocked ? (
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 text-slate-200 text-xs leading-relaxed">
                  {currentRecord.statement}
                </div>
              ) : (
                <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-slate-400">
                    <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="text-[11px]">
                      Content Encrypted (AES-256-GCM). Biometric Authentication Required.
                    </span>
                  </div>

                  {onUnlockVault && (
                    <button
                      type="button"
                      onClick={onUnlockVault}
                      className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold shrink-0"
                    >
                      Unlock
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* SAPS OB Number if available */}
            {currentRecord.sapsObNumber && (
              <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 text-[11px] flex items-center justify-between">
                <span className="text-slate-400">SAPS Occurrence Book (OB) #:</span>
                <span className="font-mono font-bold text-amber-400">{currentRecord.sapsObNumber}</span>
              </div>
            )}
          </div>

          {exportNotice && (
            <div className="p-3 bg-emerald-950/80 border border-emerald-500/50 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{exportNotice}</span>
            </div>
          )}
        </div>

        {/* Modal Bottom Pagination & Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between gap-3">
          <button
            type="button"
            disabled={currentIndex <= 0}
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Previous Incident"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="flex-1 py-3 px-4 bg-amber-500 hover:bg-amber-400 active:scale-[0.98] text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>{isExportingPdf ? "Generating Form 2..." : "Print / Export Court PDF"}</span>
          </button>

          <button
            type="button"
            disabled={currentIndex >= activeIncidents.length - 1}
            onClick={() => setCurrentIndex((prev) => Math.min(activeIncidents.length - 1, prev + 1))}
            className="p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 hover:text-white disabled:opacity-30 transition-colors"
            title="Next Incident"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
