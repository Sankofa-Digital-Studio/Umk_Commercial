# Changelog

## [2.6.1] - 2026-10-30

### Changes
* feat(safehaven): make TCC forensic badges interactive with swipable service guidance modal (04a935a)
* feat(tcc): add interactive clinical service info modal and refresh statutory dossier (66a1888)
* chore: ignore .vercel and local env files (8b0a14f)
* fix(build): resolve strict TypeScript types for clean production build and deployment (e6410b7)
* Merge remote-tracking branch 'studio/main' (01672ca)
* feat(camouflage): implement Face 4 Native Android Launcher facade and configure ishekomberera public domain (82294f9)
* feat(disguise): introduce Coco Bongo music camouflage facade and expand disguise catalog (03ff523)


All notable changes to **Umkhuseli: The Protector** (also known as *Sankofa Safe*) will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.6.0] - 2026-10-27 - Chameleon Facades & Android Launcher Suite (Sankofa Digital Commercial Release)

> [!IMPORTANT]
> **Commercial Release Governance & Demarcation Notice**:
> - **FNB_AOTY_2026 Hackathon Baseline is `v2.5.0`**: Final, frozen evaluation baseline submitted for First National Bank App of the Year 2026, hosted publicly for 14 calendar days strictly for accredited Hackathon judges, adjudicators, and mentors.
> - **Commercial Continuation is `v2.6.0` (Latest)**: Developed, maintained, and deployed on this commercial repository (`https://github.com/Sankofa-Digital-Studio/Umk_Commercial.git`) under Sankofa Digital's full and exclusive intellectual property ownership.
> - **Public-Facing Decoy Domain**: Deployed to production at `https://ishekomberera.vercel.app`.

### Added
- **'The Mask' Chameleon Camouflage Architecture (4 Dynamic Disguise Facades)**:
  - **Face 1: PowerCalc SA** (`MunicipalPrepaidCalculator.tsx`): Authentic municipal prepaid utility calculator supporting Eskom, City of Johannesburg, Cape Town, eThekwini, Tshwane, and Mangaung STS-6 token vending, tariff breakdown charts, and PDF receipt downloads.
  - **Face 2: Coco Bongo Beats** (`CocoBongoMusicFacade.tsx`): South African music streaming player featuring Amapiano, Afro House, Gospel, and Maskandi curated playlists, vinyl spinning album art, audio scrubbers, and offline caching decoys.
  - **Face 3: GraceShare Bible SA / Izwi LeNkosi** (`DailyDevotionalFacade.tsx`): Faith-based devotional portal with multilingual scriptures (English, isiZulu *IBhayibheli Elingcwele*, Sesotho *Bibele*), downloadable verse cards for WhatsApp Status, and WhatsApp-style voice note sermons with audio waveforms (1.0x, 1.5x, 2.0x speeds).
  - **Face 4: Ipkiss Minimalist Launcher** (`AndroidLauncherFacade.tsx` & `launcher/*`): Native Android home screen interface for standalone PWA and APK environments featuring realistic clock widget, weather badge, Google search bar, app drawer grid, dock, and dialer modal.
- **Unified Covert Security & Sensor Matrix**:
  - **Universal Safe Haven Unlock (PIN 8426)**: Supported uniformly across search inputs, concordance keypads, dialpad (`*#8426#`), and audio duration scrubber (`08:42`).
  - **Covert Multi-Tap Gestures**: 3-tap rapid gesture on municipal crest, 3-tap gesture on spinning vinyl album art, or 4-tap gesture on scripture cross within 800-1000ms.
  - **Universal Silent Duress SOS (PIN 9999)**: Submitting `9999` silently dispatches a high-priority distress beacon to 5 ICE guardians while displaying realistic decoys (STS Error 30 terminal, track queued `#9999`, intercession prayer confirmation, or carrier MMI dialer decoy `Call forwarding unconditional: Voice disabled`).
  - **Long-Press Duress Trigger**: Long-pressing the Favorite Heart for 4 consecutive seconds silently triggers duress dispatch.
  - **0ms Instant Panic Camouflage Guarantee**: Escape key, double-tap background, or Android hardware back/home instantly resets UI to the active camouflage facade with synchronous RAM memory wiping and cryptographic keystore purging.
- **State Management & Disguise Catalog (`disguiseManager.ts` v2.6.0)**:
  - Multi-persona switching across `MUNICIPAL_PREPAID`, `MUSIC_PLAYER`, `DAILY_DEVOTIONAL`, and `ANDROID_LAUNCHER`.
  - Obfuscated localStorage persistence (`umkhuseli_active_disguise`) and custom window event broadcasting (`umkhuseli_disguise_change`).
  - Public-facing production domain configuration: `ishekomberera.vercel.app`.
- **Architectural Preservation & Invariants**:
  - Safe Haven cryptographic core (`SafeHavenDashboard.tsx`, AES-256-GCM vault, ECTA Section 15 affidavit generation, Audio Sentry, SOS emergency service) remains completely untouched and isolated.
- **Automated Test Suite Expansion**:
  - Added `androidLauncherFacade.test.tsx` (12 tests) verifying home screen rendering, dialer unlock (`*#8426#`), duress SOS (`*#9999#`), app routing, and Android navigation.
  - Added `cocoBongoMusicFacade.test.tsx` (9 tests) verifying music player UI, playback toggling, genre filtering, covert 3-tap album art unlock, scrubber unlock (`08:42`), and duress triggers.
  - Added `dailyDevotionalFacade.test.tsx` (8 tests) verifying multilingual scriptures, bookmarks, search unlock (`8426`), prayer duress (`9999`), and 4-tap cross gesture.
  - Updated `disguiseManager.test.ts` (9 tests) verifying catalog integrity and state persistence.
  - Total passing automated tests: 231 tests across 32 test suites (100% green).

---

## [2.5.0] - 2026-10-26 - Final Hackathon MVP Release (FNB AOTY 2026)

### Added
- **Covert SOS Duress PIN 9999 & STS Terminal Emulation**:
  - Implemented covert duress PIN `9999` in the prepaid meter interface that realistically emulates an STS Error 30 (KRN2 key revision expired) failure terminal screen while silently dispatching high-priority background distress payloads.
  - Zero visible alert, countdown, or emergency notification on the perpetrator-facing screen during duress entry.
- **Anti-Forensic Safeguards & Evasion Engine**:
  - Task-switcher snapshot blur and evasion preventing visual capture when backgrounding the application.
  - De-identified local storage key obfuscation (`_sys_cfg_*`, zero plain text "GBV", "SOS", "Vault", or "Victim" references).
  - 0ms panic memory scrubbing: instantaneous RAM wiping, crypto keystore purging, and DOM destruction on panic trigger.
- **Multi-Portal Loadshedding-Resilient Emergency Dispatch**:
  - Automated fallback dispatch cascade: encrypted Webhook -> Zero-airtime USSD (`*120*7867#`) -> Carrier SMS -> WhatsApp SOS API -> Fallback Email/Social notification channels.
  - Geolocation accuracy scoring with reverse-geocoded South African suburb/landmark tagging.
- **Live Eskom Loadshedding Stage Intelligence**:
  - Integrated national and municipal Eskom loadshedding stage tracking with edge caching and offline fallback, alerting survivors and guardians of impending grid blackout vulnerabilities.
- **Live Hardware Device Telemetry**:
  - Real-time battery status, charging state, cellular/Wi-Fi connection strength, and GPS accuracy tracking attached to all distress dispatches for first-responder situational awareness.
- **5 Configurable ICE Guardians & Bidirectional Ack Protocol**:
  - Expanded trusted contacts from 3 to 5 configurable In-Case-of-Emergency (ICE) guardians with SMS/WhatsApp dispatch prioritization.
  - Bidirectional ACK acknowledgement tracking showing guardian reception confirmations in real-time.
  - Interactive User Acceptance Testing (UAT) simulation mode to test end-to-end alert pipelines safely without triggering live emergency services or law enforcement dispatches.
- **Survivor Onboarding & Safe Haven Experience**:
  - Interactive first-time survivor onboarding walkthrough with step-by-step guidance on disguise activation and emergency panic controls.
  - Comprehensive runtime App Permissions verification and troubleshooting guide.
  - Expandable, accessible safe haven resource cards with offline direction calculation.
- **ECTA Section 15 Form 2 Statutory Court Affidavit Generator Upgrade**:
  - Fully upgraded PDF court evidence package complying with Section 15 of the Electronic Communications and Transactions Act 25 of 2002 and Form 2 of the Domestic Violence Act 116 of 1998.
  - Embedded cryptographic SHA-256 hash chains, timestamped tamper-evident audit trails, digital survivor sign-off, and SAPS/Magistrate clerk filing checklists.
- **PowerCal SA Municipal Prepaid Portal Overhaul**:
  - Realistic utility Single Page Application disguise featuring accurate South African municipal tariff calculations (Eskom, City of Joburg, City of Cape Town, eThekwini, Tshwane, Mangaung), 20-digit STS token generation, and PDF utility receipt downloads.

### Improved & Fixed
- **Accessibility (a11y) & Performance Enhancements**:
  - WCAG 2 AA/AAA color contrast compliance across both light and dark utility themes.
  - Touch target hitboxes expanded to 32px-48px for high-stress mobile usability.
  - Interaction to Next Paint (INP) optimizations utilizing React 18 `startTransition` to eliminate input latency during rapid disguise toggling.
  - Viewport scaling enabled (`maximum-scale=5.0`, `user-scalable=yes`) for accessibility magnification.
  - Label-in-Name and semantic ARIA landmark corrections across all decoy and vault interfaces.
- **Automated Test Suite Maturity**:
  - 28 test suites with 193 automated unit, integration, and UI tests passing in Vitest with 100% green status.

---

## [2.4.0] - 2026-10-26

### Added
- **FNBAOTY Mentor Feedback Alignment & 5-Feature MVP Baseline**:
  - Formalized the **Definitive 5 Core MVP Features** for the hackathon showcase:
    1. **Chameleon Camouflage & 0ms Exit**: Multi-platform disguise engine with Android Launcher Mode (*Sankofa Wisdom*), Android App Decoy Mode (*PowerCal SA*), and Web/iOS Safari PWA (*PowerCal SA* on Vercel).
    2. **Tamper-Evident Evidence Vault**: On-device AES-256-GCM encrypted incident logging with SHA-256 cryptographic hash chaining complying with Section 15 of the Electronic Communications and Transactions Act (ECTA 25 of 2002).
    3. **Loadshedding-Resilient Emergency Dispatch**: Duress PIN `9999` masquerading as a meter voucher receipt, 3-second tactile abort countdown, and carrier-aware SMS/GPS beacon fallback.
    4. **Statutory Form 2 DVA Court Preparation Pack**: Structured affidavit mapping aligning incident records with the Domestic Violence Act 116 of 1998 (as amended by Act 14 of 2021) for Magistrates Court clerks.
    5. **Offline 9-Province Thuthuzela Care Centre (TCC) & 72-Hour PEP Navigator**: Complete offline directory of all public TCCs across all 9 South African provinces with critical guidance for HIV PEP and J88 clinical examinations.
- **Multi-Platform Disguise Architecture**:
  - Documented dual-option native disguise on Android: Full Launcher/Theme mode (`LauncherFacadeScreen`) and standalone decoy app mode (`PowerCal SA`).
  - Standardized Web PWA & iOS Safari deployment on Vercel running *PowerCal SA* to ensure zero App Store or Play Store forensic trace for survivors facing physical device surveillance.
- **Safety, Trust & Legal Reality Disclaimers**:
  - Clarified ECTA Section 15 evidentiary limits: data messages corroborate sworn affidavits and contemporaneous evidence rather than replacing human witness or clinical testimony.
  - Transparent anti-surveillance guidance: documented limitations of app hiding against system-level logs (Play Store history, battery usage), recommending incognito web PWA for high-surveillance threat models.
- **Strategic Roadmap Realignment**:
  - Re-allocated remaining 7 advanced repository features (Bolt/Taxi Trip Sentinel, Audio Sentry acoustic distress classifier, OPRF PSI Private Contact Discovery, P2P Wi-Fi Direct Nearby Share, Touched by an Angel Citizen First-Responder KYC Network, Direct Carrier VAS Airtime Tokens, and Pseudonymous Community Forum) into post-hackathon Phase 2 & 3 roadmaps.

---
## [2.3.0] - 2026-10-25

### Added
- **Android 14+ Doze Mode Location Foreground Service (`CamouflagedEmergencyForegroundService`)**:
  - Implements an ongoing foreground service (`foregroundServiceType="location"`) to ensure emergency telemetry and GPS beacons survive Android Doze mode and OEM battery optimizations.
  - Camouflaged system notification ("PowerCalc SA: Tariff Monitor") with zero visible references to "SOS", "Emergency", or "GBV" to prevent adversary discovery.
  - Coroutine-driven periodic location polling with wake-lock support.
- **Hardware StrongBox Security Module Support (`VaultEncryptionHelper`)**:
  - Upgrades KeyStore master key provisioning to prioritize Android StrongBox Hardware Security Modules (`setIsStrongBoxBacked(true)`) on supported devices (API 28+).
  - Graceful hardware fallback to standard Trusted Execution Environment (TEE) when StrongBox hardware is absent.
- **Zero-Knowledge Encrypted Offline Outbox (`offlineOutbox.ts`)**:
  - Stage 6 load-shedding resilience matrix for South African cellular blackout conditions.
  - Incident drafts and SOS distress beacons are queued locally using client-side AES-256-GCM encryption before storage.
  - Automatic `'online'` window event listener drains queued payloads as soon as network connectivity is restored.
  - Zero-airtime offline fallback routing (USSD `*120*7867#` and SMS dispatch).
- **Test Coverage Expansion**:
  - Added unit test suite for `CamouflagedEmergencyForegroundService` (`CamouflagedEmergencyForegroundServiceTest.kt`).
  - Added unit test suite for `offlineOutbox` (`offlineOutbox.test.ts`), bringing web test coverage to 19 suites (155 passing tests).

### Fixed
- Resolved ambiguous coroutine imports and missing `finally` cleanup in `ExampleRobolectricTest.kt`.
- Resolved ambient type declaration discrepancies in `web/src/vite-env.d.ts` for Lucide icons (`Share`, `Share2`, `PlusSquare`, `SquarePlus`, `Fingerprint`, `FingerprintPattern`).
- Green GitHub Actions CI matrix validation across Android JDK 21 unit tests and Web PWA bundle builds.

---

## [2.2.0] - 2026-10-25

### Added
- **iOS File Sharing & Safari PWA Stealth Suite**:
  - Native iOS WebKit share sheet adapter (`iosFileShare.ts`) enabling direct save of Form 2 protection order PDFs to iCloud Drive or iOS Files.
  - Discreet PWA installation guide modal for Safari (`IosInstallGuideModal.tsx`).
  - Storage persistence manager ensuring client-side evidence vaults resist WebKit 7-day eviction policies.
- **WebAuthn Biometric Passkey Integration (`webAuthnBiometrics.ts`)**:
  - Hardware-backed Touch ID / Face ID authentication for evidence vault unlocking.
  - Duress PIN fallback (PIN `9999`) to silently wipe sensitive UI state and dispatch panic alarms.

---

## [2.1.0] - 2026-10-25

### Added
- **Multi-Persona Disguise Matrix (`disguiseManager.ts`)**:
  - Real-time facade switching between Municipal Prepaid Electricity Calculator, Daily Devotional Scripture Facade, South African Weather Monitor, and Recipe Book.
  - Instant panic lock controls: hardware `Escape` key, rapid double-tap root gesture, proximity face-down sensor trigger, and browser visibility change lock.
- **AudioSentry Acoustic Distress Detection (`audioSentryService.ts`)**:
  - Web Audio API microphone stream analysis with discrete decibel spike and acoustic stress detection.
- **Route Corridor Sentinel (`routeCorridorSentinel.ts`)**:
  - Live GPS breadcrumb trail logging with geofenced corridor drift calculations for high-risk transit routes across South Africa.
- **ICE Referral Service (`iceReferralService.ts`)**:
  - Automated WhatsApp dispatch message builder with GPS coordinates, Find My Device URLs, and survivor identity details.

---

## [2.0.0] - 2026-10-25

### Added
- **Cross-Platform Zero-Install PWA (Progressive Web App)**:
  - Vite-powered PWA with full offline caching via Workbox service workers.
  - Complete parity with Android core safety features for zero-install browser usage.
  - WebCrypto AES-256-GCM authenticated encryption and SHA-256 hashing.
  - South African 13-digit ID validator with Luhn algorithm and gender/citizenship parsing (`saIdValidator.ts`).

---

## [1.1.0] - 2026-10-24

### Added
- **ECTA Section 15 & Form 2 Domestic Violence Affidavit Generator (`ectaSection15Pdf.ts`)**:
  - Automated generation of court-admissible PDF documentation complying with Section 15 of the Electronic Communications and Transactions Act 25 of 2002.
  - Incorporates Form 2 Protection Order statutory declarations, J88 medical report references, and SAPS station details.
- **Zero-Install Ephemeral Responder Console (`GuardianTrackerView.tsx`)**:
  - Lightweight console for emergency contacts and community responders.
  - Displays live telemetry (battery level, cellular signal, GPS accuracy, 72-hour beacon status) and Google Maps route navigation.
- **Daily Devotional Camouflage Facade (`DailyDevotionalFacade.tsx`)**:
  - Authentic offline scripture reader in English, isiZulu (*IBhayibheli Elingcwele*), and Sesotho (*Bibele*).
  - Hidden concordance keypad for secret PIN unlock (`8426`).

---

## [1.0.0] - 2026-10-23

### Added
- **Dual-Persona Android Application**:
  - Surface launcher facade disguised as *PowerCalc SA* (Eskom & Municipal Prepaid Electricity Calculator).
  - Concealed *Umkhuseli Safe Haven* dashboard accessible via secret calculation sequences or discreet hardware triggers.
- **Hardware Distress Triggers**:
  - Triple-press volume button listener, device shake detector, and proximity face-down flip sensor.
- **Evidence Vault & Encryption**:
  - Room database backed with AES-256-GCM encryption for incident statements, photos, and emergency logs.
- **South African National GBV Directory**:
  - Comprehensive directory of verified Thuthuzela Care Centres (TCCs) across all 9 provinces.
  - Direct integration with SAPS 10111, GBV Command Centre (`0800 428 428`), and USSD zero-airtime service (`*120*7867#`).
