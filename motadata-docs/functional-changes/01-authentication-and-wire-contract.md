# 01 — Authentication & wire contract

**Backend-consumed. Inherited from native, with RN wiring.**

The Motadata intake authenticates on the `md-api-key` query param. In the RN SDK the app developer passes a
`clientToken` in `DdSdkReactNativeConfiguration`; this crosses the TurboModule bridge to the native
`com.motadata:motadata-rum-android` SDK, which builds the intake URL:

```
<endpoint>/api/v2/rum?mdsource=react-native&md-api-key=<clientToken>&mdtags=...
```

## RN-side responsibilities
1. **Do not validate/strip the client token** on the JS side (it is any opaque string).
2. **Custom endpoint** — expose/verify the on-prem endpoint config reaches native `useCustomEndpoint`.
3. **Source value** — RN keeps its source override; rebranded it emits `mdsource=react-native`
   (see EVENT_TYPES). Backend confirmed to accept it.

## Verification (Phase 2)
Custom-endpoint run → confirm URL carries `mdsource=react-native` and `md-api-key=<token>`, no `dd`/`datadog`.
