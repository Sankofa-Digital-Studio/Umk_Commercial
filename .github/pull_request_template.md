## Summary

<!-- Explain the problem, the chosen change, and the user-visible outcome. -->

## Linked work

Closes #

## Scope and risk

- Affected surfaces:
- Safety/privacy impact:
- Rollback approach:

## Verification

- [ ] Web tests pass (`cd web && npm test`), if applicable
- [ ] Web production build passes (`cd web && npm run build`), if applicable
- [ ] Android unit tests pass (`./gradlew testDebugUnitTest`), if applicable
- [ ] Android debug build passes (`./gradlew assembleDebug`), if applicable
- [ ] Primary flow and relevant denied-permission, offline, timeout, and failure paths were checked
- [ ] Documentation was updated for changed behavior, prerequisites, or limitations

## Safety review

- [ ] No protected state leaks into a facade, recent-app preview, notification, log, screenshot, or browser history
- [ ] No real survivor data, credentials, precise locations, or evidence appear in code, fixtures, screenshots, or logs
- [ ] Storage, retention, deletion, encryption, and consent boundaries were reviewed
- [ ] Emergency, medical, legal, and compliance language does not promise unverified outcomes

## Evidence

<!-- Add redacted screenshots, test output, recordings, or links to approved evidence. -->
