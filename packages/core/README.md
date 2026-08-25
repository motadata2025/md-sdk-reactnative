# Motadata React Native Monitoring

Motadata *Real User Monitoring (RUM)* enables you to visualize and analyze the real-time performance
and user journeys of your application's individual users. This is the **core** package of the Motadata
React Native RUM SDK (Android).

> For automatic screen/View tracking with `react-navigation`, also install
> [`@motadata365/mobile-react-navigation`](https://www.npmjs.com/package/@motadata365/mobile-react-navigation).
>
> **Full step-by-step integration guide:** see `MOTADATA_REACTNATIVE_CLIENT_SOP.md` in the
> [repository](https://github.com/motadata2025/md-sdk-reactnative).

## Setup

To install with NPM, run:

```sh
npm install @motadata365/mobile-react-native
```

To install with Yarn, run:

```sh
yarn add @motadata365/mobile-react-native
```

**Requirements**: React Native `>=0.63.4 <1.0`, React `>=16.13.1`, Android `minSdkVersion >= 24`.

### Prerequisites

From the client's Motadata org you need a **RUM application id** and a **client token**. The client
token becomes the `md-api-key` on the wire — do not use a server-side API key in a mobile app.

### Initialize the library

Point the SDK at your Motadata intake with `customEndpoint`. This is an Android RUM-only build.

```js
import {
    MotadataProvider,
    MotadataProviderConfiguration,
    TrackingConsent
} from '@motadata365/mobile-react-native';

const motadataConfiguration = new MotadataProviderConfiguration(
    '<MOTADATA_CLIENT_TOKEN>',   // becomes md-api-key on the wire
    '<ENVIRONMENT_NAME>',        // e.g. 'prod', 'staging', 'dev'
    TrackingConsent.GRANTED,
    {
        additionalConfiguration: {
            '_dd.needsClearTextHttp': true // HTTP endpoint only — remove for https://
        },
        rumConfiguration: {
            applicationId: '<MOTADATA_RUM_APPLICATION_ID>',
            customEndpoint: 'http://<your-motadata-host>:<port>/api/v2/rum/',
            trackInteractions: true, // taps/clicks → action events
            trackResources: true,    // XHR/fetch → resource events
            trackErrors: true,       // JS errors → error events
            nativeCrashReportEnabled: true, // native (Android/JVM) crashes → error events
            trackNonFatalAnrs: true,
            longTaskThresholdMs: 100,
            sessionSampleRate: 100
        },
        traceConfiguration: {}
    }
);

export default function App() {
    return (
        <MotadataProvider configuration={motadataConfiguration}>
            <Navigation />
        </MotadataProvider>
    );
}
```

### Track view navigation

Views can be tracked automatically with
[`@motadata365/mobile-react-navigation`](https://www.npmjs.com/package/@motadata365/mobile-react-navigation)
(recommended). You can also start/stop Views manually:

```js
import { MdRum } from '@motadata365/mobile-react-native';

// Start a view with a unique view identifier, a custom view url, and additional attributes
MdRum.startView('ViewKey', 'ViewName', Date.now(), { 'custom.foo': 'something' });
// Stop a previously started view with the same identifier, and additional attributes
MdRum.stopView('ViewKey', Date.now(), { 'custom.bar': 42 });
```

## Scope

This build is **Android + RUM only** (views, actions, resources, errors, long tasks, native crashes,
and distributed tracing). Logs, Session Replay, WebView tracking, NDK (C/C++) crash reporting, and
Feature Flags are not included.

## Data Storage (Android)

Before data is uploaded to your Motadata endpoint, it is stored in cleartext in your application's cache
directory. This cache folder is protected by [Android's Application Sandbox][1], meaning that on most
devices this data can't be read by other applications. However, if the mobile device is rooted, or
someone tampers with the linux kernel, the stored data might become readable.

[1]: https://source.android.com/security/app-sandbox
