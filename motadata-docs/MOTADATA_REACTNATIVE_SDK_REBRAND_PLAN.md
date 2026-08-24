# Motadata React Native RUM SDK — Rebrand Plan (Android-only round)

> Status: **DECISIONS LOCKED — awaiting go-ahead to start Phase 0.** Nothing forked/pushed/changed yet.
>
> **Locked decisions (2026-08-24):** (1) Fork base = RN **`3.5.3`** tag (Android 3.10.0).
> (2) **RUM-only** — remove Logs/NDK/Flags; don't ship SessionReplay/WebView packages.
> (3) Wire source = **`mdsource=react-native`** (keep RN's distinct source; ⚠ requires backend to accept
> `react-native` — this deviates from the original DoD `mdsource=android`; see Risk #3).
> (4) npm publish → **public npmjs** as `@motadata/mobile-react-native` (needs `NPM_TOKEN` secret, user-provided).
> Target repo: `motadata2025/md-sdk-reactnative` (does not exist yet — created in Phase 0).
> Single working branch: **`motadata-dev`** (rebrand + functional both land here).
> Upstream (read-only ancestry): `DataDog/dd-sdk-reactnative`.
> Golden rule: **nothing compiles locally** — all build/test/publish run on GitHub Actions via `gh`.

---

## 0. End goal (unchanged)

A Motadata-branded RN RUM SDK published to npm (`npm install @motadata/<pkg>`). On Android its native
bridge depends on the **already-published, FROZEN** `com.motadata:motadata-rum-android-*:1.0.1` artifacts
(Maven Central), so the app emits Motadata wire the backend already accepts (`mdsource=android`,
`md-api-key`, `session.created`, `_md.document_version`). Done = (a) zero non-legal "datadog" on shipped
surfaces, (b) RN Android build resolves the `com.motadata` deps and emits backend-compatible wire,
(c) build + tests green on CI, (d) npm package published from CI. **iOS deferred.**

---

## 1. Key findings from STEP 1–4 (the facts that shape this plan)

### 1.1 Upstream RN architecture
- Lerna monorepo (`packages/*`), current `develop` = `3.6.0`. The **installable core SDK** app devs use is
  `@datadog/mobile-react-native` (`packages/core`). It bridges JS ↔ native via **TurboModule specs**
  (`packages/core/src/specs/Native*.ts`); Kotlin impl under `com.datadog.reactnative`.
- Only **3 packages ship native Android**: `core`, `react-native-session-replay`, `react-native-webview`
  (+ `internal-testing-tools`, test-only). The other 6 packages are JS-only integrations.
- `source` is hardcoded `"react-native"` in JS (`DdSdkReactNative.tsx`, `DD_SOURCE_KEY='_dd.source'`)
  **and** Kotlin (`DdSdkConfigurationExt.kt`), plus error-source-type in 3 more JS files. This drives both
  the `_dd.source` event field **and** the `ddsource` query param.
- iOS is cleanly separable: Android (Gradle) and iOS (CocoaPods `.podspec`) are independent, wired only
  through shared JS specs. Publishing JS + Android without iOS is feasible.
- Upstream CI: build/test/lint on **GitLab**; **npm publish** via GitHub Actions `publish.yml`
  (`lerna publish from-package` → public npmjs, OIDC, manual `workflow_dispatch`); CodeQL on GH.

### 1.2 Android reference (`md-sdk-android`, FROZEN)
- Fork of `dd-sdk-android` **3.10.0** → `com.motadata` group, published **1.0.1** to Maven Central.
- **Two-branch model** there (B1 `motadata-dev`=rebrand-only=1.0.0; B2 `...-with-functional-changes`=1.0.1).
  For **RN we use ONE branch `motadata-dev`** (rebrand + functional together) — per fixed decisions.
- Rebrand token map (inherited concept): `com.datadog.android.*`→`com.motadata.android.*`; facade
  `Datadog`→`Motadata`; `_dd`→`_md`; `ddtags`→`mdtags`; `ddsource`→`mdsource`; `DD-*` headers→`MD-*`;
  logcat `DD_LOG`/`Datadog`→`MD_LOG`/`Motadata`; group `com.datadoghq`→`com.motadata`; artifacts
  `dd-sdk-android-*`→`motadata-rum-android*`. **`source` VALUE stays `"android"`** (no "datadog" in it).
- Legal exception kept everywhere: the Apache-2.0 attribution header
  (`This product includes software developed at Datadog` / `Copyright … Datadog, Inc.`) — source only,
  never on the wire. This is the ONLY whitelisted "datadog" string.
- **No automated no-datadog CI gate existed** in the Android repo — it was manual/skill-based logcat
  inspection. For RN we will *build a real grep-based CI gate* (improvement).

### 1.3 The published Motadata Android artifacts (what we can depend on) — 7 total
`com.motadata` @ `1.0.1`, live on Maven Central:

| Motadata artifact | rebrand of DataDog artifact |
|---|---|
| `motadata-rum-android`          | `dd-sdk-android-rum` (umbrella coordinate — **no `-rum` suffix**) |
| `motadata-rum-android-core`     | `dd-sdk-android-core` |
| `motadata-rum-android-internal` | `dd-sdk-android-internal` |
| `motadata-rum-android-trace`    | `dd-sdk-android-trace` |
| `motadata-rum-android-trace-api`| `dd-sdk-android-trace-api` |
| `motadata-rum-android-trace-internal` | `dd-sdk-android-trace-internal` |
| `motadata-rum-android-okhttp`   | `dd-sdk-android-okhttp` |

**The Motadata Android SDK is RUM-focused** (RUM + distributed trace + okhttp resource tracking + core +
internal). It did **NOT** publish: `logs`, `webview`, `ndk`, `flags`, `session-replay`.

### 1.4 Version alignment (decisive)
RN↔native pinning (from `NATIVE_SDK_VERSIONS.md`):

| RN version | Android native pinned |
|---|---|
| 3.6.0, 3.5.4 | **3.12.1** |
| **3.5.0–3.5.3** | **3.10.0** ← matches Motadata's fork base |
| 3.4.0 & older | 3.8.0 and older |

Motadata `1.0.1` is internally `dd-sdk-android 3.10.0`. The RN bridge Kotlin is written against whatever
native version it pins. **To make the bridge compile against Motadata's 3.10.0-based APIs with minimal
fixups, fork from the RN `3.5.3` tag** (highest RN still on Android 3.10.0). Using `develop`/3.6.0 (3.12.1)
would create an API skew between the bridge and Motadata's artifacts — extra breakage risk for no benefit.

---

## 2. THE DEPENDENCY MAPPING TABLE (repoint plan for the Android bridge)

Basis: RN `3.5.3` tag. `implementation project(...)` inter-package deps are unchanged.

| RN package | Current coord (`com.datadoghq:…:3.10.0`) | Repoint to (`com.motadata:…:1.0.1`) | Status |
|---|---|---|---|
| **core** | `dd-sdk-android-rum` | `motadata-rum-android` | ✅ mapped |
| **core** | `dd-sdk-android-trace` | `motadata-rum-android-trace` | ✅ mapped |
| **core** | `dd-sdk-android-logs` | — (no Motadata artifact) | ❌ **GAP** |
| **core** | `dd-sdk-android-webview` | — | ❌ **GAP** |
| **core** | `dd-sdk-android-ndk` | — | ❌ **GAP** |
| **core** | `dd-sdk-android-flags` | — | ❌ **GAP** |
| core (transitive) | `dd-sdk-android-core` / `-internal` / `-okhttp` / `-trace-api` / `-trace-internal` | `motadata-rum-android-core` / `-internal` / `-okhttp` / `-trace-api` / `-trace-internal` | ✅ (pulled via POMs) |
| react-native-session-replay | `dd-sdk-android-session-replay`, `-internal` | — | ❌ **GAP** (drop package) |
| react-native-webview | `dd-sdk-android-webview` | — | ❌ **GAP** (drop package) |
| internal-testing-tools | `dd-sdk-android-core` | `motadata-rum-android-core` | ✅ (test-only) |

**Consequence:** the shipped Motadata RN SDK this round = **the `core` package only, scoped to RUM
(+ trace + okhttp resource tracking)**. The gap modules must be removed/guarded (see §3), and
`session-replay` / `webview` packages are **not shipped** this round.

---

## 3. FUNCTIONAL CHANGES — implement vs skip vs inherited

Because the RN Android bridge depends on the already-functionally-changed native `1.0.1`, most wire
behavior is **inherited** from the native artifact. RN-side work is mostly config wiring + verification.

| Change | Backend uses it? | Where it comes from | RN-side action |
|---|---|---|---|
| `md-api-key` query param (auth) | **YES** | Native builds the intake URL from the client token | **Wire only** — pass `clientToken` across the bridge (already done); ensure JS doesn't strip/validate it. Verify. |
| `mdsource=react-native` | **YES (assumed)** | Native request factory uses the SDK `source` value | **LOCKED** — keep RN's `source` override, rebranded → emits `mdsource=react-native`. ⚠ Requires backend to accept `react-native` source (deviates from DoD `android`). Verify in Phase 2. |
| `session.created` (epoch ms) | **YES** | Native RUM emits automatically | **Inherited** — verify on wire, no code. |
| `_md.document_version` | **YES** | Native `_dd`→`_md` rebrand, rides in `_md` | **Inherited** — verify on wire, no code. |
| custom endpoint (on-prem) | n/a (transport) | Native `useCustomEndpoint` | **Wire only** — RN config already supports it; verify it reaches native. |
| `context._timing` | **NO (ignored)** | Native may still emit | **Skip** — no RN work; rides along harmlessly. |
| `view.is_view_completed` | **NO (ignored)** | Native may still emit | **Skip** — no RN work; rides along harmlessly. |
| unused extras (`MD-API-KEY` header, `MD-EVP-ORIGIN-VERSION`, `MD-REQUEST-ID`, `MD-IDEMPOTENCY-KEY`, `mdtags`) | **NO** | Native | **Skip** — debrand renames survive; add no logic. |

**Net RN functional work (Phase 2) is small:** confirm `clientToken`→`md-api-key` path, set/verify
`mdsource=android`, confirm custom endpoint wiring, and verify `session.created` + `_md.document_version`
reach the wire. `_timing` and `is_view_completed` are **not ported** (backend ignores them).

---

## 4. Android-only scoping decision (written down)

- **iOS is out of scope this round.** The RN iOS native path (podspecs referencing `Datadog*` pods) is
  **left unshipped/guarded, not rebranded**. Options to keep the npm package Android-clean:
  remove `ios/**` + `.podspec` from the core package `files` array (so npm ships JS + Android only), and
  document iOS as a follow-up (requires forking a native iOS SDK first). The no-datadog gate is scoped to
  **shipped surfaces only** (JS lib output + `core/android`), explicitly excluding the unshipped iOS path.
- **Feature scope this round = RUM** (DdRum) + distributed trace + okhttp resource tracking, backed by the
  7 Motadata artifacts. **Not shipped this round** (no Motadata native artifact): Logs (DdLogs on Android),
  Session Replay, WebView tracking, NDK crash reporting, Feature Flags. See Open Q #2 for how to handle
  their JS API surface (drop vs JS-guard/no-op).

---

## 5. PHASES (all on branch `motadata-dev`)

### Phase 0 — Repo & CI bootstrap
- Create `motadata2025/md-sdk-reactnative` (empty), push upstream `3.5.3` tree as base, set remotes
  (`origin`=Motadata, `upstream`=DataDog), cut single branch **`motadata-dev`**.
- Author GH Actions pipelines scoped to **JS + Android**:
  - `motadata-build.yml` — JS build (yarn, genversion, tsc/lib) + Android `assembleDebug` of `core`.
  - `motadata-test.yml` — JS unit tests (jest) + Android `testDebugUnitTest` for `core`.
  - `motadata-publish.yml` — npm publish of the core package (see Open Q #4 for registry/token).
  - `motadata-apidump.yml` — JS API-surface snapshot (api-extractor or the repo's existing API check).
  - `codeql-analysis.yml` — JS CodeQL.
  - `motadata-nodatadog.yml` — **new** grep gate: fail if `datadog`/`dd-sdk`/`DD-`/`ddsource`/`_dd`
    appears in shipped surfaces, whitelisting exactly the Apache-2.0 header.
- Recreate `motadata-docs/` set: this REBRAND_PLAN, PROGRESS, EVENT_TYPES (wire), WORKFLOW (CI runbook),
  ONBOARDING, CLIENT_SOP, functional-changes/, and a NATIVE_SDK_VERSIONS note.
- **Gate:** build + tests green on the untouched base before Phase 1.

### Phase 1 — Rebrand / "zero datadog" (branch `motadata-dev`)
- npm scope/name `@datadog/mobile-react-native` → `@motadata/mobile-react-native` (+ internal refs).
- JS/TS symbols, imports, `_dd`→`_md`, `DD-*`→`MD-*`, `ddsource`→`mdsource`, `ddtags`→`mdtags`,
  User-Agent/log strings; keep Apache-2.0 header.
- Native Android bridge: package/namespace `com.datadog.reactnative`→`com.motadata.reactnative`, class
  renames, and **repoint Gradle coords to `com.motadata:motadata-rum-android*:1.0.1`** per §2.
- **Remove gap modules** from `core/android/build.gradle` (`logs`, `webview`, `ndk`, `flags`) and their
  bridge impls / config so Android compiles against Motadata artifacts only. Handle their JS API per
  Open Q #2. Do **not** ship `session-replay` / `webview` packages this round.
- Repoint the version helper scripts (`bump-native-dd-sdk.sh`, `update-native-sdk-versions.sh`).
- Wire up the no-datadog gate.
- **Gate:** build + tests green + no-datadog gate green on CI before Phase 2.

### Phase 2 — Functional (same branch `motadata-dev`, after Phase 1 green)
- Only what STEP 3 found is NOT inherited:
  - Set/verify `source` → `mdsource=android` (Open Q #3).
  - Confirm `clientToken`→`md-api-key` reaches native and isn't stripped.
  - Confirm custom endpoint wiring reaches native.
  - Verify `session.created` + `_md.document_version` on the wire (sample app / event inspection).
- Explicitly document `_timing` and `is_view_completed` are NOT ported (backend ignores).
- **Gate:** build + tests green; wire verified; npm publish dry-run/real per Open Q #4.

---

## 6. CI / automation model
- **CI-only, `gh`-driven.** No local compiles. Push to `motadata-dev` → `gh workflow run` / watch runs.
- npm publish from CI (Open Q #4 decides registry + token secret).
- Every phase ends with a green CI run + a short report, then **STOP for go-ahead**.

---

## 7. DECISIONS (locked) + RESIDUAL RISKS

1. **Fork base = RN `3.5.3` tag** (Android 3.10.0, matches Motadata's fork base). ✅ LOCKED.
2. **RUM-only.** Remove Logs/NDK/Flags bridge + deps from `core`; do **not** ship SessionReplay/WebView
   packages. ✅ LOCKED.
3. **Wire source = `mdsource=react-native`.** ✅ LOCKED. ⚠ **Residual risk:** deviates from the original
   DoD (`mdsource=android`). Requires the Motadata backend intake to accept `react-native` as a valid
   `mdsource`. **Must confirm with backend before/at Phase 2 wire verification** — if the backend rejects
   or drops `react-native`-sourced events, we revisit this decision.
4. **npm publish = public npmjs**, package `@motadata/mobile-react-native`. ✅ LOCKED. Needs an
   `NPM_TOKEN` org automation secret on the repo — **user to provide** before the publish step.
5. **Version-skew residual risk:** even at 3.5.3 there may be minor bridge fixups after removing gap
   modules; caught by the CI build in Phase 1.
6. **Backend acceptance:** RN Android emits Motadata wire from the native SDK; `session.created`,
   `_md.document_version`, `md-api-key` are backend-consumed. Only the `mdsource=react-native` value
   (Risk #3) is the open backend dependency.
