# Progress log

## Phase 0 — Repo & CI bootstrap  (DONE, 2026-08-24)
- Studied Android reference (`md-sdk-android`) + upstream RN (`dd-sdk-reactnative`).
- Locked decisions: fork base **RN 3.5.3** (Android 3.10.0); **RUM-only** scope; wire source
  **`mdsource=react-native`** (backend confirmed); publish to **public npmjs** as `@motadata/mobile-react-native`.
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
- Rebranded JS + Android: `@datadog/mobile-react-native`→`@motadata/mobile-react-native`, `Datadog`→`Motadata`,
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

## Phase 2 — Functional wiring / verification  (not started)

---
_Check-in required between every phase (STOP for go-ahead)._
