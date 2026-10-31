import React, { useState } from "react";
import {
  Share2,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  FileText,
  Users,
  User,
  PhoneCall,
  PlusCircle,
  Trash2,
  Lock,
  Radio,
  MapPin,
  RotateCcw,
  MessageSquare,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import {
  NotificationChannelControl,
  SafetyNotificationLevel,
  getNotificationControls,
  saveNotificationControls,
} from "../../services/notificationSafetyManager";
import {
  UatProfile,
  IceContact,
  generateDistressEmailUrl,
  generateWhatsAppBeaconUrl,
} from "../../services/uatProfileService";
import { getCachedLiveLocation } from "../../services/liveLocationService";
import { GoogleMapsSafeHavenView } from "../GoogleMapsSafeHavenView";
import { EscapeGoBagChecklist } from "../EscapeGoBagChecklist";
import { SouthAfricanLegalRights } from "../SouthAfricanLegalRights";

interface SafetyPlanTabProps {
  uatProfile: UatProfile;
  onUpdateProfile: (updated: UatProfile) => void;
  isUatMode: boolean;
  onToggleUat: () => void;
  permissionsStatus: {
    geolocation: "granted" | "prompt" | "denied" | "unknown";
    storage: "persisted" | "not_persisted" | "unknown";
    notifications: "granted" | "default" | "denied" | "unsupported" | "unknown";
  };
  isLocating: boolean;
  onRefreshLocation: () => void;
  onRequestStorage: () => void;
  onRequestNotifications: () => void;
  onShowToast?: (type: "success" | "error" | "warning" | "info", title: string, message: string) => void;
}

export const SafetyPlanTab: React.FC<SafetyPlanTabProps> = ({
  uatProfile,
  onUpdateProfile,
  isUatMode,
  onToggleUat,
  permissionsStatus,
  isLocating,
  onRefreshLocation,
  onRequestStorage,
  onRequestNotifications,
  onShowToast,
}) => {
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(true);
  const [isIceContactsExpanded, setIsIceContactsExpanded] = useState<boolean>(true);
  const [isPermissionsExpanded, setIsPermissionsExpanded] = useState<boolean>(false);
  const [isSocialsExpanded, setIsSocialsExpanded] = useState<boolean>(false);
  const [showAddContactForm, setShowAddContactForm] = useState<boolean>(false);
  const [profileSaveMessage, setProfileSaveMessage] = useState<string | null>(null);

  // Notification Safety Preferences State
  const [notifControls, setNotifControls] = useState<NotificationChannelControl>(getNotificationControls);

  const handleUpdateNotifControls = (updated: Partial<NotificationChannelControl>) => {
    const next = { ...notifControls, ...updated };
    setNotifControls(next);
    saveNotificationControls(next);
    if (onShowToast) {
      onShowToast("success", "Safety Notification Mode", "Notification protocol updated for your security profile.");
    }
  };

  // Profile form state
  const [fullName, setFullName] = useState(uatProfile.personal.fullName);
  const [saIdNumber, setSaIdNumber] = useState(uatProfile.personal.saIdNumber || "");
  const [safeWord, setSafeWord] = useState(uatProfile.personal.safeWord || "LAVENDER");
  const [medicalConditions, setMedicalConditions] = useState(uatProfile.personal.medicalConditions || "");

  // Add contact form state
  const [newContactName, setNewContactName] = useState("");
  const [newContactRel, setNewContactRel] = useState("Sister");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [newContactSecondaryPhone, setNewContactSecondaryPhone] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [newContactInstagram, setNewContactInstagram] = useState("");

  // Social accounts
  const [socialAlertEmail, setSocialAlertEmail] = useState(uatProfile.socials.alertEmail || "");
  const [socialTwitter, setSocialTwitter] = useState(uatProfile.socials.twitterHandle || "");
  const [socialInstagram, setSocialInstagram] = useState(uatProfile.socials.instagramHandle || "");
  const [socialFacebook, setSocialFacebook] = useState(uatProfile.socials.facebookProfile || "");

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UatProfile = {
      ...uatProfile,
      personal: {
        ...uatProfile.personal,
        fullName: fullName.trim() || "Survivor",
        saIdNumber: saIdNumber.trim(),
        safeWord: safeWord.trim().toUpperCase() || "LAVENDER",
        medicalConditions: medicalConditions.trim(),
      },
    };
    onUpdateProfile(updated);
    const msg = "Survivor emergency profile saved locally.";
    setProfileSaveMessage(msg);
    if (onShowToast) onShowToast("success", "Profile Saved", msg);
    setTimeout(() => setProfileSaveMessage(null), 4000);
  };

  const handleAddIceContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) return;

    const newContact: IceContact = {
      id: "ice_" + Date.now(),
      name: newContactName.trim(),
      relationship: newContactRel,
      phone: newContactPhone.trim(),
      secondaryPhone: newContactSecondaryPhone.trim() || undefined,
      email: newContactEmail.trim() || "",
      instagramHandle: newContactInstagram.trim() || undefined,
      isPrimary: uatProfile.contacts.length === 0,
    };

    const updated: UatProfile = {
      ...uatProfile,
      contacts: [...uatProfile.contacts, newContact],
    };
    onUpdateProfile(updated);

    setNewContactName("");
    setNewContactPhone("");
    setNewContactSecondaryPhone("");
    setNewContactEmail("");
    setNewContactInstagram("");
    setShowAddContactForm(false);

    if (onShowToast) {
      onShowToast("success", "ICE Contact Added", `${newContact.name} registered as emergency contact.`);
    }
  };

  const handleDeleteContact = (id: string) => {
    const updated: UatProfile = {
      ...uatProfile,
      contacts: uatProfile.contacts.filter((c) => c.id !== id),
    };
    onUpdateProfile(updated);
    if (onShowToast) {
      onShowToast("info", "Contact Removed", "ICE contact deleted from registry.");
    }
  };

  const handleSaveSocials = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UatProfile = {
      ...uatProfile,
      socials: {
        ...uatProfile.socials,
        alertEmail: socialAlertEmail.trim() || "",
        twitterHandle: socialTwitter.trim() || "",
        instagramHandle: socialInstagram.trim() || "",
        facebookProfile: socialFacebook.trim() || "",
      },
    };
    onUpdateProfile(updated);
    if (onShowToast) onShowToast("success", "Channels Saved", "Secondary alert channels saved.");
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Quick Distress Email Dispatch Button */}
      <a
        href={generateDistressEmailUrl(
          uatProfile.contacts[0] || {
            id: "fallback-ice",
            name: "ICE Guardian",
            email: uatProfile.socials.alertEmail || "emergency@example.com",
            phone: "",
            isPrimary: true,
            relationship: "Emergency Contact",
          }
        )}
        className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm"
      >
        <Share2 className="w-4 h-4 text-amber-400" />
        <span>Send Distress Alert via Email</span>
      </a>

      {/* Current Identified Area & Offline Maps Component */}
      <GoogleMapsSafeHavenView />

      {/* Action: Complete 5 ICE Contacts Progress Banner */}
      {uatProfile.contacts.length < 5 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-2xl p-4 space-y-2.5 text-xs">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Action: Complete 5 ICE Contacts ({uatProfile.contacts.length}/5)</span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            South African GBV protection guidelines advise configuring 5 verified In Case of Emergency contacts. Each contact receives 72-hour live beacons, mobile alerts, and social channel dispatch.
          </p>
          <button
            type="button"
            onClick={() => setShowAddContactForm(true)}
            className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black rounded-xl text-xs shadow-md transition-all"
          >
            Add ICE Contact #{uatProfile.contacts.length + 1}
          </button>
        </div>
      )}

      {/* UAT Status Alert */}
      <div
        className={`p-4 rounded-2xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
          isUatMode
            ? "bg-amber-950/40 border-amber-500/50 text-amber-200"
            : "bg-slate-900 border-slate-800 text-slate-300"
        }`}
      >
        <div>
          <div className="flex items-center gap-2 font-bold text-sm text-white">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{isUatMode ? "⚡ UAT Mode Active: Emergency Calls Suppressed" : "Operational Live Shield Active"}</span>
          </div>
          <p className="text-[11px] text-slate-300 mt-1">
            {isUatMode
              ? "In UAT Mode, emergency authorities are NOT called. The 5 registered ICE guardians & emergency email receive the simulated test telemetry."
              : "Live mode armed. SOS dispatches real emergency alerts."}
          </p>
        </div>
        <button
          type="button"
          onClick={onToggleUat}
          className="self-start sm:self-center px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-colors"
        >
          {isUatMode ? "Switch to Live Mode" : "Enable UAT Mode"}
        </button>
      </div>

      {profileSaveMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{profileSaveMessage}</span>
        </div>
      )}

      {/* 1. SURVIVOR EMERGENCY PROFILE */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsProfileExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
          aria-expanded={isProfileExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">1. Survivor Emergency Profile</h3>
                <span className="text-[10px] bg-slate-800 text-slate-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  POPIA SEC 26
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Full legal name, RSA ID & covert duress safe-word
              </p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {isProfileExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isProfileExpanded && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4">
            <form onSubmit={handleSaveProfile} className="space-y-3 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Full Legal Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Full Name"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">SA ID Number (13-Digit)</label>
                  <input
                    type="text"
                    maxLength={13}
                    value={saIdNumber}
                    onChange={(e) => setSaIdNumber(e.target.value)}
                    placeholder="e.g. 9001015000087"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Duress Safe-Word (Code Word)</label>
                  <input
                    type="text"
                    value={safeWord}
                    onChange={(e) => setSafeWord(e.target.value)}
                    placeholder="LAVENDER"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-amber-300 font-mono uppercase font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Medical Notes / Allergies</label>
                  <input
                    type="text"
                    value={medicalConditions}
                    onChange={(e) => setMedicalConditions(e.target.value)}
                    placeholder="e.g. Asthma, Penicillin allergy"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Save Personal Profile
              </button>
            </form>
          </div>
        )}
      </div>

      {/* 2. 5 ICE GUARDIANS SECTION */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsIceContactsExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
          aria-expanded={isIceContactsExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">2. Emergency ICE Guardians</h3>
                <span className="text-[10px] bg-amber-950 border border-amber-700/50 text-amber-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  {uatProfile.contacts.length} / 5 Registered
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive live GPS link, 72-hr WhatsApp beacons & multi-portal alerts
              </p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {isIceContactsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isIceContactsExpanded && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-400">
                Emergency guardians notified during duress PIN 9999 or SOS countdown.
              </p>
              {uatProfile.contacts.length < 5 && (
                <button
                  type="button"
                  onClick={() => setShowAddContactForm(true)}
                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>+ Add ICE</span>
                </button>
              )}
            </div>

            {/* Contact List */}
            <div className="space-y-3">
              {uatProfile.contacts.map((contact, idx) => (
                <div
                  key={contact.id || idx}
                  className="bg-slate-950 p-4 rounded-2xl border border-slate-800/90 space-y-3 text-xs shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-amber-400 font-bold shrink-0">
                        <User className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white text-sm">{contact.name}</span>
                          {contact.isPrimary && (
                            <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-700/60 px-2 py-0.5 rounded-full font-bold">
                              Primary ICE
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-xs mt-0.5">
                          {contact.relationship} • {contact.phone}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteContact(contact.id)}
                      className="text-slate-500 hover:text-rose-400 p-1"
                      title="Remove contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <a
                      href={`tel:${contact.phone}`}
                      className="flex-1 py-1.5 px-3 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <PhoneCall className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Call Guardian</span>
                    </a>
                    <a
                      href={generateWhatsAppBeaconUrl(
                        contact,
                        "beacon_72h_active",
                        getCachedLiveLocation() ? { lat: getCachedLiveLocation()!.lat, lng: getCachedLiveLocation()!.lng } : undefined
                      )}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1.5 px-3 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-300 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                      <span>WhatsApp Beacon</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Contact Modal / Subform */}
            {showAddContactForm && (
              <form onSubmit={handleAddIceContact} className="bg-slate-950 p-4 rounded-xl border border-amber-500/40 space-y-3">
                <h4 className="text-xs font-bold text-amber-300 uppercase tracking-wider">New ICE Guardian Details</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Full Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sipho Mthembu"
                      value={newContactName}
                      onChange={(e) => setNewContactName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Relationship</label>
                    <select
                      value={newContactRel}
                      onChange={(e) => setNewContactRel(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white"
                    >
                      <option value="Sister">Sister</option>
                      <option value="Brother">Brother</option>
                      <option value="Mother">Mother</option>
                      <option value="Father">Father</option>
                      <option value="Family Doctor">Family Doctor / Medical</option>
                      <option value="Legal Counsel">Legal Counsel / Advocate</option>
                      <option value="Close Friend">Close Friend</option>
                      <option value="Neighbor">Trusted Neighbor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Mobile Phone 1 (+27...)</label>
                    <input
                      type="tel"
                      required
                      placeholder="+27 82 000 0000"
                      value={newContactPhone}
                      onChange={(e) => setNewContactPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Mobile Phone 2 / Backup</label>
                    <input
                      type="tel"
                      placeholder="+27 71 000 0000"
                      value={newContactSecondaryPhone}
                      onChange={(e) => setNewContactSecondaryPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Email Address</label>
                    <input
                      type="email"
                      placeholder="guardian@example.co.za"
                      value={newContactEmail}
                      onChange={(e) => setNewContactEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1 text-[11px]">Instagram Handle (@...)</label>
                    <input
                      type="text"
                      placeholder="@guardian_safe"
                      value={newContactInstagram}
                      onChange={(e) => setNewContactInstagram(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors"
                  >
                    Save ICE Guardian
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddContactForm(false)}
                    className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* 3. HARDWARE & PERMISSIONS READINESS */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsPermissionsExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
          aria-expanded={isPermissionsExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">3. Hardware & Storage Readiness</h3>
                <span className={`text-[10px] border font-mono font-bold px-2 py-0.5 rounded-full ${
                  permissionsStatus.geolocation === "granted" && permissionsStatus.storage === "persisted"
                    ? "bg-emerald-950 text-emerald-300 border-emerald-700/50"
                    : "bg-amber-950 text-amber-300 border-amber-700/50"
                }`}>
                  {permissionsStatus.geolocation === "granted" && permissionsStatus.storage === "persisted" ? "All Active" : "Action Needed"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hardware GPS telemetry, vault durability & emergency notifications
              </p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {isPermissionsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isPermissionsExpanded && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-3 text-xs">
            {/* Geolocation Row */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="font-bold text-white">Live GPS Location Telemetry</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    permissionsStatus.geolocation === "granted"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-amber-950 text-amber-300 border-amber-700"
                  }`}>
                    {permissionsStatus.geolocation === "granted" ? "GRANTED" : "PROMPT / PENDING"}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Enables silent dispatch of high-precision coordinates during PIN 9999 and distance calculation to closest Thuthuzela Care Centre.
                </p>
              </div>
              <button
                type="button"
                onClick={onRefreshLocation}
                disabled={isLocating}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 hover:text-white rounded-lg font-bold text-xs shrink-0 border border-slate-700 transition-colors flex items-center gap-1"
              >
                <RotateCcw className={`w-3 h-3 ${isLocating ? "animate-spin" : ""}`} />
                <span>{isLocating ? "Acquiring..." : "Refresh GPS"}</span>
              </button>
            </div>

            {/* Storage Persistence Row */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-bold text-white">Vault Offline Durability (Storage Persistence)</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    permissionsStatus.storage === "persisted"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}>
                    {permissionsStatus.storage === "persisted" ? "PROTECTED" : "STANDARD"}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Protects your local encrypted domestic violence evidence vault against automated browser or OS cache evictions.
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestStorage}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white rounded-lg font-bold text-xs shrink-0 border border-slate-700 transition-colors"
              >
                {permissionsStatus.storage === "persisted" ? "Protected" : "Enable"}
              </button>
            </div>

            {/* Notifications Row */}
            <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Radio className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-bold text-white">Guardian Response Alerts (Notifications)</span>
                  <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                    permissionsStatus.notifications === "granted"
                      ? "bg-emerald-950 text-emerald-300 border-emerald-700"
                      : "bg-slate-800 text-slate-300 border-slate-700"
                  }`}>
                    {permissionsStatus.notifications === "granted" ? "ACTIVE" : "OPTIONAL"}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-1">
                  Receive alerts when emergency guardians acknowledge your distress beacons. Protected with action guard to prevent safe haven exit.
                </p>
              </div>
              <button
                type="button"
                onClick={onRequestNotifications}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-white rounded-lg font-bold text-xs shrink-0 border border-slate-700 transition-colors"
              >
                {permissionsStatus.notifications === "granted" ? "Enabled" : "Enable"}
              </button>
            </div>

            {/* Granular Survivor Notification Safety Controls */}
            <div className="p-3.5 bg-slate-900/90 rounded-xl border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-400" />
                    Survivor Safety Notification Profile
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Control how and when alerts appear to prevent an abuser from discovering notifications
                  </p>
                </div>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  {notifControls.deliveryLevel}
                </span>
              </div>

              {/* Delivery Level Radios / Chips */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => handleUpdateNotifControls({ deliveryLevel: "ULTRA_DISCREET" })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    notifControls.deliveryLevel === "ULTRA_DISCREET"
                      ? "bg-emerald-950/70 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>1. Ultra Discreet</span>
                    {notifControls.deliveryLevel === "ULTRA_DISCREET" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Zero banners, zero sound. Silent palm haptics only. Safest against screen inspection.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateNotifControls({ deliveryLevel: "DECOY_DISGUISED" })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    notifControls.deliveryLevel === "DECOY_DISGUISED"
                      ? "bg-emerald-950/70 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>2. Camouflage Disguised</span>
                    {notifControls.deliveryLevel === "DECOY_DISGUISED" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Alerts appear as innocent PowerCal SA electricity tariff syncs. Completely harmless.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateNotifControls({ deliveryLevel: "CONFIDENTIAL" })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    notifControls.deliveryLevel === "CONFIDENTIAL"
                      ? "bg-emerald-950/70 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>3. In-SafeHaven Only</span>
                    {notifControls.deliveryLevel === "CONFIDENTIAL" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Alerts only render when you are actively inside the unlocked vault. Suppressed elsewhere.
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => handleUpdateNotifControls({ deliveryLevel: "FULL_ALERTS" })}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    notifControls.deliveryLevel === "FULL_ALERTS"
                      ? "bg-emerald-950/70 border-emerald-500 text-white shadow-sm"
                      : "bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-900"
                  }`}
                >
                  <div className="font-bold text-emerald-400 flex items-center justify-between">
                    <span>4. Standard Direct Alerts</span>
                    {notifControls.deliveryLevel === "FULL_ALERTS" && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Visible emergency confirmation toasts with audible & haptic acknowledgments.
                  </p>
                </button>
              </div>

              {/* Granular Channel Toggles */}
              <div className="pt-2 border-t border-slate-800 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Channel Selection By Threat Level:
                </span>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
                  <div>
                    <span className="font-bold text-slate-200">Guardian Safe-Arrival Acknowledgments</span>
                    <p className="text-[10px] text-slate-400">Pings when your ICE contact confirms you reached safety</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifControls.enableGuardianArrivalAlerts}
                    onChange={(e) => handleUpdateNotifControls({ enableGuardianArrivalAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
                  <div>
                    <span className="font-bold text-slate-200">Safe Corridor & Journey Deviation Alerts</span>
                    <p className="text-[10px] text-slate-400">Subtle alerts if e-hailing or taxi deviates &gt;150m from designated route</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifControls.enableJourneyDeviationAlerts}
                    onChange={(e) => handleUpdateNotifControls({ enableJourneyDeviationAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
                  <div>
                    <span className="font-bold text-slate-200">Offline Safe-Haven Map Expiry Warnings</span>
                    <p className="text-[10px] text-slate-400">Notifies when 30-day offline municipal waypoint cache needs renewal</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifControls.enableOfflineMapExpiryAlerts}
                    onChange={(e) => handleUpdateNotifControls({ enableOfflineMapExpiryAlerts: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>

                <label className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/80 cursor-pointer hover:bg-slate-950">
                  <div>
                    <span className="font-bold text-slate-200">Mask Dispatched Alerts As Innocent Utility Statements</span>
                    <p className="text-[10px] text-slate-400">If abuser glances at screen, notifications display as STS electricity tokens</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifControls.disguiseAsUtilityText}
                    onChange={(e) => handleUpdateNotifControls({ disguiseAsUtilityText: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-500 accent-emerald-500 bg-slate-900 border-slate-700"
                  />
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Escape 'Go-Bag' Checklist */}
      <EscapeGoBagChecklist />

      {/* Your Rights Under South African Law */}
      <SouthAfricanLegalRights />

      {/* 4. SECURE SOCIAL & NOTIFICATION CHANNELS */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm">
        <button
          type="button"
          onClick={() => setIsSocialsExpanded((prev) => !prev)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-850/40 transition-colors"
          aria-expanded={isSocialsExpanded}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white">4. Secure Social & Outbox Accounts</h3>
                <span className="text-[10px] bg-slate-800 border border-slate-700 text-slate-300 font-mono font-bold px-2 py-0.5 rounded-full">
                  {uatProfile.socials.alertEmail ? "Configured" : "Optional"}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Secondary emergency alert email, X/Twitter, Instagram, and Facebook profiles
              </p>
            </div>
          </div>
          <div className="text-slate-400 p-1">
            {isSocialsExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </div>
        </button>

        {isSocialsExpanded && (
          <div className="p-4 pt-2 border-t border-slate-800/80 space-y-4">
            <p className="text-xs text-slate-400">
              Secondary channels monitored by your guardians to triangulate status when cellular voice lines are congested.
            </p>

            <form onSubmit={handleSaveSocials} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 text-[11px]">Emergency Alert Email</label>
                <input
                  type="email"
                  value={socialAlertEmail}
                  onChange={(e) => setSocialAlertEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                  placeholder="secure.vault.backup@proton.me"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">X / Twitter Handle</label>
                  <input
                    type="text"
                    value={socialTwitter}
                    onChange={(e) => setSocialTwitter(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    placeholder="@safe_user"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Instagram Profile</label>
                  <input
                    type="text"
                    value={socialInstagram}
                    onChange={(e) => setSocialInstagram(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    placeholder="@safe_user"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 mb-1 text-[11px]">Facebook ID / Profile</label>
                  <input
                    type="text"
                    value={socialFacebook}
                    onChange={(e) => setSocialFacebook(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono"
                    placeholder="facebook.com/safe.user"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-lg text-xs transition-colors"
              >
                Save Secondary Outbox Channels
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
