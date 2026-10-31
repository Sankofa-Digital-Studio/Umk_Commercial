# Contributing to Umkhuseli

Thank you for helping improve Umkhuseli. This is a safety-sensitive codebase: a seemingly small UI, logging, storage, or notification change can increase risk for a person whose device is being monitored.

## Before you begin

- Read the [README](README.md), [security policy](SECURITY.md), and relevant architecture documents.
- Search the [issue tracker](https://github.com/Sankofa-Digital-Studio/Umk_Commercial/issues) and [project board](https://github.com/orgs/Sankofa-Digital-Studio/projects/7) before proposing new work.
- Never post real survivor data, credentials, precise locations, phone numbers, evidence, or unredacted screenshots.
- Report vulnerabilities privately through [GitHub Security Advisories](https://github.com/Sankofa-Digital-Studio/Umk_Commercial/security/advisories/new).

## Development setup

### Web

```bash
cd web
npm ci
npm test
npm run build
```

The web workspace requires Node.js 22.19.0 or newer.

### Android

```bash
./gradlew testDebugUnitTest
./gradlew assembleDebug
```

On Windows, use `gradlew.bat`. The Android build requires JDK 21 and Android SDK 36.

## Change workflow

1. Open or reference an issue that defines the problem and acceptance criteria.
2. Create a focused branch from `main`.
3. Keep changes small enough to review and verify independently.
4. Add or update tests for behavior changes.
5. Run the relevant web and/or Android verification commands.
6. Open a pull request using the repository template and link the issue.

## Safety review checklist

Changes affecting protected flows should explicitly address:

- facade isolation and rapid-exit behavior;
- plaintext logs, screenshots, notifications, recent-app previews, and browser history;
- encryption boundaries, key handling, retention, deletion, and backup behavior;
- denied permissions, offline mode, timeouts, retries, and partial provider failures;
- consent and data minimisation;
- accessibility and low-end-device behavior;
- whether language could overstate emergency, medical, legal, or compliance guarantees.

## Code and documentation standards

- Prefer clear, testable modules over hidden coupling.
- Keep secrets out of source control and use `.env.example` for documented placeholders only.
- Treat external integrations as unavailable until configuration and failure paths are verified.
- Label simulations, prototypes, and roadmap capabilities accurately.
- Link legal or public-service claims to current primary sources.
- Update the README or relevant documentation when behavior, prerequisites, or limitations change.

## Pull-request acceptance

A change is ready for review when CI passes, the linked acceptance criteria are evidenced, safety-sensitive failure paths are covered, and the documentation describes the behavior without unsupported claims.
