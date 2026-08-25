# Motadata React Native RUM — Client Integration SOP

How to add the **Motadata React Native RUM SDK** to a React Native (Android) app and send RUM data
to a Motadata custom endpoint (HTTP or HTTPS). Three steps: **S‑1 Install → S‑2 Initialize (config +
provider) → S‑3 Auto view tracking (react-navigation)**.

> This is the **canonical client SOP**. Packages (current version **`1.0.0`**, distributed via **npm**):
> - `@motadata365/mobile-react-native` — the core RUM SDK
> - `@motadata365/mobile-react-navigation` — automatic View tracking for `react-navigation`

> **What `1.0.0` includes** (all **automatic — no extra app code**):
> - **`md-api-key` query param** on every request (the param your Motadata intake authenticates on)
> - **`mdsource=react-native`** query param (identifies the SDK platform)
> - **`session.created`** (epoch‑ms) and **`_md.document_version`** on view state
> - **view, action, resource, error, long_task, and crash** events, each carrying the Motadata `_md` envelope

## Prerequisites
- A React Native app targeting **Android** (`minSdkVersion` ≥ 24 — the React Native default).
- [`react-navigation`](https://reactnavigation.org/) already installed and set up in your app
  (`@react-navigation/native` + its peers). Auto view tracking (S‑3) attaches to it.
- From the client's Motadata org: **RUM application id** and **client token**.
- **No credentials needed to fetch the SDK** — the JS packages are on **public npm** (no auth token),
  and the Android native SDK is on **Maven Central** (a default Gradle repository — no GitHub PAT).
- Android native artifacts (pulled **transitively** by Gradle, current version **`1.0.1`** — nothing to add by hand):
  - `com.motadata:motadata-rum-android:1.0.1`
  - `com.motadata:motadata-rum-android-trace:1.0.1` *(+ transitive `-core`, `-internal`, `-okhttp`, `-trace-api`, `-trace-internal`)*

---

## S‑1 — Install

### 1a. Install the packages — project root
```sh
npm install @motadata365/mobile-react-native @motadata365/mobile-react-navigation
# or: yarn add @motadata365/mobile-react-native @motadata365/mobile-react-navigation
```

> **Android only this round.** Do **not** run `cd ios && pod install` — iOS is not shipped.

### 1b. Android native dependency — nothing to configure
The SDK's Android bridge declares `com.motadata:motadata-rum-android:1.0.1` (+ trace) itself, and your
app's Gradle build resolves them **transitively from Maven Central**. Ensure `mavenCentral()` is in your
app repositories (the default for React Native apps) — **no custom repo, no credentials**.

### 1c. Manifest — `android/app/src/main/AndroidManifest.xml`
Add the INTERNET permission (usually already present). **Only if your Motadata endpoint is plain HTTP**,
allow cleartext (globally as below, or scoped via a `network-security-config`). For HTTPS endpoints, omit
`usesCleartextTraffic`.
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:usesCleartextTraffic="true">   <!-- only for HTTP endpoints -->
        <!-- ... -->
    </application>
</manifest>
```

---

## S‑2 — Initialize the SDK (config file + provider)

### 2a. Create the configuration — `motadataConfig.ts`
Create one file next to your `App.tsx`. The whole block below builds the configuration, points RUM at
your **custom endpoint**, and enables the RUM features.
```ts
import {
  MotadataProviderConfiguration,
  TrackingConsent,
} from '@motadata365/mobile-react-native';

export const motadataConfig = new MotadataProviderConfiguration(
  '<MOTADATA_CLIENT_TOKEN>',   // → becomes the md-api-key on the wire
  '<ENVIRONMENT_NAME>',        // e.g. 'prod', 'staging', 'dev'
  TrackingConsent.GRANTED,
  {
    additionalConfiguration: {
      '_dd.needsClearTextHttp': true,   // HTTP ENDPOINT ONLY — remove this line for https://
    },
    service: '<your-app-service-name>',  // optional; e.g. 'my-react-native-app'
    rumConfiguration: {
      applicationId: '<MOTADATA_RUM_APPLICATION_ID>',
      customEndpoint: 'http://<your-motadata-host>:<port>/api/v2/rum/', // your Motadata intake
      trackInteractions: true,   // taps/clicks → action events
      trackResources: true,      // XHR/fetch → resource events
      trackErrors: true,         // JS errors → error events
      nativeCrashReportEnabled: true, // native (Android/JVM) crashes → crash events
      trackNonFatalAnrs: true,   // main-thread hangs → error events
      longTaskThresholdMs: 100,  // JS thread stalls > 100ms → long_task events
      sessionSampleRate: 100,    // % of SESSIONS sent (0–100); 100 = all. Lower to sample.
      useAccessibilityLabel: true, // use accessibilityLabel to name tap actions
    },
  },
);
```

> **No `site` needed:** with `customEndpoint` set, the site is never used for routing — so there's no
> `site` field. (If you leave one in, it is simply ignored.)
>
> **Session sampling:** `sessionSampleRate: 100` sends every session. It's all‑or‑nothing per session —
> a sampled‑out session sends **no** events.

### 2b. Wrap your app root — `App.tsx`
Wrap the content of your `App` component in a `MotadataProvider`, passing it the config.
```tsx
import React, { useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { MotadataProvider } from '@motadata365/mobile-react-native';
import { MdRumReactNavigationTracking } from '@motadata365/mobile-react-navigation';
import { motadataConfig } from './motadataConfig';

function App(): React.JSX.Element {
  const navigationRef = useRef(null);

  return (
    <MotadataProvider configuration={motadataConfig}>
      <NavigationContainer
        ref={navigationRef}
        onReady={() => {
          // S-3: start automatic View tracking (see below)
          MdRumReactNavigationTracking.startTrackingViews(navigationRef.current);
        }}>
        {/* ... your Stack.Navigator / screens ... */}
      </NavigationContainer>
    </MotadataProvider>
  );
}

export default App;
```

### ⚠️ Cleartext HTTP endpoint — requires TWO things
If your Motadata endpoint is plain **`http://`** (not `https://`), you must enable cleartext in **both**
places — either one alone is not enough:
1. **OS / manifest** — `android:usesCleartextTraffic="true"` (or a scoped `network-security-config`), from S‑1c.
2. **SDK** — `'_dd.needsClearTextHttp': true` inside `additionalConfiguration` (S‑2a above), or the SDK
   rejects the `http://` endpoint.

**For an `https://` endpoint:** remove the `'_dd.needsClearTextHttp'` line and omit
`usesCleartextTraffic` — neither is needed.

---

## S‑3 — Automatic View tracking (`react-navigation`)

Views (screen changes) are tracked automatically by the `@motadata365/mobile-react-navigation` package.
Set the `onReady` callback of your `NavigationContainer` (shown in S‑2b) to call
`MdRumReactNavigationTracking.startTrackingViews(navigationRef.current)`. Every route change then becomes
a RUM **view** event — no per-screen code.

> **Note**: only one `NavigationContainer` can be tracked at a time. To track a different one, first call
> `MdRumReactNavigationTracking.stopTrackingViews()` on the previous reference.
>
> **Optional predicates** — `startTrackingViews` accepts a second `NavigationTrackingOptions` argument to
> rename views, skip views, or filter navigation params. See the package README.

---

## Verify
Rebuild and run the app on an Android device/emulator, then exercise it (open screens, tap buttons, make
network calls).
```
npx react-native run-android
```
Runtime checks:
- Request hits your **custom Motadata host**; the query is `mdsource=react-native&md-api-key=<clientToken>`
- Headers are `MD-API-KEY`, `MD-EVP-ORIGIN`, `MD-EVP-ORIGIN-VERSION`, `MD-REQUEST-ID`, `MD-IDEMPOTENCY-KEY`
- Event bodies use `"_md"`; view events carry `session.created` and `_md.document_version`
- Navigating between screens produces **view** events; tapping produces **action** events; `fetch`/XHR
  produces **resource** events; thrown errors produce **error** events
- Endpoint returns **200/202** (with a valid registered token) — and events appear in the client's
  Motadata org. *(A `401` means the `md-api-key`/token isn't recognized by the intake.)*

To watch the native SDK on Android: `adb logcat -s Motadata`.

---

## Notes
- **Replace all placeholders:** `<MOTADATA_CLIENT_TOKEN>`, `<MOTADATA_RUM_APPLICATION_ID>`,
  `<ENVIRONMENT_NAME>`, `<your-app-service-name>`, `http://<your-motadata-host>:<port>/api/v2/rum/`.
- The `md-api-key` is taken automatically from your `clientToken` — nothing extra to configure for auth.
- **Scope this round — RUM only (Android):** views, actions, resources, errors, long tasks, native crashes,
  and distributed tracing. **Not available:** Logs, Session Replay, WebView tracking, NDK (C/C++) crash
  reporting, and Feature Flags (no Motadata native artifact for these).
- Optional add‑ons (only if needed): `MdRum.startView(...)` / `MdRum.addAction(...)` for manual events,
  global attributes, and user info via `MdSdkReactNative.setUserInfo(...)`. Add these separately so each
  can be verified.
