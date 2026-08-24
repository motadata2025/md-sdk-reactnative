# Onboarding — Motadata React Native RUM SDK (Android)

> Draft — finalized in Phase 1/2 once package name & wire are confirmed on CI.

## Install
```bash
npm install @motadata/mobile-react-native
# or: yarn add @motadata/mobile-react-native
```

## Android native dependency
The SDK's Android bridge depends on the published Motadata Android SDK (pulled from Maven Central by your
app's Gradle build — no extra config needed):

```
com.motadata:motadata-rum-android:1.0.1
com.motadata:motadata-rum-android-core:1.0.1
com.motadata:motadata-rum-android-internal:1.0.1
com.motadata:motadata-rum-android-trace:1.0.1
com.motadata:motadata-rum-android-trace-api:1.0.1
com.motadata:motadata-rum-android-trace-internal:1.0.1
com.motadata:motadata-rum-android-okhttp:1.0.1
```

Ensure `mavenCentral()` is in your app's repositories (default for RN apps).

## Initialize (shape mirrors upstream; names rebranded in Phase 1)
```ts
import { MotadataProvider, MotadataProviderConfiguration } from '@motadata/mobile-react-native';

const config = new MotadataProviderConfiguration(
  '<CLIENT_TOKEN>',   // becomes md-api-key
  '<ENV>',
  '<APPLICATION_ID>',
  true,               // trackInteractions
  true,               // trackResources
  true,               // trackErrors
);
config.customEndpoint = 'https://<your-motadata-intake>';  // on-prem endpoint
```

## Scope this round
- **Android only** (iOS deferred).
- **RUM** (+ distributed trace + okhttp resource tracking). Logs / Session Replay / WebView / NDK / Feature
  Flags are **not** available on Android this round (no Motadata native artifact).

## What reaches the backend
`mdsource=react-native`, `md-api-key`, `session.created`, `_md.document_version`. See EVENT_TYPES.md.
