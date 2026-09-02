# Motadata React Native RUM — Client Integration SOP

How to add the **Motadata React Native RUM SDK** to a React Native (Android) app and send RUM data
to a Motadata custom endpoint (HTTP or HTTPS). Three steps: **S‑1 Install → S‑2 Initialize (config +
provider) → S‑3 Auto view tracking (react-navigation)**.

> This is the **canonical client SOP**. Packages (distributed via **npm**; install pulls the latest):
> - `@motadata365/mobile-react-native` — the core RUM SDK (current **`1.0.1`**)
> - `@motadata365/mobile-react-navigation` — automatic View tracking for `react-navigation` (current **`1.0.0`**)

> **What the SDK includes** (all **automatic — no extra app code**):
> - **`md-api-key` query param** on every request (the param your Motadata intake authenticates on)
> - **`mdsource=react-native`** query param (identifies the SDK platform)
> - **`session.created`** (epoch‑ms) and **`_md.document_version`** on view state
> - **view, action, resource, error, long_task, and crash** events, each carrying the Motadata `_md` envelope

## Supported versions
Everything the SDK needs, and the exact versions it supports. `npm install` (S‑1) pulls the latest
published packages; the native Android artifacts are resolved **transitively** from Maven Central — you add
nothing by hand.

| Component | Supported | Notes |
|---|---|---|
| `@motadata365/mobile-react-native` (core RUM) | **1.0.1** | npm; install pulls the latest |
| `@motadata365/mobile-react-navigation` (auto View tracking) | **1.0.0** | npm; needed **only** for automatic `react-navigation` views |
| **React Native** | **`>=0.63.4 <1.0`** | SDK peer dependency |
| **React** | **`>=16.13.1`** | SDK peer dependency |
| **Android `minSdkVersion`** | **≥ 24** | React Native's default; the native SDK itself needs ≥ 23 |
| **Platform** | **Android only** (this round) | iOS is not shipped — do **not** run `pod install` |
| **`react-navigation`** | **v5 or v6** — *v7 is not supported* | Only required for **automatic** View tracking (S‑3). v7 removed the `removeListener` API the tracker relies on. Apps not on `react-navigation` use manual `MdRum.startView`/`stopView` instead (see S‑3). |
| `@react-navigation/native` + a navigator (`native-stack` / `stack`) | matching your `react-navigation` v5 or v6 | Client-provided; auto view tracking (S‑3) attaches to your `NavigationContainer` |
| `react-native-screens`, `react-native-safe-area-context` | as required by your `react-navigation` version | Client-provided peers of `react-navigation` |
| **Android native artifacts** (Maven Central, transitive) | **1.0.1** | `com.motadata:motadata-rum-android` + `-trace` *(+ transitive `-core`, `-internal`, `-okhttp`, `-trace-api`, `-trace-internal`)* — nothing to add by hand |

## Prerequisites
- A React Native app **targeting Android** that meets the **[Supported versions](#supported-versions)** above.
- **View tracking depends on your navigation setup:** if your app uses **`react-navigation` (v5/v6)** — the
  standard for modern RN apps — install the nav package for **automatic** per‑screen views (S‑3). **If it does
  not**, skip the nav package and track views manually with `MdRum.startView`/`stopView` (see *“View tracking by
  navigation type”* in S‑3). Everything else — actions, resources, errors, long tasks, crashes — works the same
  either way.
- From the client's Motadata org: **RUM application id** and **client token**.
- **No credentials needed to fetch the SDK** — the JS packages are on **public npm** (no auth token), and the
  Android native SDK is on **Maven Central** (a default Gradle repository — no GitHub PAT).

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
      nativeLongTaskThresholdMs: 200, // native (Android) stalls > 200ms → long_task events
      sessionSampleRate: 100,    // % of SESSIONS sent (0–100); 100 = all. Lower to sample.
      useAccessibilityLabel: true, // use accessibilityLabel to name tap actions
      // vitals (CPU / memory / refresh-rate) are ON by default (vitalsUpdateFrequency: 'AVERAGE')
      // and ride on view events — no extra config needed.
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

### View tracking by navigation type — which path applies to *your* app
`@motadata365/mobile-react-navigation` provides **automatic** View events **only** for apps that use
[`react-navigation`](https://reactnavigation.org/) (v5/v6). This is the same integration model the SDK is
based on — auto view tracking ships for `react-navigation`; every other navigation setup uses **manual**
view calls. Pick the row that matches your app:

| Your app's navigation | View events | What to do |
|---|---|---|
| **`react-navigation`** (v5/v6) — most modern RN apps, incl. Expo Router (built on it) | **Automatic**, per screen | Install `@motadata365/mobile-react-navigation` and call `startTrackingViews` (this S‑3). No per‑screen code. |
| **`react-native-navigation`** (Wix) | Manual | Skip the nav package; call `MdRum.startView` / `stopView` from your navigation lifecycle. |
| **Custom / none** (e.g. state‑driven screen switching) | `ApplicationLaunch` view is always emitted automatically; everything else is manual | Skip the nav package; call `MdRum.startView` / `stopView` when each logical screen appears / disappears. |

> **Even with no navigation library, you are never at zero views** — the native SDK always emits the
> synthetic **`ApplicationLaunch`** view at startup, so actions/resources/errors that occur before your first
> real view still attach to a view. Automatic *per‑screen* views are what `react-navigation` adds.

**Manual view tracking (non‑`react-navigation` apps).** Mark each screen as it becomes visible and hide it
when it leaves — the `key` must be stable and match between `startView`/`stopView`:
```ts
import { MdRum } from '@motadata365/mobile-react-native';

// when a screen appears:
MdRum.startView('home-screen-key', 'Home');   // (key, viewName)
// when it disappears (navigating away):
MdRum.stopView('home-screen-key');
```

---

## Events produced (with the config above)
Following this SOP exactly, these RUM event types flow — no extra app code beyond the snippets above:

| `type` | Produced by | Enabled by |
|---|---|---|
| **view** | screen / route changes | S‑3 auto tracking (`MdRumReactNavigationTracking.startTrackingViews`) for `react-navigation` apps; `MdRum.startView`/`stopView` otherwise (see S‑3 matrix) |
| **action** | taps, long-presses | `trackInteractions: true` |
| **resource** | `fetch` / XHR network calls | `trackResources: true` |
| **error** | JS errors + native (Android/JVM) crashes | `trackErrors: true` + `nativeCrashReportEnabled: true` |
| **long_task** | JS stalls > 100ms, native stalls > 200ms | `longTaskThresholdMs: 100`, `nativeLongTaskThresholdMs: 200` |

> **⚠️ There is NO standalone `type: "vital"` event on React Native.** Performance vitals (CPU, memory,
> refresh rate, JS refresh rate) **do** flow — but as **fields on `view` events**
> (`view.cpu_ticks_per_second`, `view.memory_average`, `view.refresh_rate_average`, `view.js_refresh_rate.*`),
> not as separate events. They are on by default (`vitalsUpdateFrequency: 'AVERAGE'`).
>
> The native Android SDK additionally emits an `app_launch` (TTID) event of `type: "vital"`, but the React
> Native layer does **not** bridge it to JS — so **RN produces zero `type: "vital"` events** (this matches
> real field captures for the equivalent DataDog SDK versions this fork is based on). On React Native,
> app-launch timing is only visible as the synthetic **`ApplicationLaunch`** view's `view.time_spent`.

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
