# Progress log

## Phase 0 — Repo & CI bootstrap  (DONE, 2026-08-24)
- Studied Android reference (`md-sdk-android`) + upstream RN (`dd-sdk-reactnative`).
- Locked decisions: fork base **RN 3.5.3** (Android 3.10.0); **RUM-only** scope; wire source
  **`mdsource=react-native`** (backend confirmed); publish to **public npmjs** as `@motadata365/mobile-react-native`.
- Created repo `motadata2025/md-sdk-reactnative`; base = upstream `3.5.3` tree; single branch `motadata-dev`;
  remotes `origin`=Motadata, `upstream`=DataDog.
- Authored CI: `motadata-build`, `motadata-test`, `motadata-nodatadog`, `motadata-apidump`,
  `motadata-publish`, `codeql-analysis` (scoped to JS + Android core). Removed upstream `publish.yml`/`stale.yml`.
- Recreated `motadata-docs/` set.
- **Gate:** build + test green on the untouched 3.5.3 base (still DataDog-branded) before Phase 1.
  - `motadata-nodatadog` is EXPECTED RED here (base is DataDog) — dispatch-only until Phase 1.

## Phase 1 — Rebrand / zero-datadog  (DONE, 2026-08-24)
- Trimmed workspace to `packages/core` only (removed 9 sibling packages, example apps, benchmarks, entire iOS
  surface + podspec, stale datadog helper scripts). RUM-only: dropped Logs/Flags (JS classes + native), NDK,
  WebView passthrough; SessionReplay/WebView packages not shipped.
- Rebranded JS + Android: `@datadog/mobile-react-native`→`@motadata365/mobile-react-native`, `Datadog`→`Motadata`,
  `Dd`→`Md` (incl. TurboModule keys MdSdk/MdRum/MdTrace), package `com.datadog.reactnative`→`com.motadata.reactnative`.
- Repointed Android Gradle deps to `com.motadata:motadata-rum-android:1.0.1` (+ `-trace`), verified on Maven Central.
- Kept `_dd.*` contract keys (frozen native SDK reads them; native does the `_dd`→`_md` wire rebrand). Gate
  whitelists Apache header only; `_dd.*` intentionally not forbidden. `TracingHeaderType.DATADOG` propagator case
  dropped (native enum keeps DATADOG; would collide with gate) — RN supports b3/b3multi/tracecontext.
- Local no-datadog gate dry-run: PASS. TurboModule names consistent JS↔Kotlin.
- **CI GREEN (commit db6a6143):** Build (JS + Android AAR), Test (lint+jest + Android unit tests),
  No-Datadog gate, CodeQL all pass. RN Kotlin/JS compiles against com.motadata:motadata-rum-android:1.0.1.
- Iteration fixes applied: test forge factories dd/Dd→md/Md (native model rebranded); eslint autofix
  (import-ordering + prettier) via motadata-lint-fix workflow; inlined jest native-module mocks (dropped
  react-native-gesture-handler dep); rebranded __mocks__/react-native.ts to Md* module names.

## Phase 2 — Functional wiring / verification  (DONE, 2026-08-24)
- Result: **no functional RN code change required** — all wire behavior is inherited from the frozen native
  `com.motadata:motadata-rum-android:1.0.1`; the RN bridge only supplies config, which is already wired.
- Code-verified + green in CI:
  - `mdsource=react-native`: `buildConfiguration` sets `_dd.source='react-native'` → native emits it.
    Asserted in `MdSdkReactNative.test.tsx` (additionalConfiguration strict-equals with `_dd.source`).
  - `md-api-key`: `clientToken` passed to native config (asserted in same test).
  - custom endpoint: `rum/traceConfiguration.customEndpoint` → `MdSdkConfigurationExt.kt` → native useCustomEndpoint.
  - `session.created` / `_md.document_version`: emitted by native RUM automatically (no RN code).
  - `_timing` / `is_view_completed`: NOT ported (backend ignores).
- Docs updated: EVENT_TYPES.md (Phase 2 verification), functional-changes/README.md.
- Follow-up (optional): live wire capture via an example app + emulator CI job (deferred; artifacts already
  backend-verified, RN contract code+CI verified).

## Phase 3 — Publish  (DONE, 2026-08-25)
- npm scope corrected `@motadata` → **`@motadata365`** (user's account `motadata365` owns that user-scope;
  0 orgs, so `@motadata` would 403; matches their `@motadata365/browser-rum-react` web SDK). CI green @ a97572f6.
- Tarball hygiene: `.npmignore` is inert under a `files` allowlist → switched to **files-array negation**
  (`!src/**/__tests__/**`, `!src/**/*.test.*`, etc.) + `android/src/**`→`android/src/main/**`. Tarball
  899 files / 327 kB packed / 1.8 MB unpacked (was 987 / 421 kB / 2.6 MB); 0 test files ship; android/src/main
  bridge Kotlin ships. CI green @ e07e411a.
- Dry-run (×3) green, then real publish green (run 32823635978).
- **LIVE on npmjs: `@motadata365/mobile-react-native@1.0.0`** (tag `latest`, public). Verified via `npm view`
  (tarball at registry.npmjs.org, unpackedSize 1,778,204).

## Core "Done" criteria met (2026-08-25)
- (a) zero non-legal datadog on shipped surfaces (gate green), (b) RN Android resolves com.motadata deps +
  backend-compatible wire (inherited from frozen native 1.0.1), (c) build+tests green on CI, (d) npm published from CI.

## Second-round scope (2026-08-25): match DataDog's RN onboarding flow, nothing extra
DataDog's official RN setup (Application Management screenshots) uses exactly TWO packages: core + react-navigation
(auto View tracking). Core shipped. Adding ONLY the navigation package. NOT porting apollo/babel/codepush/
session-replay/webview/openfeature. Snippet rebranded for Motadata w/ on-prem `customEndpoint`; RUM-only (no
`nativeCrashReportEnabled`/`logsConfiguration`). Deliverable also: detailed client SOP mirroring Android SOP.

## Phase 4 — Port @motadata365/mobile-react-navigation  (DONE, 2026-08-25, CI green @ 007e40f7)
- Restored `packages/react-navigation` from upstream tag 3.5.3; full rebrand: `@datadog/mobile-react-navigation`
  →`@motadata365/mobile-react-navigation`, `DdRumReactNavigationTracking`→`MdRumReactNavigationTracking`, core
  import→`@motadata365/mobile-react-native`, `com.datadog.reactnative`→`com.motadata.reactnative`; rewrote the
  `github.com/DataDog/dd-sdk-reactnative` comment URL (would trip gate); rewrote package.json/README; deleted
  DataDog `release-content.txt`; version 1.0.0. JS-only — NO native/Gradle.
- Wired into yarn workspaces + jest.projects + lerna.json + tsconfig paths; extended no-datadog gate
  (`packages/react-navigation/src` + package.json) and publish workflow (2nd publish step).
- Tarball hygiene: files-array negation (same pattern as core).
- CI fixes: wrapped multi-specifier import for prettier; added `fix-react-navigation-import-in-dependencies.sh`
  step to test workflow (stack-v5/v6 alias `@react-navigation/native`→native-v5/v6).
- **CI GREEN**: Build ✅ Test ✅ (675 tests, +76 nav, suite PASS) No-Datadog ✅ CodeQL ✅. NOT yet published.

## Remaining
- Phase 5: rebranded snippet + `MOTADATA_REACTNATIVE_CLIENT_SOP.md` (mirror Android SOP).
- Phase 6: publish `@motadata365/mobile-react-navigation@1.0.0` (dry-run→real) + end-to-end verify.
- Deferred/optional: live wire capture; cosmetic lowercase `dd`/`__ddExtractText` rename; iOS.

---
_Check-in required between every phase (STOP for go-ahead)._
