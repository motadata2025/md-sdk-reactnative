# Progress log

## Phase 0 — Repo & CI bootstrap  (in progress, 2026-08-24)
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

## Phase 1 — Rebrand / zero-datadog  (not started)
## Phase 2 — Functional wiring / verification  (not started)

---
_Check-in required between every phase (STOP for go-ahead)._
