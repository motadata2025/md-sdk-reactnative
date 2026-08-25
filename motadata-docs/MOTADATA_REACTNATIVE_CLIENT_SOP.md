# Client SOP — Motadata React Native RUM SDK (Android)

> Draft — finalized alongside the onboarding doc after Phase 2 wire verification.

## Prerequisites
- React Native app (old architecture supported; base is RN SDK 3.5.3-lineage).
- A Motadata RUM application id + client token, and the on-prem intake endpoint URL.
- Android `minSdk >= 24`, `mavenCentral()` in repositories.

## Steps
1. `npm install @motadata365/mobile-react-native`.
2. Initialize early in app startup (see ONBOARDING) with `clientToken`, `env`, `applicationId`,
   and `customEndpoint`.
3. Build & run the Android app. RUM sessions start automatically.

## Verify data is flowing
- On a debug build, inspect the outgoing intake requests (Logcat / proxy). Confirm:
  - URL: `…/api/v2/rum?mdsource=react-native&md-api-key=<token>…`
  - Body envelope uses `_md`, includes `session.created` and `_md.document_version`.
  - **No** `datadog` / `dd-` / `ddsource` / `_dd` tokens anywhere.
- Confirm events appear in the Motadata RUM backend for your `applicationId`.

## Support scope this round
RUM only, Android only. iOS and Logs/SessionReplay/WebView/NDK/Flags are follow-ups.
