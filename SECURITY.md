# Security policy

Umkhuseli handles safety-sensitive workflows and may process highly sensitive personal information. Responsible, private disclosure is essential.

## Supported versions

Security fixes are prioritised for the latest release and the current `main` branch. Older APKs and historical tags may not receive fixes.

| Version | Supported |
|---|:---:|
| Latest release | Yes |
| `main` | Yes |
| Older releases | Best effort |

## Report a vulnerability privately

Use [GitHub private vulnerability reporting](https://github.com/Sankofa-Digital-Studio/Umk_Commercial/security/advisories/new). Do not open a public issue for a vulnerability.

Include only the minimum information needed to reproduce the problem:

- affected version, commit, platform, and component;
- impact and realistic threat scenario;
- reproducible steps or a minimal proof of concept;
- suggested mitigation, if known;
- whether exploitation could expose identity, location, contacts, evidence, credentials, or the protected interface.

Do not include real survivor data or attempt testing against a person, account, device, or service without explicit authorisation.

## Response process

Maintainers will acknowledge a complete report as soon as practical, assess severity and exploitability, coordinate remediation, and agree on disclosure timing. Safety-critical issues that could reveal protected state, bypass consent, expose evidence, or trigger unintended communications receive priority.

## Scope highlights

Relevant classes of weakness include:

- facade or rapid-exit information leakage;
- plaintext sensitive data in storage, logs, notifications, backups, or analytics;
- authentication, authorisation, RLS, or tenant-isolation failures;
- cryptographic misuse or insecure key lifecycle;
- location, contact, or evidence disclosure;
- forged, replayed, or unintended SOS requests;
- unsafe WebView, deep-link, intent, file-export, or dependency behavior.

This policy does not authorise social engineering, denial of service, physical testing, access to third-party data, or disruption of emergency and public services.
